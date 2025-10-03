"""
CPU-only chat video renderer for Camber + Appwrite

Features
- Input JSON: messages with sender, text, timestamp
- Portrait iMessage-style UI; messages slide in
- Keyboard clicks before each message, send/receive chime at appearance
- Outputs MP4 (1080x1920, 30fps) using libx264 crf=23 preset=veryfast
- Optional audio assets autodetected under ./assets/audio or ./assets/sounds
- Falls back to synthesized audio (sine/noise) if assets not found
- Appwrite upload helper to store the final MP4

Public API
- render_chat_video(conversation_json: dict, output_path: str) -> dict

CLI
python renderer.py --input examples/conversation.json --output /tmp/out.mp4 \
  --upload --appwrite-endpoint https://cloud.appwrite.io/v1 \
  --appwrite-project YOUR_PROJECT --appwrite-key YOUR_API_KEY \
  --bucket-id YOUR_BUCKET

Notes
- Optimized for CPU on Camber: avoids browser; uses Pillow + MoviePy
- Pre-renders text bubbles with Pillow once; animates via MoviePy
- For short clips (<60s), target render < 2 minutes on 1 vCPU
"""

from __future__ import annotations

import json
import math
import os
import sys
import tempfile
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont
# MoviePy import compatible with both 1.x and 2.x
try:
    # MoviePy 1.x (and many 2.x builds)
    from moviepy.editor import (
        ImageClip,
        CompositeVideoClip,
        AudioFileClip,
        CompositeAudioClip,
    )
except Exception:
    try:
        # MoviePy 2.x sometimes exposes classes at top-level
        from moviepy import ImageClip, CompositeVideoClip, AudioFileClip, CompositeAudioClip  # type: ignore
    except Exception:
        try:
            # Some 2.x builds still provide an 'editor' module imported differently
            from moviepy import editor as mp  # type: ignore
            ImageClip = mp.ImageClip  # type: ignore
            CompositeVideoClip = mp.CompositeVideoClip  # type: ignore
            AudioFileClip = mp.AudioFileClip  # type: ignore
            CompositeAudioClip = mp.CompositeAudioClip  # type: ignore
        except Exception as e:  # Provide a clear error
            raise ModuleNotFoundError(
                "MoviePy is installed but neither 'moviepy.editor' nor top-level classes "
                "could be imported. Try 'pip install moviepy==1.0.3' (classic API) or ensure "
                "no local 'moviepy.py' shadows the package."
            ) from e
from pydub import AudioSegment


# -------------------------
# Configuration
# -------------------------

W = 1080
H = 1920  # Portrait (phone look). Change to 1920x1080 if desired.
FPS = 30
BG_COLOR = (245, 247, 252)  # soft off-white
HEADER_BAR_H = 110
CONTENT_TOP = HEADER_BAR_H + 30
SIDE_PADDING = 64
LINE_SPACING = 12
MSG_SPACING = 22
MAX_BUBBLE_W = int(W * 0.74)

# iMessage-like colors
THEM_BG = (235, 240, 248)
YOU_BG = (55, 127, 241)  # iMessage blue
YOU_TEXT = (255, 255, 255)
THEM_TEXT = (28, 33, 44)

# Fonts
DEFAULT_FONT_FAMILY = "DejaVuSans.ttf"  # often available in Linux containers
DEFAULT_FONT_SIZE = 42
FONT_BOLD = None  # can be set to a bold font file if available


@dataclass
class Message:
    sender: str  # "you" | "them"
    text: str
    timestamp: Optional[float] = None  # seconds from start (optional)


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        os.environ.get("CHAT_FONT_BOLD" if bold else "CHAT_FONT"),
        FONT_BOLD if bold else None,
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else \
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        DEFAULT_FONT_FAMILY,
    ]
    for path in candidates:
        if not path:
            continue
        try:
            return ImageFont.truetype(path, size=size)
        except Exception:
            continue
    # Fallback to PIL default
    return ImageFont.load_default()


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
    words = text.split()
    if not words:
        return [""]
    lines: List[str] = []
    cur = words[0]
    for w in words[1:]:
        if draw.textlength(cur + " " + w, font=font) <= max_width:
            cur += " " + w
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def _render_bubble_image(text: str, sent: bool, max_width: int) -> Image.Image:
    font = _load_font(DEFAULT_FONT_SIZE)
    draw_dummy = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    lines = _wrap_text(draw_dummy, text, font, max_width - 48)

    # Measure
    line_heights = [font.getbbox(line)[3] - font.getbbox(line)[1] for line in lines]
    text_h = sum(line_heights) + (len(lines) - 1) * LINE_SPACING
    text_w = max(draw_dummy.textlength(line, font=font) for line in lines)
    pad_x = 28
    pad_y = 22
    bubble_w = int(min(max_width, text_w + pad_x * 2))
    bubble_h = int(text_h + pad_y * 2)

    # Bubble
    bg = YOU_BG if sent else THEM_BG
    fg = YOU_TEXT if sent else THEM_TEXT
    radius = 28
    img = Image.new("RGBA", (bubble_w, bubble_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Rounded rectangle
    d.rounded_rectangle([(0, 0), (bubble_w, bubble_h)], radius=radius, fill=bg)

    # Text
    y = pad_y
    for i, line in enumerate(lines):
        d.text((pad_x, y), line, font=font, fill=fg)
        y += (font.getbbox(line)[3] - font.getbbox(line)[1]) + LINE_SPACING
    return img


def _find_audio_assets() -> Dict[str, Optional[str]]:
    """Return paths for click/send/receive if found, else None."""
    candidates = [
        os.path.join(os.getcwd(), "assets", "audio"),
        os.path.join(os.getcwd(), "assets", "sounds"),
        os.path.join(os.path.dirname(__file__), "assets", "audio"),
        os.path.join(os.path.dirname(__file__), "assets", "sounds"),
    ]
    names = {
        "click": ["click.wav", "click.mp3"],
        "send": ["send.wav", "send.mp3", "chime_send.wav"],
        "receive": ["receive.wav", "receive.mp3", "chime_receive.wav"],
    }
    found: Dict[str, Optional[str]] = {"click": None, "send": None, "receive": None}
    for base in candidates:
        if not os.path.isdir(base):
            continue
        for k, lst in names.items():
            if found[k]:
                continue
            for nm in lst:
                p = os.path.join(base, nm)
                if os.path.isfile(p):
                    found[k] = p
                    break
    return found


def _synth_click(duration_ms: int = 50, freq: float = 1200.0) -> AudioSegment:
    sr = 44100
    t = np.linspace(0, duration_ms / 1000.0, int(sr * duration_ms / 1000.0), False)
    wave = 0.4 * np.sin(2 * np.pi * freq * t) * np.hanning(t.size)
    samples = (wave * 32767).astype(np.int16)
    return AudioSegment(samples.tobytes(), frame_rate=sr, sample_width=2, channels=1)


def _synth_chime(duration_ms: int = 220) -> AudioSegment:
    sr = 44100
    t = np.linspace(0, duration_ms / 1000.0, int(sr * duration_ms / 1000.0), False)
    base = 0.35 * np.sin(2 * np.pi * 880 * t) * np.hanning(t.size)
    overtone = 0.15 * np.sin(2 * np.pi * 1320 * t) * np.hanning(t.size)
    wave = base + overtone
    samples = (wave * 32767).astype(np.int16)
    return AudioSegment(samples.tobytes(), frame_rate=sr, sample_width=2, channels=1)


def _build_audio_timeline(messages: List[Message], total_duration: float) -> AudioSegment:
    assets = _find_audio_assets()
    click = (
        AudioSegment.from_file(assets["click"]) if assets["click"] else _synth_click()
    )
    send_chime = (
        AudioSegment.from_file(assets["send"]) if assets["send"] else _synth_chime()
    )
    recv_chime = (
        AudioSegment.from_file(assets["receive"]) if assets["receive"] else _synth_chime()
    )

    timeline = AudioSegment.silent(duration=int(total_duration * 1000) + 500)
    # Schedule: simulate 4–8 clicks before each message, then a chime at message time
    for m in messages:
        t0_ms = int(max(0.0, (m.timestamp or 0.0) * 1000))
        clicks = max(4, min(8, max(4, len(m.text) // 8)))
        step = 35  # ms between clicks
        # Type clicks leading into the message
        start_click = max(0, t0_ms - clicks * step)
        for i in range(clicks):
            timeline = timeline.overlay(click - 6, position=start_click + i * step)
        # Chime at t0
        timeline = timeline.overlay(send_chime - 4 if m.sender == "you" else recv_chime - 4, position=t0_ms)
    return timeline


def render_chat_video(conversation_json: Dict, output_path: str,
                      width: int = W, height: int = H, fps: int = FPS) -> Dict[str, float]:
    """Render the chat video.

    Parameters
    - conversation_json: dict with {"messages": [{"sender":"you|them","text":"...","timestamp":float?}], ...}
    - output_path: final mp4 path
    - width/height/fps: rendering settings (default portrait 1080x1920 @ 30fps)

    Returns: {"duration": seconds}
    """
    try:
        raw_msgs = conversation_json.get("messages", [])
        if not isinstance(raw_msgs, list) or not raw_msgs:
            raise ValueError("Invalid or empty messages array")
        msgs: List[Message] = []
        t = 0.8  # initial delay for the first bubble
        for rm in raw_msgs:
            sender = str(rm.get("sender", "them")).lower()
            if sender not in ("you", "them"):
                sender = "them"
            text = str(rm.get("text", "")).strip()
            if not text:
                continue
            timestamp = rm.get("timestamp")
            if timestamp is None:
                # Auto-lay out: add time proportional to length
                t += max(1.0, min(3.0, len(text) / 18.0))
                timestamp = t
            else:
                timestamp = float(timestamp)
                t = timestamp
            msgs.append(Message(sender=sender, text=text, timestamp=timestamp))

        # Pre-render bubbles
        y_cursor = CONTENT_TOP
        clips: List[ImageClip] = []
        final_times: List[float] = []

        # Compatibility helpers across MoviePy versions
        def make_image_clip(img, duration: float):
            try:
                return ImageClip(img, duration=duration)
            except TypeError:
                c = ImageClip(img)
                if hasattr(c, "set_duration"):
                    return c.set_duration(duration)
                if hasattr(c, "with_duration"):
                    return c.with_duration(duration)
                return c

        def clip_set_start(c, t: float):
            if hasattr(c, "set_start"):
                return c.set_start(t)
            if hasattr(c, "with_start"):
                return c.with_start(t)
            return c

        def clip_set_position(c, pos):
            if hasattr(c, "set_position"):
                return c.set_position(pos)
            if hasattr(c, "with_position"):
                return c.with_position(pos)
            return c
        for m in msgs:
            bubble_img = _render_bubble_image(m.text, sent=(m.sender == "you"), max_width=MAX_BUBBLE_W)
            bubble_np = np.array(bubble_img)
            iclip = make_image_clip(bubble_np, duration=9999)

            # Compute target x/y positions
            if m.sender == "you":
                x_target = W - SIDE_PADDING - bubble_img.width
                x_from = W + 20  # slide in from right
            else:
                x_target = SIDE_PADDING
                x_from = -bubble_img.width - 20  # slide in from left

            y = y_cursor
            y_cursor += bubble_img.height + MSG_SPACING

            start_t = float(m.timestamp)
            slide_dur = 0.38

            def pos_func_factory(x0, x1, y0, st):
                def _pos(t):
                    # t here is time since clip start; we use st via closure
                    # For t < slide_dur, ease-out cubic
                    tt = max(0.0, min(slide_dur, t))
                    p = 1 - pow(1 - (tt / slide_dur), 3)
                    x = x0 + (x1 - x0) * p
                    return (x, y0)
                return _pos

            iclip = clip_set_start(iclip, start_t)
            iclip = clip_set_position(iclip, pos_func_factory(x_from, x_target, y, start_t))

            clips.append(iclip)
            final_times.append(start_t + slide_dur)

        total_duration = max(final_times + [2.0]) + 1.0

        # Background and header
        bg = Image.new("RGB", (width, height), BG_COLOR)
        # Simple status/header bar look
        d = ImageDraw.Draw(bg)
        d.rounded_rectangle([(24, 24), (width - 24, int(HEADER_BAR_H * 0.8) + 24)], radius=26, fill=(255, 255, 255))
        bg_np = np.array(bg)
        bg_clip = make_image_clip(bg_np, duration=total_duration)

        video = CompositeVideoClip([bg_clip] + clips, size=(width, height))

        # Audio timeline
        audio_seg = _build_audio_timeline(msgs, total_duration)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
            tmp_wav_path = tmp_wav.name
        audio_seg.export(tmp_wav_path, format="wav")
        audio_clip = AudioFileClip(tmp_wav_path)
        video = video.set_audio(CompositeAudioClip([audio_clip]))

        # Export mp4
        video.write_videofile(
            output_path,
            fps=fps,
            codec="libx264",
            audio_codec="aac",
            preset="veryfast",
            ffmpeg_params=["-crf", "23"],
            threads=max(1, os.cpu_count() or 1),
            temp_audiofile=os.path.join(tempfile.gettempdir(), "chat-audio.m4a"),
            remove_temp=True,
            verbose=False,
            logger=None,
        )

        # cleanup temp audio
        try:
            os.remove(tmp_wav_path)
        except Exception:
            pass

        return {"duration": float(total_duration)}
    except Exception as e:
        raise RuntimeError(f"Render failed: {e}") from e


# -------------------------
# Appwrite Upload Helper
# -------------------------

def upload_to_appwrite(file_path: str, bucket_id: str, endpoint: str, project: str, api_key: str) -> Dict[str, str]:
    """Upload a file to Appwrite Storage and return {file_id, url}.
    Requires: appwrite>=4.x
    """
    from appwrite.client import Client
    from appwrite.services.storage import Storage

    client = (
        Client()
        .set_endpoint(endpoint)
        .set_project(project)
        .set_key(api_key)
    )
    storage = Storage(client)

    with open(file_path, "rb") as f:
        result = storage.create_file(bucket_id=bucket_id, file_id="unique()", file=f)
    # Build a preview/download URL; adjust permissions as needed
    file_id = result["$id"]
    url = f"{endpoint}/storage/buckets/{bucket_id}/files/{file_id}/view?project={project}"
    return {"file_id": file_id, "url": url}


# -------------------------
# CLI Entrypoint
# -------------------------

def _load_json_from_path(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main(argv: Optional[List[str]] = None) -> int:
    import argparse

    p = argparse.ArgumentParser(description="Render iMessage-style chat video (CPU-only)")
    p.add_argument("--input", required=True, help="Path to conversation JSON")
    p.add_argument("--output", required=True, help="Output MP4 path")
    p.add_argument("--upload", action="store_true", help="Upload to Appwrite after render")
    p.add_argument("--bucket-id", help="Appwrite bucket ID")
    p.add_argument("--appwrite-endpoint", help="Appwrite endpoint")
    p.add_argument("--appwrite-project", help="Appwrite project ID")
    p.add_argument("--appwrite-key", help="Appwrite API key")
    args = p.parse_args(argv)

    try:
        data = _load_json_from_path(args.input)
    except Exception as e:
        print(f"Invalid JSON: {e}", file=sys.stderr)
        return 2

    try:
        render_chat_video(data, args.output)
    except Exception as e:
        print(str(e), file=sys.stderr)
        return 1

    if args.upload:
        endpoint = args.appwrite_endpoint or os.getenv("APPWRITE_ENDPOINT")
        project = args.appwrite_project or os.getenv("APPWRITE_PROJECT_ID")
        api_key = args.appwrite_key or os.getenv("APPWRITE_API_KEY")
        bucket = args.bucket_id or os.getenv("APPWRITE_BUCKET_ID")
        missing = [k for k, v in {
            "APPWRITE_ENDPOINT": endpoint,
            "APPWRITE_PROJECT_ID": project,
            "APPWRITE_API_KEY": api_key,
            "APPWRITE_BUCKET_ID": bucket,
        }.items() if not v]
        if missing:
            print(f"Missing Appwrite config: {', '.join(missing)}", file=sys.stderr)
            return 3
        try:
            res = upload_to_appwrite(args.output, bucket, endpoint, project, api_key)
            print(json.dumps({"ok": True, **res}))
        except Exception as e:
            print(f"Upload failed: {e}", file=sys.stderr)
            return 4

    return 0


if __name__ == "__main__":
    sys.exit(main())
