"""
Video encoding presets for different quality/speed tradeoffs.
"""

from dataclasses import dataclass
from typing import Dict, List

@dataclass
class VideoPreset:
    """Video encoding preset configuration."""
    name: str
    width: int
    height: int
    fps: int
    crf: int  # Constant Rate Factor (lower = better quality)
    preset: str  # x264 preset
    audio_bitrate: str
    description: str

# Quality presets
PRESETS: Dict[str, VideoPreset] = {
    'preview': VideoPreset(
        name='preview',
        width=720,
        height=1280,
        fps=30,
        crf=28,
        preset='veryfast',
        audio_bitrate='128k',
        description='Fast preview quality (720p)'
    ),
    
    'standard': VideoPreset(
        name='standard',
        width=1080,
        height=1920,
        fps=30,
        crf=23,
        preset='fast',
        audio_bitrate='160k',
        description='Standard quality (1080p)'
    ),
    
    'high': VideoPreset(
        name='high',
        width=1080,
        height=1920,
        fps=30,
        crf=18,
        preset='medium',
        audio_bitrate='192k',
        description='High quality (1080p)'
    ),
    
    'ultra': VideoPreset(
        name='ultra',
        width=1080,
        height=1920,
        fps=60,
        crf=15,
        preset='slow',
        audio_bitrate='256k',
        description='Ultra quality (1080p 60fps)'
    )
}

# Hardware acceleration presets
HARDWARE_PRESETS: Dict[str, Dict[str, str]] = {
    'nvenc': {
        'encoder': 'h264_nvenc',
        'preset': 'fast',
        'tune': 'hq',
        'rc': 'vbr',
        'cq': '23',
        'b:v': '5M',
        'maxrate': '10M',
        'bufsize': '20M'
    },
    
    'vaapi': {
        'encoder': 'h264_vaapi',
        'preset': 'fast',
        'qp': '23',
        'b:v': '5M',
        'maxrate': '10M',
        'bufsize': '20M'
    },
    
    'videotoolbox': {
        'encoder': 'h264_videotoolbox',
        'preset': 'fast',
        'realtime': '1',
        'b:v': '5M',
        'maxrate': '10M',
        'bufsize': '20M'
    }
}

def get_preset(name: str) -> VideoPreset:
    """Get a video preset by name."""
    if name not in PRESETS:
        raise ValueError(f"Unknown preset: {name}. Available: {list(PRESETS.keys())}")
    return PRESETS[name]

def get_available_presets() -> List[str]:
    """Get list of available preset names."""
    return list(PRESETS.keys())

def detect_hardware_acceleration() -> str:
    """Detect available hardware acceleration."""
    import subprocess
    import shutil
    
    if not shutil.which('ffmpeg'):
        return 'none'
    
    try:
        # Check for NVENC (NVIDIA)
        result = subprocess.run([
            'ffmpeg', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=1',
            '-c:v', 'h264_nvenc', '-f', 'null', '-'
        ], capture_output=True, timeout=5)
        if result.returncode == 0:
            return 'nvenc'
    except:
        pass
    
    try:
        # Check for VAAPI (Intel/AMD)
        result = subprocess.run([
            'ffmpeg', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=1',
            '-c:v', 'h264_vaapi', '-f', 'null', '-'
        ], capture_output=True, timeout=5)
        if result.returncode == 0:
            return 'vaapi'
    except:
        pass
    
    try:
        # Check for VideoToolbox (macOS)
        result = subprocess.run([
            'ffmpeg', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=1',
            '-c:v', 'h264_videotoolbox', '-f', 'null', '-'
        ], capture_output=True, timeout=5)
        if result.returncode == 0:
            return 'videotoolbox'
    except:
        pass
    
    return 'none'

def get_ffmpeg_args(preset: VideoPreset, hardware: str = 'none') -> List[str]:
    """Generate ffmpeg arguments for a preset and hardware acceleration."""
    args = [
        '-c:v', 'libx264',
        '-preset', preset.preset,
        '-crf', str(preset.crf),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', preset.audio_bitrate,
        '-movflags', '+faststart'
    ]
    
    if hardware != 'none' and hardware in HARDWARE_PRESETS:
        hw_config = HARDWARE_PRESETS[hardware]
        args = ['-c:v', hw_config['encoder']] + [
            f'-{k}' if not k.startswith('-') else k: v 
            for k, v in hw_config.items() 
            if k != 'encoder'
        ] + ['-c:a', 'aac', '-b:a', preset.audio_bitrate]
    
    return args

