#!/bin/bash

# Install Playwright browsers
echo "Installing Playwright browsers..."
playwright install chromium

# Install system dependencies for audio/video processing
echo "Installing system dependencies..."

# Check if running on Ubuntu/Debian
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y ffmpeg libasound2-dev portaudio19-dev
fi

# Check if running on macOS
if command -v brew &> /dev/null; then
    brew install ffmpeg portaudio
fi

# Check if running on Windows (Git Bash)
if command -v choco &> /dev/null; then
    choco install ffmpeg
fi

echo "Installation complete!"
echo "Run: python renderer/render.py examples/conversation.json examples/output.mp4"

