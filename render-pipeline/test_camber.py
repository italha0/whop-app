#!/usr/bin/env python3
"""
Test script for Camber deployment.
Validates rendering and Appwrite upload locally before deploying to Camber.
"""

import json
import os
import sys
import tempfile
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from renderer import render_chat_video, upload_to_appwrite


def test_basic_render():
    """Test basic rendering without Appwrite."""
    print("\n" + "=" * 60)
    print("TEST 1: Basic Rendering")
    print("=" * 60)
    
    conversation = {
        "messages": [
            {"sender": "them", "text": "Hey! How are you?"},
            {"sender": "you", "text": "I'm doing great! 😊"},
            {"sender": "them", "text": "That's awesome!"},
            {"sender": "you", "text": "Thanks for asking!"},
        ]
    }
    
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        output_path = tmp.name
    
    try:
        print(f"📝 Rendering {len(conversation['messages'])} messages...")
        result = render_chat_video(conversation, output_path)
        
        file_size = os.path.getsize(output_path)
        duration = result.get("duration", 0)
        
        print(f"✅ Render successful!")
        print(f"   Duration: {duration:.1f}s")
        print(f"   File size: {file_size / 1024 / 1024:.1f}MB")
        print(f"   Output: {output_path}")
        
        return True, output_path
        
    except Exception as e:
        print(f"❌ Render failed: {e}")
        return False, None


def test_appwrite_upload(video_path: str):
    """Test Appwrite upload."""
    print("\n" + "=" * 60)
    print("TEST 2: Appwrite Upload")
    print("=" * 60)
    
    # Get config from environment
    config = {
        "endpoint": os.getenv("APPWRITE_ENDPOINT"),
        "project": os.getenv("APPWRITE_PROJECT_ID"),
        "api_key": os.getenv("APPWRITE_API_KEY"),
        "bucket_id": os.getenv("APPWRITE_BUCKET_ID"),
    }
    
    missing = [k for k, v in config.items() if not v]
    if missing:
        print(f"⚠️ Skipping Appwrite test - missing env vars: {', '.join(missing)}")
        print("\nTo test upload, set:")
        print("  export APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1")
        print("  export APPWRITE_PROJECT_ID=your_project_id")
        print("  export APPWRITE_API_KEY=your_api_key")
        print("  export APPWRITE_BUCKET_ID=your_bucket_id")
        return False
    
    try:
        print("☁️ Uploading to Appwrite...")
        result = upload_to_appwrite(
            video_path,
            config["bucket_id"],
            config["endpoint"],
            config["project"],
            config["api_key"]
        )
        
        print(f"✅ Upload successful!")
        print(f"   File ID: {result['file_id']}")
        print(f"   View URL: {result['url']}")
        print(f"   Download URL: {result['download_url']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_audio_fallback():
    """Test synthetic audio generation."""
    print("\n" + "=" * 60)
    print("TEST 3: Synthetic Audio Fallback")
    print("=" * 60)
    
    from renderer import _synth_click, _synth_chime
    
    try:
        print("🔊 Generating synthetic click...")
        click = _synth_click()
        print(f"   Duration: {len(click)}ms")
        print(f"   Sample rate: {click.frame_rate}Hz")
        
        print("🔊 Generating synthetic chime...")
        chime = _synth_chime()
        print(f"   Duration: {len(chime)}ms")
        print(f"   Sample rate: {chime.frame_rate}Hz")
        
        print("✅ Audio synthesis works!")
        return True
        
    except Exception as e:
        print(f"❌ Audio synthesis failed: {e}")
        return False


def test_error_handling():
    """Test error handling."""
    print("\n" + "=" * 60)
    print("TEST 4: Error Handling")
    print("=" * 60)
    
    # Test empty messages
    print("Testing empty messages...")
    try:
        render_chat_video({"messages": []}, "/tmp/test.mp4")
        print("❌ Should have raised ValueError for empty messages")
        return False
    except ValueError as e:
        print(f"✅ Correctly caught empty messages: {e}")
    
    # Test invalid sender
    print("\nTesting invalid JSON structure...")
    try:
        render_chat_video({"invalid": "structure"}, "/tmp/test.mp4")
        print("❌ Should have raised ValueError for invalid structure")
        return False
    except ValueError as e:
        print(f"✅ Correctly caught invalid structure: {e}")
    
    print("\n✅ Error handling works correctly!")
    return True


def test_example_conversation():
    """Test with example conversation.json."""
    print("\n" + "=" * 60)
    print("TEST 5: Example Conversation")
    print("=" * 60)
    
    example_path = Path(__file__).parent / "examples" / "conversation.json"
    
    if not example_path.exists():
        print(f"⚠️ Example file not found: {example_path}")
        return False
    
    try:
        with open(example_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Convert to renderer format
        messages = []
        for msg in data.get("messages", []):
            messages.append({
                "sender": "you" if msg.get("sent", False) else "them",
                "text": msg.get("text", ""),
            })
        
        conversation = {"messages": messages}
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            output_path = tmp.name
        
        print(f"📝 Rendering example with {len(messages)} messages...")
        result = render_chat_video(conversation, output_path)
        
        file_size = os.path.getsize(output_path)
        duration = result.get("duration", 0)
        
        print(f"✅ Example render successful!")
        print(f"   Duration: {duration:.1f}s")
        print(f"   File size: {file_size / 1024 / 1024:.1f}MB")
        print(f"   Output: {output_path}")
        
        # Clean up
        os.remove(output_path)
        
        return True
        
    except Exception as e:
        print(f"❌ Example render failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "🚀" * 30)
    print("Camber Deployment Test Suite")
    print("🚀" * 30)
    
    results = {}
    video_path = None
    
    # Test 1: Basic render
    success, video_path = test_basic_render()
    results["basic_render"] = success
    
    # Test 2: Appwrite upload (if config available)
    if video_path and success:
        results["appwrite_upload"] = test_appwrite_upload(video_path)
        # Clean up
        try:
            os.remove(video_path)
        except:
            pass
    
    # Test 3: Audio fallback
    results["audio_fallback"] = test_audio_fallback()
    
    # Test 4: Error handling
    results["error_handling"] = test_error_handling()
    
    # Test 5: Example conversation
    results["example_conversation"] = test_example_conversation()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test}")
    
    print("\n" + "=" * 60)
    print(f"Result: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All tests passed! Ready for Camber deployment.")
        return 0
    else:
        print("\n⚠️ Some tests failed. Please review errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
