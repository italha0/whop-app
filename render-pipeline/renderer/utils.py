"""
Utility functions for the chat renderer.
"""

import os
import json
import tempfile
import subprocess
from typing import Dict, Any, Optional, List
from pathlib import Path

def load_conversation(file_path: str) -> Dict[str, Any]:
    """Load conversation data from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_conversation(data: Dict[str, Any], file_path: str) -> None:
    """Save conversation data to JSON file."""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def ensure_audio_assets() -> Dict[str, str]:
    """Ensure audio assets exist, generate if missing."""
    assets_dir = Path(__file__).parent.parent / "assets" / "sounds"
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    audio_files = {
        'keyboard_click': assets_dir / 'keyboard_click.wav',
        'send_chime': assets_dir / 'send_chime.wav',
        'receive_chime': assets_dir / 'receive_chime.wav'
    }
    
    # Generate missing audio files
    for name, path in audio_files.items():
        if not path.exists():
            generate_audio_file(name, str(path))
    
    return {name: str(path) for name, path in audio_files.items()}

def generate_audio_file(audio_type: str, output_path: str) -> None:
    """Generate a single audio file programmatically."""
    import numpy as np
    from scipy.io import wavfile
    
    sample_rate = 44100
    
    if audio_type == 'keyboard_click':
        duration = 0.008  # 8ms
        t = np.linspace(0, duration, int(sample_rate * duration))
        frequency = 800 + 200 * np.sin(2 * np.pi * 10 * t)
        audio = np.sin(2 * np.pi * frequency * t)
        envelope = np.exp(-t * 200)
        audio *= envelope
        noise = np.random.normal(0, 0.1, len(audio))
        audio += noise * envelope
        
    elif audio_type == 'send_chime':
        duration = 0.3
        t = np.linspace(0, duration, int(sample_rate * duration))
        tone1 = np.sin(2 * np.pi * 523.25 * t)  # C5
        tone2 = np.sin(2 * np.pi * 659.25 * t)  # E5
        audio = 0.6 * tone1 + 0.4 * tone2
        envelope = np.exp(-t * 3) * (1 - np.exp(-t * 20))
        audio *= envelope
        
    elif audio_type == 'receive_chime':
        duration = 0.2
        t = np.linspace(0, duration, int(sample_rate * duration))
        tone = np.sin(2 * np.pi * 440 * t)  # A4
        envelope = np.exp(-t * 5) * (1 - np.exp(-t * 30))
        audio = 0.3 * tone * envelope
        
    else:
        raise ValueError(f"Unknown audio type: {audio_type}")
    
    # Normalize and convert to 16-bit
    audio = np.clip(audio, -1, 1)
    audio_16bit = (audio * 32767).astype(np.int16)
    
    wavfile.write(output_path, sample_rate, audio_16bit)

def create_temp_file(suffix: str = '.tmp') -> str:
    """Create a temporary file and return its path."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    return path

def run_ffmpeg(args: List[str], timeout: int = 300) -> subprocess.CompletedProcess:
    """Run ffmpeg with the given arguments."""
    cmd = ['ffmpeg', '-y'] + args  # -y to overwrite output files
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)

def validate_conversation(conversation: Dict[str, Any]) -> None:
    """Validate conversation data structure."""
    required_fields = ['messages']
    for field in required_fields:
        if field not in conversation:
            raise ValueError(f"Missing required field: {field}")
    
    if not isinstance(conversation['messages'], list):
        raise ValueError("Messages must be a list")
    
    for i, msg in enumerate(conversation['messages']):
        if not isinstance(msg, dict):
            raise ValueError(f"Message {i} must be a dictionary")
        
        required_msg_fields = ['id', 'text', 'sent']
        for field in required_msg_fields:
            if field not in msg:
                raise ValueError(f"Message {i} missing required field: {field}")
        
        if not isinstance(msg['sent'], bool):
            raise ValueError(f"Message {i} 'sent' field must be boolean")

def get_viewport_size(conversation: Dict[str, Any]) -> tuple[int, int]:
    """Get viewport size from conversation or use defaults."""
    viewport = conversation.get('viewport', {})
    width = viewport.get('w', 390)
    height = viewport.get('h', 844)
    return width, height

def get_fps(conversation: Dict[str, Any]) -> int:
    """Get FPS from conversation or use default."""
    viewport = conversation.get('viewport', {})
    return viewport.get('fps', 30)

def calculate_duration(conversation: Dict[str, Any]) -> float:
    """Calculate total video duration based on messages."""
    messages = conversation['messages']
    if not messages:
        return 5.0  # Default duration
    
    # Calculate timeline similar to Remotion component
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
    
    return max(prev_end + 2, 5.0)  # Add 2 seconds buffer, minimum 5 seconds

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe filesystem usage."""
    import re
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing spaces and dots
    filename = filename.strip(' .')
    # Ensure it's not empty
    if not filename:
        filename = 'output'
    return filename

def format_duration(seconds: float) -> str:
    """Format duration in MM:SS format."""
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes:02d}:{seconds:02d}"

def get_file_size_mb(file_path: str) -> float:
    """Get file size in MB."""
    return os.path.getsize(file_path) / (1024 * 1024)

