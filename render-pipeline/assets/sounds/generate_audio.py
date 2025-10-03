#!/usr/bin/env python3
"""
Generate keyboard click and send/receive chime audio files.
Creates CC0-licensed audio assets for the chat renderer.
"""

import numpy as np
from scipy.io import wavfile
import os

def generate_keyboard_click():
    """Generate a short keyboard click sound (6-12ms)"""
    sample_rate = 44100
    duration = 0.008  # 8ms
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create a short click with frequency sweep
    frequency = 800 + 200 * np.sin(2 * np.pi * 10 * t)  # 800-1000 Hz sweep
    click = np.sin(2 * np.pi * frequency * t)
    
    # Apply envelope for natural sound
    envelope = np.exp(-t * 200)  # Quick decay
    click *= envelope
    
    # Add slight noise for realism
    noise = np.random.normal(0, 0.1, len(click))
    click += noise * envelope
    
    # Normalize and convert to 16-bit
    click = np.clip(click, -1, 1)
    click_16bit = (click * 32767).astype(np.int16)
    
    return sample_rate, click_16bit

def generate_send_chime():
    """Generate a pleasant send chime"""
    sample_rate = 44100
    duration = 0.3
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create a pleasant two-tone chime
    tone1 = np.sin(2 * np.pi * 523.25 * t)  # C5
    tone2 = np.sin(2 * np.pi * 659.25 * t)  # E5
    
    chime = 0.6 * tone1 + 0.4 * tone2
    
    # Apply envelope
    envelope = np.exp(-t * 3) * (1 - np.exp(-t * 20))  # Attack and decay
    chime *= envelope
    
    # Normalize and convert to 16-bit
    chime = np.clip(chime, -1, 1)
    chime_16bit = (chime * 32767).astype(np.int16)
    
    return sample_rate, chime_16bit

def generate_receive_chime():
    """Generate a subtle receive notification"""
    sample_rate = 44100
    duration = 0.2
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create a subtle notification sound
    tone = np.sin(2 * np.pi * 440 * t)  # A4
    
    # Apply envelope for subtlety
    envelope = np.exp(-t * 5) * (1 - np.exp(-t * 30))
    notification = 0.3 * tone * envelope
    
    # Normalize and convert to 16-bit
    notification = np.clip(notification, -1, 1)
    notification_16bit = (notification * 32767).astype(np.int16)
    
    return sample_rate, notification_16bit

def main():
    """Generate all audio files"""
    os.makedirs("assets/sounds", exist_ok=True)
    
    # Generate keyboard click
    sr, click = generate_keyboard_click()
    wavfile.write("assets/sounds/keyboard_click.wav", sr, click)
    print("Generated keyboard_click.wav")
    
    # Generate send chime
    sr, send_chime = generate_send_chime()
    wavfile.write("assets/sounds/send_chime.wav", sr, send_chime)
    print("Generated send_chime.wav")
    
    # Generate receive chime
    sr, receive_chime = generate_receive_chime()
    wavfile.write("assets/sounds/receive_chime.wav", sr, receive_chime)
    print("Generated receive_chime.wav")
    
    print("All audio files generated successfully!")

if __name__ == "__main__":
    main()

