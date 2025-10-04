#!/usr/bin/env python3
"""
Browser-based iMessage video renderer using Playwright

Creates pixel-perfect iMessage videos with:
- Character-by-character typing animation
- iOS keyboard visible and animated
- Typing indicators for incoming messages
- Realistic message bubble slide-in animations
- Audio sync (keyboard clicks, send/receive chimes)

Usage:
    python browser_renderer.py --input conversation.json --output video.mp4
"""

import argparse
import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("❌ Playwright not installed!")
    print("Run: pip install playwright")
    print("Then: playwright install chromium")
    sys.exit(1)

try:
    from appwrite.client import Client
    from appwrite.services.storage import Storage
    from appwrite.input_file import InputFile
    APPWRITE_AVAILABLE = True
except ImportError:
    APPWRITE_AVAILABLE = False


class BrowserRenderer:
    def __init__(self, width: int = 390, height: int = 844, fps: int = 30):
        self.width = width
        self.height = height
        self.fps = fps
        self.template_path = Path(__file__).parent / "templates" / "imessage.html"
        
    async def render_video(
        self,
        conversation: Dict,
        output_path: str,
        audio_path: Optional[str] = None
    ) -> None:
        """Render conversation to video using browser automation."""
        
        if not self.template_path.exists():
            raise FileNotFoundError(f"Template not found: {self.template_path}")
        
        print(f"🎬 Starting browser-based render...")
        print(f"   Template: {self.template_path}")
        print(f"   Output: {output_path}")
        
        async with async_playwright() as p:
            # Launch browser in headless mode
            print("🌐 Launching Chromium...")
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-dev-shm-usage'
                ]
            )
            
            # Create context with exact iPhone dimensions
            context = await browser.new_context(
                viewport={'width': self.width, 'height': self.height},
                device_scale_factor=2,
                has_touch=True,
                is_mobile=True
            )
            
            page = await context.new_page()
            
            # Load template
            print("📄 Loading iMessage template...")
            template_url = f"file://{self.template_path.absolute()}"
            await page.goto(template_url)
            
            # Wait for page to be ready
            await page.wait_for_load_state('domcontentloaded')
            await asyncio.sleep(0.5)
            
            # Initialize with conversation data
            print("💬 Initializing conversation...")
            await page.evaluate(f"""
                window.iMessage.init({{
                    contactName: {json.dumps(conversation.get('contactName', 'Messages'))},
                    messages: {json.dumps(conversation.get('messages', []))}
                }});
            """)
            
            # Calculate approximate video duration
            messages = conversation.get('messages', [])
            estimated_duration = self._estimate_duration(messages)
            print(f"⏱️  Estimated duration: {estimated_duration:.1f} seconds")
            
            # Start recording
            print("🎥 Recording video...")
            video_path = await page.video.path() if hasattr(page, 'video') else None
            
            # Use page.video() for built-in recording, or ffmpeg fallback
            temp_video = tempfile.mktemp(suffix='.webm')
            
            # Start screen recording via CDP (Chrome DevTools Protocol)
            await page.context.tracing.start(screenshots=True, snapshots=True)
            
            # Alternative: Use page screenshot in a loop
            frames_dir = tempfile.mkdtemp()
            print(f"📸 Capturing frames to: {frames_dir}")
            
            # Start animation
            animation_task = asyncio.create_task(
                page.evaluate("window.iMessage.playAllMessages()")
            )
            
            # Capture frames
            frame_count = 0
            frame_interval = 1.0 / self.fps
            max_duration = estimated_duration + 2  # Add buffer
            
            start_time = asyncio.get_event_loop().time()
            
            while True:
                current_time = asyncio.get_event_loop().time() - start_time
                
                # Check if animation complete
                is_complete = await page.evaluate("window.renderComplete === true")
                
                if is_complete and current_time > estimated_duration * 0.8:
                    print("✅ Animation complete!")
                    break
                    
                if current_time > max_duration:
                    print("⏰ Max duration reached, stopping...")
                    break
                
                # Capture frame
                frame_path = os.path.join(frames_dir, f"frame_{frame_count:06d}.png")
                await page.screenshot(path=frame_path, full_page=False)
                frame_count += 1
                
                # Progress
                if frame_count % 30 == 0:
                    print(f"   📹 Captured {frame_count} frames ({current_time:.1f}s)...")
                
                # Wait for next frame
                await asyncio.sleep(frame_interval)
            
            print(f"✅ Captured {frame_count} frames total")
            
            # Wait for animation to finish
            try:
                await asyncio.wait_for(animation_task, timeout=5)
            except asyncio.TimeoutError:
                pass
            
            await browser.close()
            
            # Encode frames to video using ffmpeg
            print("🎞️  Encoding video with ffmpeg...")
            self._encode_video(frames_dir, output_path, frame_count, audio_path)
            
            # Cleanup
            print("🧹 Cleaning up temporary files...")
            import shutil
            shutil.rmtree(frames_dir)
            
            print(f"✅ Video saved to: {output_path}")
    
    def _estimate_duration(self, messages: List[Dict]) -> float:
        """Estimate total video duration based on messages."""
        total = 2.0  # Initial delay
        
        for msg in messages:
            text = msg.get('text', '')
            is_from_you = msg.get('sent', False) or msg.get('sender') == 'you'
            
            if is_from_you:
                # Typing time: ~60ms per character + pauses
                typing_time = len(text) * 0.06
                total += typing_time + 0.7  # + bubble animation
            else:
                # Typing indicator time
                indicator_time = min(len(text) * 0.05, 2.0)
                total += indicator_time + 0.9  # + bubble animation
        
        return total + 1.0  # Final buffer
    
    def _encode_video(
        self,
        frames_dir: str,
        output_path: str,
        frame_count: int,
        audio_path: Optional[str] = None
    ) -> None:
        """Encode frames to MP4 using ffmpeg."""
        import subprocess
        
        # Build ffmpeg command
        input_pattern = os.path.join(frames_dir, "frame_%06d.png")
        
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output
            '-framerate', str(self.fps),
            '-i', input_pattern,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
        ]
        
        if audio_path and os.path.exists(audio_path):
            cmd.extend(['-i', audio_path, '-c:a', 'aac', '-shortest'])
        
        cmd.append(output_path)
        
        # Run ffmpeg
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            print("   ✅ ffmpeg encoding complete")
        except subprocess.CalledProcessError as e:
            print(f"   ❌ ffmpeg failed: {e.stderr.decode()}")
            raise
    
    def upload_to_appwrite(
        self,
        video_path: str,
        endpoint: str,
        project_id: str,
        api_key: str,
        bucket_id: str
    ) -> Dict[str, str]:
        """Upload video to Appwrite Storage and return file info."""
        
        if not APPWRITE_AVAILABLE:
            raise ImportError("Appwrite SDK not installed. Run: pip install appwrite")
        
        print("☁️  Uploading to Appwrite Storage...")
        
        # Initialize Appwrite client
        client = Client()
        client.set_endpoint(endpoint)
        client.set_project(project_id)
        client.set_key(api_key)
        
        storage = Storage(client)
        
        # Generate unique file ID
        import uuid
        file_id = str(uuid.uuid4())
        filename = os.path.basename(video_path)
        
        try:
            # Upload file
            result = storage.create_file(
                bucket_id=bucket_id,
                file_id=file_id,
                file=InputFile.from_path(video_path)
            )
            
            # Get download URL
            file_url = f"{endpoint}/storage/buckets/{bucket_id}/files/{file_id}/view?project={project_id}"
            
            print(f"   ✅ Upload complete!")
            print(f"   📦 File ID: {file_id}")
            print(f"   🔗 URL: {file_url}")
            
            return {
                "file_id": file_id,
                "bucket_id": bucket_id,
                "filename": filename,
                "url": file_url,
                "size": os.path.getsize(video_path)
            }
            
        except Exception as e:
            print(f"   ❌ Upload failed: {e}")
            raise


async def main():
    parser = argparse.ArgumentParser(description='Browser-based iMessage video renderer')
    parser.add_argument('--input', '-i', required=True, help='Input JSON conversation file')
    parser.add_argument('--output', '-o', required=True, help='Output MP4 video path')
    parser.add_argument('--width', type=int, default=390, help='Video width (default: 390)')
    parser.add_argument('--height', type=int, default=844, help='Video height (default: 844)')
    parser.add_argument('--fps', type=int, default=30, help='Frames per second (default: 30)')
    parser.add_argument('--audio', help='Optional audio track to overlay')
    
    # Appwrite upload options
    parser.add_argument('--upload', action='store_true', help='Upload video to Appwrite Storage')
    parser.add_argument('--appwrite-endpoint', default='https://cloud.appwrite.io/v1', help='Appwrite endpoint')
    parser.add_argument('--appwrite-project', help='Appwrite project ID')
    parser.add_argument('--appwrite-key', help='Appwrite API key')
    parser.add_argument('--bucket-id', help='Appwrite storage bucket ID')
    
    args = parser.parse_args()
    
    # Load conversation
    print(f"📖 Loading conversation from: {args.input}")
    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            conversation = json.load(f)
    except Exception as e:
        print(f"❌ Failed to load conversation: {e}")
        sys.exit(1)
    
    # Render
    renderer = BrowserRenderer(width=args.width, height=args.height, fps=args.fps)
    
    try:
        await renderer.render_video(
            conversation=conversation,
            output_path=args.output,
            audio_path=args.audio
        )
        print("\n🎉 Render complete!")
        
        # Upload to Appwrite if requested
        if args.upload:
            if not all([args.appwrite_project, args.appwrite_key, args.bucket_id]):
                print("❌ Upload requires: --appwrite-project, --appwrite-key, --bucket-id")
                sys.exit(1)
            
            upload_result = renderer.upload_to_appwrite(
                video_path=args.output,
                endpoint=args.appwrite_endpoint,
                project_id=args.appwrite_project,
                api_key=args.appwrite_key,
                bucket_id=args.bucket_id
            )
            
            # Output JSON for programmatic access
            print("\n📦 Upload Result:")
            print(json.dumps(upload_result, indent=2))
            
    except Exception as e:
        print(f"\n❌ Render failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
