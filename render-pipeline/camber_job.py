"""
Camber job entrypoint for chat video rendering.
This script is designed to run inside Camber's execution environment.
"""

import json
import os
import sys
import tempfile
import traceback
from pathlib import Path
from typing import Dict, Any

# Add current directory to path to import renderer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from renderer import render_chat_video, upload_to_appwrite


def validate_conversation(data: Dict[str, Any]) -> bool:
    """Validate conversation JSON structure."""
    if not isinstance(data, dict):
        raise ValueError("Conversation must be a dictionary")
    
    messages = data.get("messages", [])
    if not isinstance(messages, list):
        raise ValueError("messages must be an array")
    
    if len(messages) == 0:
        raise ValueError("messages array cannot be empty")
    
    if len(messages) > 100:
        raise ValueError("Too many messages (max 100)")
    
    for i, msg in enumerate(messages):
        if not isinstance(msg, dict):
            raise ValueError(f"Message {i} must be an object")
        
        if "text" not in msg:
            raise ValueError(f"Message {i} missing 'text' field")
        
        text = msg["text"]
        if not isinstance(text, str) or len(text.strip()) == 0:
            raise ValueError(f"Message {i} has invalid text")
        
        if len(text) > 500:
            raise ValueError(f"Message {i} text too long (max 500 chars)")
        
        sender = msg.get("sender", "them")
        if sender not in ["you", "them"]:
            raise ValueError(f"Message {i} has invalid sender: {sender}")
    
    return True


def get_appwrite_config() -> Dict[str, str]:
    """Get Appwrite configuration from environment variables."""
    config = {
        "endpoint": os.getenv("APPWRITE_ENDPOINT"),
        "project": os.getenv("APPWRITE_PROJECT_ID"),
        "api_key": os.getenv("APPWRITE_API_KEY"),
        "bucket_id": os.getenv("APPWRITE_BUCKET_ID"),
    }
    
    missing = [k for k, v in config.items() if not v]
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            f"Please set: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, "
            f"APPWRITE_API_KEY, APPWRITE_BUCKET_ID"
        )
    
    return config


def process_job(conversation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single rendering job.
    
    Args:
        conversation: Conversation JSON with messages array
    
    Returns:
        Dict with success status, video_url, and metadata
    """
    temp_output = None
    
    try:
        # Validate input
        print("📝 Validating conversation...")
        validate_conversation(conversation)
        print(f"✅ Valid conversation with {len(conversation['messages'])} messages")
        
        # Get Appwrite config
        print("🔐 Loading Appwrite configuration...")
        appwrite_config = get_appwrite_config()
        
        # Create temporary output file
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            temp_output = tmp.name
        
        print(f"🎬 Rendering video to {temp_output}...")
        
        # Render the video
        render_result = render_chat_video(
            conversation_json=conversation,
            output_path=temp_output,
            width=1080,
            height=1920,
            fps=30
        )
        
        duration = render_result.get("duration", 0)
        file_size = os.path.getsize(temp_output)
        print(f"✅ Rendering complete! Duration: {duration:.1f}s, Size: {file_size/1024/1024:.1f}MB")
        
        # Upload to Appwrite
        print("☁️ Uploading to Appwrite Storage...")
        upload_result = upload_to_appwrite(
            file_path=temp_output,
            bucket_id=appwrite_config["bucket_id"],
            endpoint=appwrite_config["endpoint"],
            project=appwrite_config["project"],
            api_key=appwrite_config["api_key"]
        )
        
        file_id = upload_result["file_id"]
        video_url = upload_result["url"]
        print(f"✅ Upload complete! File ID: {file_id}")
        print(f"🎥 Video URL: {video_url}")
        
        return {
            "success": True,
            "file_id": file_id,
            "video_url": video_url,
            "public_url": video_url,
            "duration": duration,
            "file_size": file_size,
            "message_count": len(conversation["messages"]),
        }
        
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        print(f"❌ Job failed: {error_msg}", file=sys.stderr)
        print(f"Stack trace:\n{error_trace}", file=sys.stderr)
        
        return {
            "success": False,
            "error": error_msg,
            "error_type": type(e).__name__,
            "traceback": error_trace,
        }
    
    finally:
        # Clean up temporary file
        if temp_output and os.path.exists(temp_output):
            try:
                os.remove(temp_output)
                print(f"🧹 Cleaned up temporary file: {temp_output}")
            except Exception as e:
                print(f"⚠️ Failed to clean up {temp_output}: {e}", file=sys.stderr)


def main():
    """Main entrypoint for Camber job execution."""
    print("=" * 60)
    print("🚀 Chat Video Renderer - Camber Job")
    print("=" * 60)
    
    # Camber typically passes input via stdin or environment variable
    # Check for input from multiple sources
    
    conversation = None
    
    # Option 1: Read from stdin (most common for Camber)
    if not sys.stdin.isatty():
        try:
            print("📥 Reading conversation from stdin...")
            input_data = sys.stdin.read()
            conversation = json.loads(input_data)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON from stdin: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Option 2: Read from CAMBER_INPUT environment variable
    elif os.getenv("CAMBER_INPUT"):
        try:
            print("📥 Reading conversation from CAMBER_INPUT env var...")
            conversation = json.loads(os.getenv("CAMBER_INPUT"))
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in CAMBER_INPUT: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Option 3: Read from file path in argument
    elif len(sys.argv) > 1:
        input_file = sys.argv[1]
        if not os.path.exists(input_file):
            print(f"❌ Input file not found: {input_file}", file=sys.stderr)
            sys.exit(1)
        
        try:
            print(f"📥 Reading conversation from file: {input_file}")
            with open(input_file, "r", encoding="utf-8") as f:
                conversation = json.load(f)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in file: {e}", file=sys.stderr)
            sys.exit(1)
    
    else:
        print("❌ No input provided. Expected JSON via stdin, CAMBER_INPUT env var, or file path.", file=sys.stderr)
        print("\nUsage examples:", file=sys.stderr)
        print("  echo '{\"messages\":[...]}' | python camber_job.py", file=sys.stderr)
        print("  CAMBER_INPUT='{\"messages\":[...]}' python camber_job.py", file=sys.stderr)
        print("  python camber_job.py conversation.json", file=sys.stderr)
        sys.exit(1)
    
    # Process the job
    result = process_job(conversation)
    
    # Output result as JSON (Camber captures stdout)
    print("\n" + "=" * 60)
    print("📊 Job Result:")
    print("=" * 60)
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
