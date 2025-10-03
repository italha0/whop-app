"""
MoviePy-based fallback renderer for environments where Playwright is not available.
"""

import os
import numpy as np
from typing import Dict, Any, List, Tuple
from pathlib import Path

try:
    from moviepy.editor import (
        VideoFileClip, AudioFileClip, CompositeVideoClip, TextClip,
        ImageClip, ColorClip, concatenate_videoclips
    )
    from moviepy.video.fx import resize, crop
    from moviepy.audio.fx import volumex
    from PIL import Image, ImageDraw, ImageFont
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class MoviePyRenderer:
    """MoviePy-based chat video renderer."""
    
    def __init__(self, conversation: Dict[str, Any], output_path: str, 
                 width: int = 390, height: int = 844, fps: int = 30):
        if not MOVIEPY_AVAILABLE:
            raise ImportError("MoviePy is not available. Install with: pip install moviepy")
        
        self.conversation = conversation
        self.output_path = output_path
        self.width = width
        self.height = height
        self.fps = fps
        self.duration = self._calculate_duration()
        
        # Theme configuration
        self.theme = self._get_theme()
        
        print(f"MoviePy renderer initialized: {width}x{height} @ {fps}fps")
        print(f"Duration: {self.duration:.1f}s")
    
    def _get_theme(self) -> Dict[str, Any]:
        """Get theme configuration."""
        theme_name = self.conversation.get('theme', 'imessage')
        
        themes = {
            'imessage': {
                'sent_color': '#007AFF',
                'received_color': '#E5E5EA',
                'sent_text': '#ffffff',
                'received_text': '#000000',
                'background': '#FFFFFF',
                'header_bg': '#F2F2F7',
                'font_family': 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            },
            'whatsapp': {
                'sent_color': '#25D366',
                'received_color': '#FFFFFF',
                'sent_text': '#ffffff',
                'received_text': '#000000',
                'background': '#E5DDD5',
                'header_bg': '#075E54',
                'font_family': 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif'
            },
            'snapchat': {
                'sent_color': '#FFFC00',
                'received_color': '#F5F5F5',
                'sent_text': '#000000',
                'received_text': '#000000',
                'background': '#FFFFFF',
                'header_bg': '#FFFC00',
                'font_family': 'Avenir Next, "Helvetica Neue", Helvetica, Arial, sans-serif'
            }
        }
        
        return themes.get(theme_name, themes['imessage'])
    
    def _calculate_duration(self) -> float:
        """Calculate total video duration."""
        messages = self.conversation['messages']
        if not messages:
            return 5.0
        
        GAP_SECONDS = 2
        TYPING_DURATION = 1.2
        SEND_GAP = 0.18
        TYPE_SPEED = 11
        DELIVERED_DELAY = 0.6
        
        prev_end = 0
        for i, msg in enumerate(messages):
            base = i == 0 ? 0 : prev_end + GAP_SECONDS
            
            if msg['sent']:
                typing_duration = len(msg['text']) / TYPE_SPEED
                appear_time = base + typing_duration + SEND_GAP
            else:
                show_indicator = i > 0 and messages[i-1]['sent']
                if show_indicator:
                    appear_time = base + TYPING_DURATION
                else:
                    appear_time = base
            
            prev_end = appear_time
        
        # Add delivered delay for last sent message
        last_sent = next((msg for msg in reversed(messages) if msg['sent']), None)
        if last_sent:
            prev_end += DELIVERED_DELAY
        
        return max(prev_end + 2, 5.0)
    
    def render(self) -> str:
        """Render the chat video using MoviePy."""
        print("Starting MoviePy rendering...")
        
        # Create base background
        background = ColorClip(size=(self.width, self.height), 
                              color=self._hex_to_rgb(self.theme['background']), 
                              duration=self.duration)
        
        # Create device frame
        device_frame = self._create_device_frame()
        
        # Create status bar
        status_bar = self._create_status_bar()
        
        # Create navigation header
        nav_header = self._create_nav_header()
        
        # Create message clips
        message_clips = self._create_message_clips()
        
        # Create keyboard clips
        keyboard_clips = self._create_keyboard_clips()
        
        # Composite all clips
        all_clips = [background, device_frame, status_bar, nav_header] + message_clips + keyboard_clips
        final_video = CompositeVideoClip(all_clips, size=(self.width, self.height))
        
        # Add audio
        audio_clip = self._create_audio_clip()
        if audio_clip:
            final_video = final_video.set_audio(audio_clip)
        
        # Write video
        print("Writing video file...")
        final_video.write_videofile(
            self.output_path,
            fps=self.fps,
            codec='libx264',
            audio_codec='aac',
            temp_audiofile='temp-audio.m4a',
            remove_temp=True,
            verbose=False,
            logger=None
        )
        
        print(f"✅ MoviePy rendering complete: {self.output_path}")
        return self.output_path
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _create_device_frame(self) -> ColorClip:
        """Create device frame with rounded corners."""
        # For simplicity, we'll create a basic frame
        # In a full implementation, you'd create a proper rounded rectangle
        return ColorClip(size=(self.width, self.height), 
                        color=(255, 255, 255), 
                        duration=self.duration)
    
    def _create_status_bar(self) -> TextClip:
        """Create status bar with time and indicators."""
        status_text = "9:41"
        return TextClip(status_text, 
                       fontsize=15, 
                       color='black',
                       font='Arial',
                       size=(self.width, 44)).set_position(('center', 0)).set_duration(self.duration)
    
    def _create_nav_header(self) -> TextClip:
        """Create navigation header."""
        contact_name = self.conversation.get('contactName', 'Contact')
        return TextClip(contact_name, 
                       fontsize=17, 
                       color='black',
                       font='Arial',
                       size=(self.width, 52)).set_position(('center', 44)).set_duration(self.duration)
    
    def _create_message_clips(self) -> List[TextClip]:
        """Create message bubble clips."""
        clips = []
        messages = self.conversation['messages']
        
        # Calculate timeline
        prev_end = 0
        for i, msg in enumerate(messages):
            base = i == 0 ? 0 : prev_end + 2  # 2 second gap
            
            if msg['sent']:
                typing_duration = len(msg['text']) / 11  # 11 chars/sec
                appear_time = base + typing_duration + 0.18
            else:
                show_indicator = i > 0 and messages[i-1]['sent']
                if show_indicator:
                    appear_time = base + 1.2
                else:
                    appear_time = base
            
            # Create message clip
            message_clip = self._create_message_bubble(msg, appear_time, i)
            if message_clip:
                clips.append(message_clip)
            
            prev_end = appear_time
        
        return clips
    
    def _create_message_bubble(self, msg: Dict[str, Any], appear_time: float, index: int) -> TextClip:
        """Create a single message bubble clip."""
        text = msg['text']
        is_sent = msg['sent']
        
        # Determine colors
        if is_sent:
            bg_color = self._hex_to_rgb(self.theme['sent_color'])
            text_color = self._hex_to_rgb(self.theme['sent_text'])
        else:
            bg_color = self._hex_to_rgb(self.theme['received_color'])
            text_color = self._hex_to_rgb(self.theme['received_text'])
        
        # Create text clip
        text_clip = TextClip(text, 
                           fontsize=17, 
                           color=text_color,
                           font='Arial',
                           method='caption',
                           size=(int(self.width * 0.78), None),
                           align='left')
        
        # Create background bubble
        bubble_size = (text_clip.w + 28, text_clip.h + 16)  # Add padding
        bubble = ColorClip(size=bubble_size, color=bg_color, duration=2.0)
        
        # Composite text on bubble
        bubble_with_text = CompositeVideoClip([bubble, text_clip.set_position('center')])
        
        # Position bubble
        if is_sent:
            x_pos = self.width - bubble_size[0] - 12  # Right side
        else:
            x_pos = 12  # Left side
        
        y_pos = 96 + (index * 60)  # Below header, spaced out
        
        # Set timing
        bubble_with_text = bubble_with_text.set_position((x_pos, y_pos)).set_start(appear_time)
        
        return bubble_with_text
    
    def _create_keyboard_clips(self) -> List[TextClip]:
        """Create keyboard animation clips."""
        # Simplified keyboard - in full implementation you'd create proper keyboard
        clips = []
        
        # Find when keyboard should be visible
        messages = self.conversation['messages']
        keyboard_start = None
        keyboard_end = None
        
        for i, msg in enumerate(messages):
            if msg['sent']:
                base = i * 2  # Simplified timing
                typing_duration = len(msg['text']) / 11
                
                if keyboard_start is None:
                    keyboard_start = base - 0.8
                keyboard_end = base + typing_duration + 0.3
        
        if keyboard_start is not None:
            # Create simple keyboard representation
            keyboard_text = "Keyboard"
            keyboard_clip = TextClip(keyboard_text, 
                                   fontsize=14, 
                                   color='black',
                                   font='Arial').set_position(('center', self.height - 100))
            
            keyboard_clip = keyboard_clip.set_start(keyboard_start).set_end(keyboard_end)
            clips.append(keyboard_clip)
        
        return clips
    
    def _create_audio_clip(self) -> AudioFileClip:
        """Create synchronized audio clip."""
        # This is a simplified version - in full implementation you'd create proper audio
        try:
            # Try to load audio assets
            audio_assets = {
                'keyboard_click': 'assets/sounds/keyboard_click.wav',
                'send_chime': 'assets/sounds/send_chime.wav',
                'receive_chime': 'assets/sounds/receive_chime.wav'
            }
            
            # For now, return None (no audio)
            # In full implementation, you'd composite all audio events
            return None
            
        except Exception as e:
            print(f"Warning: Could not create audio clip: {e}")
            return None

def render_with_moviepy(conversation: Dict[str, Any], output_path: str, 
                       width: int = 390, height: int = 844, fps: int = 30) -> str:
    """Convenience function to render with MoviePy."""
    renderer = MoviePyRenderer(conversation, output_path, width, height, fps)
    return renderer.render()

