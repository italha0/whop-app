# Chat Video Renderer Pipeline

A pixel-perfect Python-based renderer that replicates Remotion chat interfaces with synchronized audio. Supports iMessage, WhatsApp, and Snapchat themes with keyboard clicks and send/receive chimes.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt
bash playwright_install.sh

# Render a sample conversation
python renderer/render.py examples/conversation.json examples/output.mp4

# Or use Docker
docker build -t chat-renderer .
docker run --rm -v $(pwd)/output:/out chat-renderer
```

## Features

- **Pixel-perfect UI replication** of Remotion chat interfaces
- **Three themes**: iMessage, WhatsApp, Snapchat
- **Synchronized audio**: Keyboard clicks during typing, send/receive chimes
- **Dual rendering modes**: Playwright (preferred) + MoviePy fallback
- **Hardware acceleration**: NVENC/VAAPI support with CPU fallback
- **Appwrite integration**: Job orchestration and storage
- **Production ready**: Docker support, retry handling, timeouts

## Architecture

```
render-pipeline/
├── renderer/           # Core rendering engine
├── templates/          # HTML templates for Playwright
├── assets/            # Audio files and static assets
├── appwrite/          # Appwrite integration
├── nextjs/            # Next.js API examples
├── examples/          # Sample conversations and outputs
└── tests/             # Test suite
```

## Rendering Modes

### 1. Playwright Mode (Preferred)
- Loads HTML template with exact CSS/animations
- Records browser video with perfect pixel accuracy
- Transcodes to MP4 with ffmpeg
- Merges synchronized audio tracks

### 2. MoviePy Fallback
- Pure Python rendering using Pillow
- CPU-bound but avoids Chromium overhead
- Programmatic frame generation
- Suitable for headless environments

## Audio System

- **Keyboard clicks**: Generated during typing (11 chars/sec)
- **Send chime**: Plays when message is sent
- **Receive chime**: Plays when message is received
- **Synchronization**: Audio aligned to exact frame timings

## Appwrite Integration

```python
# Submit job
POST /v1/functions/chat-renderer
{
  "conversation": {...},
  "output": "output.mp4"
}

# Poll for completion
GET /v1/storage/buckets/videos/files/{fileId}
```

## Performance Tips

- Use 720p for previews, 1080p for final exports
- Enable hardware acceleration: `nvenc` (NVIDIA) or `vaapi` (Intel/AMD)
- Use `-preset veryfast` for CPU-only rendering
- Scale workers horizontally for batch processing

## Deployment

### Local Development
```bash
python renderer/render.py input.json output.mp4
```

### Docker Worker
```bash
docker-compose up -d worker
```

### Appwrite Function
```bash
# Deploy function
appwrite functions create --name chat-renderer
appwrite functions deploy --functionId chat-renderer
```

## Testing

```bash
# Run test suite
python -m pytest tests/

# Validate sample output
python tests/test_render_basic.py
```

## Configuration

See `examples/conversation.json` for input format and `renderer/video_presets.py` for quality settings.
