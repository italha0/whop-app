# Chat Video Renderer Pipeline - Camber Edition

CPU-optimized video rendering pipeline for generating iMessage-style chat videos. Built for **Camber Cloud** with **Appwrite** storage integration.

## 🎯 Overview

This rendering pipeline generates realistic fake chat videos with:
- ✅ iMessage-style UI (portrait, 1080x1920)
- ✅ Messages slide in with smooth animations
- ✅ Keyboard click sounds during typing simulation
- ✅ Send/receive chimes for message delivery
- ✅ No browser required - pure CPU rendering
- ✅ Optimized for Camber's 200 free CPU hours/month

## 🚀 Quick Start

### Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Test basic rendering
python test_camber.py

# Render a specific conversation
python renderer.py --input examples/conversation.json --output video.mp4
```

### Deploy to Camber

```bash
# Install Camber CLI
pip install camber-cli
camber login

# Deploy
camber deploy --config camber.yaml

# Test deployment
camber run chat-renderer --input examples/conversation.json
```

See [CAMBER_DEPLOYMENT.md](CAMBER_DEPLOYMENT.md) for detailed deployment instructions.

## 📁 File Structure

```
render-pipeline/
├── renderer.py              # Core rendering engine
├── camber_job.py           # Camber job entrypoint
├── camber.yaml             # Camber deployment config
├── test_camber.py          # Testing suite
├── requirements.txt        # Python dependencies
├── CAMBER_DEPLOYMENT.md    # Deployment guide
├── README_CAMBER.md        # This file
├── examples/
│   └── conversation.json   # Example conversation
└── assets/
    └── sounds/             # Audio assets (optional)
```

## 🎨 Usage

### Python API

```python
from renderer import render_chat_video

conversation = {
    "messages": [
        {"sender": "them", "text": "Hey! How are you?"},
        {"sender": "you", "text": "I'm great! 😊"},
        {"sender": "them", "text": "That's awesome!"},
    ]
}

result = render_chat_video(
    conversation_json=conversation,
    output_path="output.mp4",
    width=1080,
    height=1920,
    fps=30
)

print(f"Video rendered! Duration: {result['duration']}s")
```

### With Appwrite Upload

```python
from renderer import render_chat_video, upload_to_appwrite

# Render
render_chat_video(conversation, "/tmp/video.mp4")

# Upload
result = upload_to_appwrite(
    file_path="/tmp/video.mp4",
    bucket_id="chat-videos",
    endpoint="https://cloud.appwrite.io/v1",
    project="YOUR_PROJECT_ID",
    api_key="YOUR_API_KEY"
)

print(f"Video URL: {result['url']}")
```

### Next.js Integration

```typescript
// Use the React hook
import { useCamberRender } from '@/hooks/useCamberRender';

function ChatEditor() {
  const { render, status, videoUrl, isLoading } = useCamberRender();

  const handleRender = async () => {
    const result = await render({
      messages: [
        { sender: 'them', text: 'Hello!' },
        { sender: 'you', text: 'Hi there!' }
      ]
    });
    
    console.log('Video ready:', result.videoUrl);
  };

  return (
    <div>
      <button onClick={handleRender} disabled={isLoading}>
        {isLoading ? 'Rendering...' : 'Generate Video'}
      </button>
      
      {videoUrl && (
        <video src={videoUrl} controls />
      )}
    </div>
  );
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_BUCKET_ID=chat-videos

# Optional: Custom fonts
CHAT_FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
CHAT_FONT_BOLD=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
```

### Conversation JSON Format

```json
{
  "messages": [
    {
      "sender": "you|them",
      "text": "Message text",
      "timestamp": 1.5  // optional, auto-calculated if omitted
    }
  ]
}
```

## 🎥 Rendering Details

### Video Specifications
- **Resolution**: 1080x1920 (portrait, adjustable)
- **Frame rate**: 30 fps
- **Codec**: H.264 (libx264)
- **Audio**: AAC, 44.1kHz
- **Preset**: veryfast (optimized for CPU)
- **CRF**: 23 (balanced quality/size)

### Audio Features
- **Keyboard clicks**: Synthetic or from `assets/sounds/click.wav`
- **Send chime**: Synthetic or from `assets/sounds/send.wav`
- **Receive chime**: Synthetic or from `assets/sounds/receive.wav`
- **Fallback**: Generates synthetic audio if files not found

### Performance
- **60s video**: ~90-120s render time on 1 vCPU
- **CPU usage**: ~1.5-2 CPU-minutes per 60s video
- **Monthly capacity**: ~6,000 videos on Camber free tier (200 CPU hours)

## 🧪 Testing

```bash
# Run full test suite
python test_camber.py

# Test specific features
python -c "from renderer import _synth_click; print(_synth_click())"

# Test with example
python renderer.py --input examples/conversation.json --output test.mp4

# Test with Appwrite upload
export APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
export APPWRITE_PROJECT_ID=your_project_id
export APPWRITE_API_KEY=your_api_key
export APPWRITE_BUCKET_ID=chat-videos

python renderer.py --input examples/conversation.json --output test.mp4 --upload
```

## 🐛 Troubleshooting

### "FFmpeg not found"
```bash
# Linux/Camber
apt-get update && apt-get install -y ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### "Font not found"
```bash
# Install DejaVu fonts
apt-get install -y fonts-dejavu-core

# Or set custom font path
export CHAT_FONT=/path/to/font.ttf
```

### "MoviePy import error"
```bash
# Use pinned version for compatibility
pip install moviepy==1.0.3 imageio<3 imageio-ffmpeg<0.5
```

### "Appwrite upload failed"
- Check API key has `files.write` permission
- Verify bucket ID is correct
- Ensure bucket allows MP4 files
- Check file size limit (increase to 100MB+)

## 📊 Cost Analysis

### Camber Cloud
| Tier | CPU Hours | Cost | Videos/month (60s) | Cost per Video |
|------|-----------|------|-------------------|----------------|
| Free | 200 | $0 | ~6,000 | $0 |
| Paid | Unlimited | $0.10/CPU hr | Unlimited | ~$0.0033 |

### Appwrite Cloud
| Resource | Free Tier | Usage per Video |
|----------|-----------|----------------|
| Storage | 2GB | ~100MB/video = 20 videos |
| Bandwidth | 10GB/month | ~100MB download = 100 views |

## 🔒 Security

- ✅ Never commit API keys to Git
- ✅ Use Camber secrets for sensitive values
- ✅ Validate all input JSON before rendering
- ✅ Set appropriate Appwrite bucket permissions
- ✅ Rate limit frontend API calls
- ✅ Sanitize user input to prevent injection

## 📚 Documentation

- [CAMBER_DEPLOYMENT.md](CAMBER_DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - General deployment options
- [examples/](examples/) - Example conversations

## 🤝 Contributing

1. Test your changes: `python test_camber.py`
2. Ensure no regressions in rendering quality
3. Update documentation for new features
4. Follow existing code style

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Camber Docs**: [docs.camber.ai](https://docs.camber.ai)
- **Appwrite Docs**: [appwrite.io/docs](https://appwrite.io/docs)

---

**Built with** 💙 **for the Whop community**
