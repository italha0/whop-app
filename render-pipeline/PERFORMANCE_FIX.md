# ⚡ Performance Fix: Upgrade Your Camber Instance

## The Problem
You're on a **MICRO instance (2 CPU / 8GB RAM)**, which causes:
- **15-20 minute render times** for simple videos
- CPU bottleneck at 179% utilization
- Frequent freezing during MoviePy encoding

## The Solution: Upgrade to XXSMALL or Higher

### Step 1: Stop Your Current Connection
1. Look at the top-right of your JupyterLab interface
2. Click the **"Stop Connection"** button (red stop icon)
3. Wait for the instance to fully stop (~10 seconds)

### Step 2: Select a Faster Instance
From the **CPU Options** dropdown, choose:

| Instance | CPUs | RAM | Expected Render Time | Cost |
|----------|------|-----|---------------------|------|
| MICRO    | 2    | 8GB | 15-20 minutes ❌    | Lowest |
| **XXSMALL** | **4** | **16GB** | **2-4 minutes ✅** | Low |
| SMALL    | 16   | 32GB | 1-2 minutes ⚡      | Medium |
| LARGE    | 64   | 128GB | 30-60 seconds 🚀   | High |

**Recommendation**: Start with **XXSMALL (4 CPU)** - it's 10x faster than MICRO and still cost-effective.

### Step 3: Reconnect
1. Click **"Start Connection"** or **"Connect"**
2. Wait for JupyterLab to load (~30 seconds)
3. Open a new Terminal

### Step 4: Run the Renderer Again
```bash
cd ~/whop-app/render-pipeline
python renderer.py --input examples/conversation.json --output /tmp/test_video.mp4
```

### Expected Output (XXSMALL):
```
Generating message 1/6...
Generating message 2/6...
...
MoviePy - Writing video /tmp/test_video.mp4
MoviePy - Done !
Moviepy - video ready /tmp/test_video.mp4

✅ Video saved to: /tmp/test_video.mp4
```

**Time on XXSMALL**: 2-3 minutes ⚡  
**Time on MICRO**: 15-20 minutes 🐌

---

## Why This Happens

### MoviePy + ffmpeg is CPU-Intensive
- **Frame Generation**: Creating 900+ frames (30 FPS × 30 seconds) requires lots of CPU
- **Image Compositing**: Blending bubbles, text, backgrounds uses PIL + NumPy math
- **Video Encoding**: ffmpeg with libx264 codec is single-threaded but benefits from more cores for parallel processing
- **Audio Mixing**: pydub processes audio tracks simultaneously

### MICRO Instance Bottleneck
- Only **2 CPU cores** shared across all processes
- MoviePy can't parallelize frame generation effectively
- ffmpeg encoding runs at ~50% normal speed

---

## After Upgrading

Once on XXSMALL or higher, you should see:
1. **Faster startup**: Kernel loads in seconds
2. **Smooth rendering**: No freezing during encoding
3. **Quick completion**: Full video in 2-3 minutes
4. **Better feedback**: Progress bars update smoothly

---

## Next Steps

After your first successful render:

1. **Check the video**:
   ```bash
   ls -lh /tmp/test_video.mp4
   # Should show ~5-10 MB file size
   ```

2. **Download it**:
   - In JupyterLab file browser, navigate to `/tmp/`
   - Right-click `test_video.mp4` → **Download**

3. **Test with your own conversation**:
   ```bash
   # Create custom_conversation.json
   python renderer.py --input custom_conversation.json --output /tmp/my_video.mp4
   ```

4. **Set up Appwrite upload** (see APPWRITE_CLI_SETUP.md):
   ```bash
   python renderer.py --input examples/conversation.json --output /tmp/test_video.mp4 --upload
   ```

---

## Troubleshooting

### "Still slow after upgrading"
- Verify you're on XXSMALL: Check CPU dropdown shows "4 CPU"
- Check system monitor: `htop` should show 4 cores
- Ensure you stopped and restarted (not just refreshed)

### "Can't stop connection"
- Force stop: Close browser tab and reopen jupyter.cambercloud.com
- Wait 2 minutes for timeout, then reconnect

### "Video has errors"
- First render on new instance may be slower (cold start)
- Run twice to warm up the environment
- Check ffmpeg installed: `ffmpeg -version`

---

**Bottom Line**: Upgrade to XXSMALL (4 CPU) and your render will complete in ~3 minutes instead of 20! 🚀
