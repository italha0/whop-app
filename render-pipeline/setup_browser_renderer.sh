#!/bin/bash
# One-time setup for browser-based renderer

echo "🚀 Installing Playwright and Chromium..."
echo ""
echo "This is a ONE-TIME download (~200MB)"
echo "Future renders will reuse the cached browser!"
echo ""

# Install Playwright
pip install playwright

# Install Chromium browser
playwright install chromium

echo ""
echo "✅ Setup complete!"
echo ""
echo "Now you can render videos with:"
echo "  python browser_renderer.py --input examples/conversation.json --output /tmp/video.mp4"
echo ""
