"""
Camber serverless function for Remotion-based video rendering
This replaces the old Python-based renderer with Remotion
"""

import json
import os
import subprocess
import tempfile
import asyncio
from pathlib import Path
import requests
from typing import Dict, Any, Optional


class RemotionRenderer:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
    async def render_video(
        self, 
        conversation: Dict[str, Any], 
        output_path: str,
        job_id: str
    ) -> Dict[str, Any]:
        """Render video using Remotion"""
        try:
            print(f"🎬 Starting Remotion render for job {job_id}")
            
            # Create input file for Remotion
            input_file = os.path.join(self.temp_dir, f"{job_id}_input.json")
            with open(input_file, 'w') as f:
                json.dump(conversation, f)
            
            # Prepare Remotion command
            cmd = [
                "npx", "remotion", "render",
                "remotion/index.ts",
                "MessageConversation",
                output_path,
                "--props", input_file,
                "--codec", "h264",
                "--crf", "18",
                "--jpeg-quality", "80"
            ]
            
            print(f"Running command: {' '.join(cmd)}")
            
            # Run Remotion render
            result = subprocess.run(
                cmd,
                cwd="/app",  # Camber will mount the project here
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Remotion render failed: {result.stderr}")
            
            print(f"✅ Video rendered successfully: {output_path}")
            
            return {
                "success": True,
                "output_path": output_path,
                "file_size": os.path.getsize(output_path)
            }
            
        except Exception as e:
            print(f"❌ Render error: {e}")
            raise e
    
    async def upload_to_appwrite(
        self, 
        video_path: str, 
        job_id: str
    ) -> Dict[str, str]:
        """Upload video to Appwrite storage"""
        try:
            print(f"📤 Uploading video to Appwrite for job {job_id}")
            
            # Read video file
            with open(video_path, 'rb') as f:
                video_data = f.read()
            
            # Upload to Appwrite
            endpoint = os.environ['APPWRITE_ENDPOINT']
            project_id = os.environ['APPWRITE_PROJECT_ID']
            api_key = os.environ['APPWRITE_API_KEY']
            bucket_id = os.environ['APPWRITE_VIDEO_BUCKET_ID']
            
            filename = f"video_{job_id}_{int(time.time())}.mp4"
            
            url = f"{endpoint}/storage/buckets/{bucket_id}/files"
            headers = {
                "X-Appwrite-Project": project_id,
                "X-Appwrite-Key": api_key,
                "Content-Type": "video/mp4"
            }
            
            files = {
                "fileId": (None, filename),
                "file": (filename, video_data, "video/mp4")
            }
            
            response = requests.post(url, headers=headers, files=files)
            response.raise_for_status()
            
            result = response.json()
            file_id = result['$id']
            video_url = f"{endpoint}/storage/buckets/{bucket_id}/files/{file_id}/view?project={project_id}"
            
            print(f"✅ Uploaded to Appwrite: {file_id}")
            
            return {
                "file_id": file_id,
                "video_url": video_url
            }
            
        except Exception as e:
            print(f"❌ Upload error: {e}")
            raise e
    
    async def send_webhook(
        self, 
        webhook_url: str, 
        job_id: str, 
        status: str, 
        video_url: Optional[str] = None,
        file_id: Optional[str] = None,
        error: Optional[str] = None
    ):
        """Send webhook notification"""
        try:
            payload = {
                "jobId": job_id,
                "status": status,
                "videoUrl": video_url,
                "fileId": file_id,
                "error": error
            }
            
            # Generate signature
            import hmac
            import hashlib
            import time
            
            secret = os.environ.get('CAMBER_WEBHOOK_SECRET', '')
            timestamp = str(int(time.time()))
            message = f"{timestamp}.{json.dumps(payload)}"
            signature = hmac.new(
                secret.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            headers = {
                "Content-Type": "application/json",
                "X-Camber-Signature": f"t={timestamp},v1={signature}"
            }
            
            response = requests.post(webhook_url, json=payload, headers=headers)
            response.raise_for_status()
            
            print(f"✅ Webhook sent: {webhook_url}")
            
        except Exception as e:
            print(f"❌ Webhook error: {e}")
            # Don't raise - webhook failure shouldn't fail the job


async def handler(event, context):
    """
    Camber function handler for Remotion video rendering
    
    Event format:
    {
        "jobId": "job_123",
        "conversation": {
            "contactName": "Alex",
            "theme": "imessage",
            "messages": [...]
        },
        "uploadToAppwrite": true,
        "webhookUrl": "https://yourapp.com/api/camber-webhook"
    }
    """
    try:
        # Parse request
        if isinstance(event, str):
            event = json.loads(event)
        
        job_id = event.get('jobId')
        conversation = event.get('conversation', {})
        upload_to_appwrite = event.get('uploadToAppwrite', True)
        webhook_url = event.get('webhookUrl')
        
        if not job_id:
            raise ValueError("Missing jobId")
        
        print(f"📥 Processing job {job_id}")
        
        # Initialize renderer
        renderer = RemotionRenderer()
        
        # Create output file
        output_path = os.path.join(renderer.temp_dir, f"{job_id}_output.mp4")
        
        # Render video
        render_result = await renderer.render_video(conversation, output_path, job_id)
        
        video_url = None
        file_id = None
        
        # Upload to Appwrite if requested
        if upload_to_appwrite:
            upload_result = await renderer.upload_to_appwrite(output_path, job_id)
            video_url = upload_result['video_url']
            file_id = upload_result['file_id']
        
        # Send success webhook
        if webhook_url:
            await renderer.send_webhook(
                webhook_url, job_id, 'completed', 
                video_url, file_id
            )
        
        # Cleanup
        try:
            os.unlink(output_path)
        except:
            pass
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'jobId': job_id,
                'status': 'completed',
                'videoUrl': video_url,
                'fileId': file_id,
                'message': 'Video rendered successfully with Remotion'
            })
        }
        
    except Exception as e:
        print(f"❌ Handler error: {e}")
        
        # Send failure webhook
        if 'webhook_url' in locals() and webhook_url:
            try:
                renderer = RemotionRenderer()
                await renderer.send_webhook(
                    webhook_url, job_id, 'failed', 
                    error=str(e)
                )
            except:
                pass
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'jobId': job_id
            })
        }


# For testing locally
if __name__ == "__main__":
    import time
    
    test_event = {
        "jobId": "test_123",
        "conversation": {
            "contactName": "Test Contact",
            "theme": "imessage",
            "messages": [
                {"id": 1, "text": "Hello!", "sent": False, "time": "0:00"},
                {"id": 2, "text": "Hi there!", "sent": True, "time": "0:02"}
            ]
        },
        "uploadToAppwrite": False,
        "webhookUrl": None
    }
    
    result = asyncio.run(handler(test_event, None))
    print(json.dumps(result, indent=2))
