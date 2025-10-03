# 🎬 Browser-Based iMessage Video Renderer

**Pixel-perfect iMessage videos with typing animations, keyboard visible, and realistic UI!**

## ✨ Features

- ✅ **Character-by-character typing** animation
- ✅ **iOS keyboard visible** and animated
- ✅ **Typing indicators** for incoming messages  
- ✅ **Message bubble slide-in** animations
- ✅ **Cursor blinking** while typing
- ✅ **Realistic iMessage UI** (header, status bar, contact name)
- ✅ **Emoji support** 😊
- ✅ **Audio sync** (optional keyboard clicks/chimes)

---

## 🚀 Quick Start

### 1. One-Time Setup (2-3 minutes)

```bash
cd ~/whop-app/render-pipeline

# Install Playwright + Chromium (~200MB, one-time only)
bash setup_browser_renderer.sh
```

**Note**: Chromium is downloaded ONCE and cached. Future renders reuse it instantly!

---

### 2. Render Your First Video

```bash
python browser_renderer.py --input examples/conversation.json --output /tmp/video.mp4
```

**Output**: Realistic iMessage video with full typing animations! 🎉

---

## 📖 Usage

### Basic Render
```bash
python browser_renderer.py -i conversation.json -o output.mp4
```

### Custom Dimensions
```bash
python browser_renderer.py -i conversation.json -o output.mp4 --width 390 --height 844
```

### With Audio Overlay
```bash
python browser_renderer.py -i conversation.json -o output.mp4 --audio background.mp3
```

---

## 📝 JSON Format

```json
{
  "contactName": "Alex",
  "messages": [
    {
      "text": "Hey!",
      "sent": false
    },
    {
      "text": "Hi there!",
      "sent": true
    }
  ]
}
```

**Fields**:
- `contactName`: Name shown in header (default: "Messages")
- `messages`: Array of message objects
  - `text`: Message content (supports emoji!)
  - `sent`: `true` = blue bubble (you), `false` = gray bubble (them)

---

## 🎨 What It Looks Like

### Before (Old Renderer)
- ❌ No typing animation
- ❌ No keyboard
- ❌ Static bubbles appear instantly

### After (Browser Renderer)
- ✅ **Character-by-character typing** with cursor
- ✅ **iOS keyboard visible** at bottom
- ✅ **Typing indicators** (three bouncing dots)
- ✅ **Smooth bubble animations**
- ✅ **Looks exactly like real iMessage!**

---

## ⚙️ How It Works

1. **Playwright** launches headless Chromium browser
2. Loads `templates/imessage.html` (pixel-perfect iMessage UI)
3. JavaScript animates typing character-by-character
4. Captures frames at 30 FPS
5. Encodes frames to MP4 with ffmpeg

**Performance**:
- ~2-3 seconds per message
- 8-message conversation: ~20-30 seconds render time
- XSMALL GPU instance recommended

---

## 🆚 Comparison: Browser vs MoviePy Renderer

| Feature | Browser Renderer | MoviePy Renderer |
|---------|-----------------|------------------|
| Typing animation | ✅ Character-by-character | ❌ None |
| Keyboard visible | ✅ Yes | ❌ No |
| Typing indicators | ✅ Animated dots | ❌ None |
| UI quality | ✅ Pixel-perfect | ⚠️ Basic |
| Emoji support | ✅ Full | ⚠️ Limited |
| Setup | Chromium download | No dependencies |
| Speed | ~3s per message | ~1s per message |

**Recommendation**: Use **Browser Renderer** for production videos!

---

## 🐛 Troubleshooting

### "Playwright not installed"
```bash
pip install playwright
playwright install chromium
```

### "Template not found"
Make sure `templates/imessage.html` exists:
```bash
ls -l templates/imessage.html
```

### "ffmpeg not found"
```bash
# Check if ffmpeg is installed
ffmpeg -version

# If not, install it (in Camber, it's pre-installed)
sudo apt install ffmpeg
```

### Video is too fast/slow
Adjust FPS:
```bash
python browser_renderer.py -i input.json -o output.mp4 --fps 60  # Smoother
python browser_renderer.py -i input.json -o output.mp4 --fps 24  # Cinematic
```

---

## 📦 Requirements

- Python 3.8+
- Playwright (`pip install playwright`)
- Chromium browser (`playwright install chromium`)
- ffmpeg (pre-installed in Camber)

---

## 🎯 Next Steps

1. ✅ Render your first video
2. Test with your own conversation JSON
3. Customize `templates/imessage.html` for different themes
4. Add audio (keyboard clicks, chimes)
5. Integrate with Appwrite upload

---

## 📚 See Also

- `renderer.py` - Original MoviePy-based renderer (faster, simpler)
- `examples/conversation.json` - Sample conversation
- `templates/imessage.html` - Customize UI here

---

**Made with ❤️ for realistic iMessage video generation!**
