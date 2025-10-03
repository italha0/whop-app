# Quick Start Guide

Get the chat renderer running in 5 minutes!

## 1. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Install Playwright browser
bash playwright_install.sh
```

## 2. Test Basic Rendering

```bash
# Render the example conversation
python renderer/render.py examples/conversation.json examples/output.mp4

# Check the output
ls -la examples/output.mp4
```

## 3. Run Tests

```bash
# Run all tests
python tests/run_all_tests.py

# Or run individual tests
python tests/test_render_basic.py
python tests/test_audio_generation.py
```

## 4. Docker Test

```bash
# Build and run with Docker
docker build -t chat-renderer .
docker run --rm -v $(pwd)/output:/out chat-renderer
```

## 5. Appwrite Integration (Optional)

```bash
# Set environment variables
export APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
export APPWRITE_PROJECT_ID="your_project_id"
export APPWRITE_API_KEY="your_api_key"

# Test Appwrite integration
python appwrite/function_wrapper.py --conversation examples/conversation.json
```

## Expected Output

You should see:
- ✅ Video file created in `examples/output.mp4`
- ✅ Keyboard clicks during typing
- ✅ Send/receive chimes
- ✅ Pixel-perfect iMessage UI replication
- ✅ All tests passing

## Troubleshooting

**Playwright not found:**
```bash
playwright install chromium
```

**FFmpeg not found:**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS  
brew install ffmpeg
```

**Audio generation fails:**
```bash
pip install numpy scipy
```

## Next Steps

1. **Customize**: Edit `examples/conversation.json` with your messages
2. **Themes**: Try `whatsapp` or `snapchat` themes
3. **Quality**: Use `--preset high` for better quality
4. **Deploy**: Follow `DEPLOYMENT.md` for production setup

## File Structure

```
render-pipeline/
├── renderer/           # Core rendering engine
├── templates/          # HTML templates
├── assets/            # Audio files
├── appwrite/          # Appwrite integration
├── nextjs/            # Next.js examples
├── examples/          # Sample data
└── tests/             # Test suite
```

Ready to render! 🎬

