"""
Camber serverless function wrapper for browser_renderer.py

This creates an HTTP endpoint that accepts video generation requests
and runs browser_renderer.py in the cloud.
"""

import json
import os
import sys
import tempfile
from pathlib import Path

# Import the renderer
sys.path.insert(0, str(Path(__file__).parent))
from browser_renderer import BrowserRenderer


async def handler(event, context):
    """
    Camber function handler
    
    Event format:
    {
        "jobId": "job_123",
        "conversation": {
            "contactName": "Alex",
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
        conversation = event.get('conversation')
        upload_to_appwrite = event.get('uploadToAppwrite', True)
        webhook_url = event.get('webhookUrl')
        
        print(f"📥 Received job: {job_id}")
        
        # Create temp files
        temp_input = tempfile.mktemp(suffix='.json')
        temp_output = tempfile.mktemp(suffix='.mp4')
        
        # Write conversation
        with open(temp_input, 'w') as f:
            json.dump(conversation, f)
        
        # Render video
        renderer = BrowserRenderer(width=390, height=844, fps=30)
        
        await renderer.render_video(
            conversation=conversation,
            output_path=temp_output
        )
        
        print(f"✅ Video rendered: {temp_output}")
        
        # Upload to Appwrite
        video_url = None
        file_id = None
        
        if upload_to_appwrite:
            upload_result = renderer.upload_to_appwrite(
                video_path=temp_output,
                endpoint=os.environ['APPWRITE_ENDPOINT'],
                project_id=os.environ['APPWRITE_PROJECT_ID'],
                api_key=os.environ['APPWRITE_API_KEY'],
                bucket_id=os.environ['APPWRITE_BUCKET_ID']
            )
            video_url = upload_result['url']
            file_id = upload_result['file_id']
            print(f"✅ Uploaded to Appwrite: {file_id}")
        
        # Send webhook notification
        if webhook_url:
            import requests
            requests.post(webhook_url, json={
                'jobId': job_id,
                'status': 'completed',
                'videoUrl': video_url,
                'fileId': file_id
            }, headers={
                'x-camber-signature': generate_signature(job_id)
            })
            print(f"✅ Webhook sent: {webhook_url}")
        
        # Cleanup
        os.unlink(temp_input)
        os.unlink(temp_output)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'jobId': job_id,
                'status': 'completed',
                'videoUrl': video_url,
                'fileId': file_id
            })
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
        # Send failure webhook
        if webhook_url:
            import requests
            requests.post(webhook_url, json={
                'jobId': job_id,
                'status': 'failed',
                'error': str(e)
            })
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def generate_signature(job_id):
    """Generate HMAC signature for webhook"""
    import hmac
    import hashlib
    
    secret = os.environ.get('CAMBER_WEBHOOK_SECRET', '')
    signature = hmac.new(
        secret.encode(),
        job_id.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return signature
