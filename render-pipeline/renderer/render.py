#!/usr/bin/env python3
"""
Main chat video renderer using Playwright for pixel-perfect rendering.
"""

import os
import sys
import json
import asyncio
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
import click

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils import (
    load_conversation, validate_conversation, get_viewport_size, 
    get_fps, calculate_duration, ensure_audio_assets, create_temp_file,
    run_ffmpeg, sanitize_filename, format_duration, get_file_size_mb
)
from video_presets import get_preset, detect_hardware_acceleration, get_ffmpeg_args

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

try:
    from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, TextClip
    from moviepy.video.fx import resize
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class ChatRenderer:
    """Main chat video renderer class."""
    
    def __init__(self, conversation: Dict[str, Any], output_path: str, 
                 preset: str = 'standard', use_playwright: bool = True):
        self.conversation = conversation
        self.output_path = output_path
        self.preset = get_preset(preset)
        self.use_playwright = use_playwright and PLAYWRIGHT_AVAILABLE
        self.audio_assets = ensure_audio_assets()
        self.temp_files = []
        
        # Validate conversation
        validate_conversation(conversation)
        
        # Get dimensions and settings
        self.width, self.height = get_viewport_size(conversation)
        self.fps = get_fps(conversation)
        self.duration = calculate_duration(conversation)
        
        print(f"Rendering {self.width}x{self.height} video at {self.fps}fps")
        print(f"Duration: {format_duration(self.duration)}")
        print(f"Mode: {'Playwright' if self.use_playwright else 'MoviePy'}")
    
    async def render(self) -> str:
        """Render the chat video."""
        try:
            if self.use_playwright:
                return await self._render_playwright()
            elif MOVIEPY_AVAILABLE:
                return await self._render_moviepy()
            else:
                raise RuntimeError("Neither Playwright nor MoviePy is available")
        finally:
            self._cleanup_temp_files()
    
    async def _render_playwright(self) -> str:
        """Render using Playwright for pixel-perfect accuracy."""
        print("Starting Playwright rendering...")
        
        # Create temporary files
        video_temp = create_temp_file('.webm')
        audio_temp = create_temp_file('.wav')
        self.temp_files.extend([video_temp, audio_temp])
        
        # Generate audio track
        print("Generating audio track...")
        await self._generate_audio_track(audio_temp)
        
        # Record video with Playwright
        print("Recording video with Playwright...")
        await self._record_video_playwright(video_temp)
        
        # Combine video and audio
        print("Combining video and audio...")
        await self._combine_video_audio(video_temp, audio_temp, self.output_path)
        
        print(f"Rendering complete: {self.output_path}")
        print(f"File size: {get_file_size_mb(self.output_path):.1f} MB")
        
        return self.output_path
    
    async def _render_moviepy(self) -> str:
        """Render using MoviePy as fallback."""
        print("Starting MoviePy rendering...")
        
        # This is a simplified fallback - in production you'd want a full implementation
        print("MoviePy fallback not fully implemented yet")
        print("Please install Playwright for pixel-perfect rendering")
        raise NotImplementedError("MoviePy fallback requires full implementation")
    
    async def _record_video_playwright(self, output_path: str):
        """Record video using Playwright."""
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': self.width, 'height': self.height},
                record_video_dir=os.path.dirname(output_path),
                record_video_size={'width': self.width, 'height': self.height}
            )
            
            page = await context.new_page()
            
            # Load the HTML template
            template_path = Path(__file__).parent.parent / "templates" / "chat.html"
            await page.goto(f"file://{template_path.absolute()}")
            
            # Inject conversation data
            await page.evaluate(f"""
                window.conversationData = {json.dumps(self.conversation)};
                if (window.initRenderer) {{
                    window.initRenderer(window.conversationData);
                }}
            """)
            
            # Wait for page to load
            await page.wait_for_timeout(1000)
            
            # Start video recording
            await page.video.start()
            
            # Wait for the full duration
            await page.wait_for_timeout(int(self.duration * 1000))
            
            # Stop recording
            video = await page.video.stop()
            
            # Save video
            await video.save_as(output_path)
            
            await browser.close()
    
    async def _generate_audio_track(self, output_path: str):
        """Generate synchronized audio track."""
        import numpy as np
        from scipy.io import wavfile
        
        sample_rate = 44100
        total_samples = int(self.duration * sample_rate)
        audio_track = np.zeros(total_samples, dtype=np.float32)
        
        # Process messages for audio events
        current_time = 0
        for i, msg in enumerate(self.conversation['messages']):
            gap = 2 if i > 0 else 0
            current_time += gap
            
            if msg['sent']:
                # Outgoing message with typing sounds
                typing_duration = len(msg['text']) / 11  # 11 chars/sec
                typing_start = current_time
                typing_end = typing_start + typing_duration
                send_time = typing_end + 0.18
                
                # Add keyboard clicks during typing
                if msg.get('sound', True):
                    await self._add_keyboard_clicks(
                        audio_track, typing_start, typing_end, sample_rate
                    )
                    
                    # Add send chime
                    await self._add_send_chime(
                        audio_track, send_time, sample_rate
                    )
                
                current_time = send_time
            else:
                # Incoming message
                show_indicator = i > 0 and self.conversation['messages'][i-1]['sent']
                if show_indicator:
                    current_time += 1.2  # Typing indicator duration
                else:
                    current_time += 0.1  # Quick appear
                
                # Add receive chime
                if msg.get('sound', True):
                    await self._add_receive_chime(
                        audio_track, current_time, sample_rate
                    )
        
        # Normalize and save audio
        audio_track = np.clip(audio_track, -1, 1)
        audio_16bit = (audio_track * 32767).astype(np.int16)
        wavfile.write(output_path, sample_rate, audio_16bit)
    
    async def _add_keyboard_clicks(self, audio_track: np.ndarray, start_time: float, 
                                 end_time: float, sample_rate: int):
        """Add keyboard click sounds during typing."""
        # Load keyboard click sound
        click_path = self.audio_assets['keyboard_click']
        click_rate, click_audio = wavfile.read(click_path)
        
        # Calculate click timing (roughly 3-4 clicks per second)
        click_interval = 0.25  # 4 clicks per second
        current_time = start_time
        
        while current_time < end_time:
            sample_pos = int(current_time * sample_rate)
            if sample_pos + len(click_audio) < len(audio_track):
                # Mix click sound into track
                audio_track[sample_pos:sample_pos + len(click_audio)] += (
                    click_audio.astype(np.float32) / 32767 * 0.3
                )
            current_time += click_interval
    
    async def _add_send_chime(self, audio_track: np.ndarray, time: float, sample_rate: int):
        """Add send chime at specified time."""
        chime_path = self.audio_assets['send_chime']
        chime_rate, chime_audio = wavfile.read(chime_path)
        
        sample_pos = int(time * sample_rate)
        if sample_pos + len(chime_audio) < len(audio_track):
            audio_track[sample_pos:sample_pos + len(chime_audio)] += (
                chime_audio.astype(np.float32) / 32767 * 0.5
            )
    
    async def _add_receive_chime(self, audio_track: np.ndarray, time: float, sample_rate: int):
        """Add receive chime at specified time."""
        chime_path = self.audio_assets['receive_chime']
        chime_rate, chime_audio = wavfile.read(chime_path)
        
        sample_pos = int(time * sample_rate)
        if sample_pos + len(chime_audio) < len(audio_track):
            audio_track[sample_pos:sample_pos + len(chime_audio)] += (
                chime_audio.astype(np.float32) / 32767 * 0.4
            )
    
    async def _combine_video_audio(self, video_path: str, audio_path: str, output_path: str):
        """Combine video and audio using ffmpeg."""
        # Detect hardware acceleration
        hardware = detect_hardware_acceleration()
        ffmpeg_args = get_ffmpeg_args(self.preset, hardware)
        
        # Build ffmpeg command
        args = [
            '-i', video_path,
            '-i', audio_path,
            '-c:v', 'libx264',
            '-preset', self.preset.preset,
            '-crf', str(self.preset.crf),
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', self.preset.audio_bitrate,
            '-movflags', '+faststart',
            '-shortest',  # End when shortest stream ends
            output_path
        ]
        
        # Use hardware acceleration if available
        if hardware != 'none':
            hw_config = {
                'nvenc': {'encoder': 'h264_nvenc', 'preset': 'fast'},
                'vaapi': {'encoder': 'h264_vaapi', 'preset': 'fast'},
                'videotoolbox': {'encoder': 'h264_videotoolbox', 'preset': 'fast'}
            }
            
            if hardware in hw_config:
                config = hw_config[hardware]
                args = [
                    '-i', video_path,
                    '-i', audio_path,
                    '-c:v', config['encoder'],
                    '-preset', config['preset'],
                    '-c:a', 'aac',
                    '-b:a', self.preset.audio_bitrate,
                    '-movflags', '+faststart',
                    '-shortest',
                    output_path
                ]
        
        print(f"Running ffmpeg with hardware acceleration: {hardware}")
        result = run_ffmpeg(args, timeout=300)
        
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            raise RuntimeError(f"FFmpeg failed: {result.stderr}")
    
    def _cleanup_temp_files(self):
        """Clean up temporary files."""
        for temp_file in self.temp_files:
            try:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception as e:
                print(f"Warning: Could not delete temp file {temp_file}: {e}")

@click.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.argument('output_file', type=click.Path())
@click.option('--preset', default='standard', 
              type=click.Choice(['preview', 'standard', 'high', 'ultra']),
              help='Video quality preset')
@click.option('--no-playwright', is_flag=True, help='Force MoviePy fallback')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def main(input_file: str, output_file: str, preset: str, no_playwright: bool, verbose: bool):
    """Render a chat conversation to video."""
    
    if verbose:
        print(f"Input: {input_file}")
        print(f"Output: {output_file}")
        print(f"Preset: {preset}")
        print(f"Playwright: {not no_playwright}")
    
    try:
        # Load conversation
        conversation = load_conversation(input_file)
        
        # Create renderer
        renderer = ChatRenderer(
            conversation=conversation,
            output_path=output_file,
            preset=preset,
            use_playwright=not no_playwright
        )
        
        # Render video
        result = asyncio.run(renderer.render())
        
        print(f"✅ Successfully rendered: {result}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

