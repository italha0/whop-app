# How to Use Camber JupyterLab - Actual Guide

You're in **jupyter.cambercloud.com** - this is a JupyterLab environment, NOT a deployment dashboard.

---

## ✅ What You're Looking At

- **URL:** `jupyter.cambercloud.com/user/cefbdac7-441e-45fa-a2a8-eabc650aacd7/lab/tree/whop-app`
- **What it is:** A cloud-hosted JupyterLab environment
- **What you can do:** Run Python code directly, create notebooks, execute scripts
- **What it's NOT:** A deployment platform with "Deploy" buttons

---

## 🎯 How to Run Your Video Renderer in Camber

### Method 1: Terminal (Quickest)

**You already have Terminal 2 open!** Use it:

```bash
# 1. Navigate to your render-pipeline directory
cd /whop-app/render-pipeline

# 2. Install dependencies (one time only)
pip install -r requirements.txt

# 3. Run the renderer
python renderer.py --input examples/conversation_simple.json --output /tmp/test.mp4

# 4. Check the output
ls -lh /tmp/test.mp4

# 5. Download it - Right-click on the file in the file browser and select "Download"
```

### Method 2: Jupyter Notebook (Interactive)

1. **Click:** File → New → Notebook
2. **Select:** Python 3 kernel
3. **Type in first cell:**

```python
# Change to render-pipeline directory
import os
os.chdir('/whop-app/render-pipeline')

# Install dependencies if needed
!pip install -q -r requirements.txt

print("✓ Ready to render!")
```

4. **Press:** Shift+Enter to run

5. **In next cell:**

```python
from renderer import render_chat_video
import json

# Load example conversation
with open('examples/conversation_simple.json') as f:
    conversation = json.load(f)

# Render video
print("🎬 Rendering video...")
result = render_chat_video(conversation, '/tmp/output.mp4')
print(f"✅ Done! Duration: {result['duration']:.2f}s")
print(f"📁 Video saved to: /tmp/output.mp4")
```

6. **Press:** Shift+Enter to run
7. **Wait:** 1-2 minutes for rendering
8. **Download:** 
   - Go to file browser (left sidebar)
   - Navigate to `/tmp/output.mp4`
   - Right-click → Download

---

## 📊 What Each Part of the Interface Does

```
┌────────────────────────────────────────────┐
│ File Edit View Run Kernel LaTeX Tabs...   │ ← Menu bar
├────────┬───────────────────────────────────┤
│ [+]    │ Terminal 2                   [x]  │ ← Tabs
├────────┼───────────────────────────────────┤
│ 📁     │                                   │
│ Files  │  joryan@notebook-cefbdac7...      │
│        │  ~/whop-app/render-pipeline$ _    │ ← Terminal (use this!)
│ whop-  │                                   │
│  app/  │                                   │
│  ├ app │                                   │
│  ├ lib │                                   │
│  └ render-pipeline/  ← Your code is here  │
│     ├ examples/                            │
│     ├ renderer.py                          │
│     ├ requirements.txt                     │
│     └ camber.yaml                          │
└────────┴───────────────────────────────────┘
```

---

## 🚀 Quick Start Commands (Copy-Paste)

**In Terminal 2 (already open), paste these one by one:**

```bash
# Navigate to project
cd /whop-app/render-pipeline

# Install dependencies
pip install -r requirements.txt

# Test render
python renderer.py --input examples/conversation_simple.json --output /tmp/test_video.mp4
```

**Wait 1-2 minutes, then:**

```bash
# Check if video was created
ls -lh /tmp/test_video.mp4

# Should show something like: -rw-r--r-- 1 joryan joryan 8.5M Oct 3 12:34 /tmp/test_video.mp4
```

---

## 📥 How to Download Your Video

### Option 1: File Browser

1. Click the **folder icon** in the left sidebar (if not already visible)
2. Navigate to `/tmp/`
3. Find `test_video.mp4`
4. **Right-click** on it
5. Select **"Download"**

### Option 2: Terminal Command

```bash
# Copy to your home directory for easier access
cp /tmp/test_video.mp4 ~/test_video.mp4

# Then download from file browser: ~/ → test_video.mp4
```

---

## 🎬 Complete Working Example

**Paste this entire block into Terminal 2:**

```bash
#!/bin/bash
echo "🎬 Starting video render test..."

cd /whop-app/render-pipeline

echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

echo "🎨 Rendering video..."
python renderer.py \
  --input examples/conversation_simple.json \
  --output /tmp/camber_test_output.mp4

if [ -f /tmp/camber_test_output.mp4 ]; then
    echo "✅ Success! Video created:"
    ls -lh /tmp/camber_test_output.mp4
    echo ""
    echo "📥 To download:"
    echo "1. Click folder icon (left sidebar)"
    echo "2. Navigate to /tmp/"
    echo "3. Right-click camber_test_output.mp4"
    echo "4. Select 'Download'"
else
    echo "❌ Error: Video not created"
    echo "Check errors above"
fi
```

---

## 🔄 Running Multiple Videos (Batch)

Create a new Python file or notebook:

```python
import os
import sys
sys.path.append('/whop-app/render-pipeline')

from renderer import render_chat_video
import json
import time

# Example conversations
conversations = [
    {
        "messages": [
            {"sender": "them", "text": "Hey! How are you?", "timestamp": 1.0},
            {"sender": "you", "text": "Great! Thanks for asking!", "timestamp": 3.0}
        ]
    },
    {
        "messages": [
            {"sender": "you", "text": "What's up?", "timestamp": 1.0},
            {"sender": "them", "text": "Not much, you?", "timestamp": 3.0}
        ]
    }
]

# Render each one
for i, conv in enumerate(conversations, 1):
    print(f"\n🎬 Rendering video {i}/{len(conversations)}...")
    start = time.time()
    
    result = render_chat_video(conv, f'/tmp/video_{i}.mp4')
    
    elapsed = time.time() - start
    print(f"✅ Video {i} done in {elapsed:.1f}s (duration: {result['duration']:.1f}s)")

print("\n🎉 All videos rendered!")
print("📁 Videos are in /tmp/ directory")
```

---

## 💾 Saving Videos to Appwrite

Add upload after rendering:

```python
from renderer import render_chat_video, upload_to_appwrite
import os

# Render
conversation = {...}  # Your conversation JSON
result = render_chat_video(conversation, '/tmp/output.mp4')

# Upload to Appwrite
upload_result = upload_to_appwrite(
    file_path='/tmp/output.mp4',
    bucket_id='rendered_videos',
    endpoint=os.environ.get('APPWRITE_ENDPOINT'),
    project=os.environ.get('APPWRITE_PROJECT_ID'),
    api_key=os.environ.get('APPWRITE_API_KEY')
)

print(f"✅ Uploaded! URL: {upload_result['url']}")
```

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'moviepy'"

**Solution:**
```bash
pip install -r requirements.txt
```

### "renderer.py: command not found"

**Solution:**
```bash
# Make sure you're in the right directory
cd /whop-app/render-pipeline
pwd  # Should show: /whop-app/render-pipeline
```

### "Can't find the video file"

**Solution:**
```bash
# Check where it was saved
ls -la /tmp/*.mp4

# Or search for it
find / -name "*.mp4" 2>/dev/null | head -20
```

### "ffmpeg not found"

**Solution:**
```bash
# Install ffmpeg in your Camber environment
sudo apt-get update && sudo apt-get install -y ffmpeg

# Or if you don't have sudo:
# Contact Camber support to add ffmpeg to your environment
```

---

## ⚡ Pro Tips

1. **Use the terminal** - It's faster than notebooks for running scripts
2. **Save to /tmp/** - Easy to find and clean up
3. **Copy important outputs** to your home directory (`~/`) so they don't get lost
4. **Use notebooks for interactive testing** and terminal for production runs
5. **Check file sizes** with `ls -lh` to verify videos rendered correctly

---

## 📊 Expected Performance in Camber

- **15s video:** ~30-60s render time
- **30s video:** ~60-120s render time  
- **60s video:** ~90-180s render time

Camber JupyterLab typically has:
- 2-4 vCPUs
- 8-16GB RAM
- Good network for Appwrite uploads

---

## 🎯 Summary: What to Do Right Now

**Copy-paste this into Terminal 2:**

```bash
cd /whop-app/render-pipeline && \
pip install -r requirements.txt && \
python renderer.py --input examples/conversation_simple.json --output /tmp/my_first_video.mp4 && \
echo "✅ Done! Video is at /tmp/my_first_video.mp4"
```

Then download `/tmp/my_first_video.mp4` from the file browser!

---

**Bottom line:** Camber JupyterLab is NOT a "deploy and forget" platform. It's a **cloud Python environment** where you run code directly. No Deploy button exists - you just execute Python scripts and notebooks! 🚀
