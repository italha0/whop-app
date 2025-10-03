# Audio Assets

This directory contains audio files for the chat renderer:

- `keyboard_click.wav` - Short click sound during typing (6-12ms)
- `send_chime.wav` - Pleasant chime when message is sent
- `receive_chime.wav` - Subtle notification when message is received

## Generation

Audio files are generated programmatically using the `generate_audio.py` script:

```bash
python assets/sounds/generate_audio.py
```

This creates CC0-licensed audio assets with:
- 44.1kHz sample rate
- 16-bit depth
- Mono channel
- Optimized for short duration and low file size

## Fallback

If audio files are missing, the renderer will generate them automatically using the same algorithm.

