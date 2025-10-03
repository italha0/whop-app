#!/usr/bin/env python3
"""
Appwrite function wrapper for the chat renderer.
Handles job submission, processing, and result storage.
"""

import os
import json
import asyncio
import tempfile
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

try:
    from appwrite.client import Client
    from appwrite.services.storage import Storage
    from appwrite.services.functions import Functions
    from appwrite.exception import AppwriteException
    APPWRITE_AVAILABLE = True
except ImportError:
    APPWRITE_AVAILABLE = False

# Add renderer to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from renderer.render import ChatRenderer
from renderer.utils import validate_conversation, sanitize_filename

class AppwriteRenderer:
    """Appwrite-integrated chat renderer."""
    
    def __init__(self, 
                 endpoint: str = None,
                 project_id: str = None,
                 api_key: str = None,
                 storage_bucket_id: str = None):
        
        if not APPWRITE_AVAILABLE:
            raise ImportError("Appwrite SDK not available. Install with: pip install appwrite")
        
        # Initialize Appwrite client
        self.client = Client()
        
        if endpoint:
            self.client.set_endpoint(endpoint)
        else:
            self.client.set_endpoint(os.getenv('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        
        if project_id:
            self.client.set_project(project_id)
        else:
            self.client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
        
        if api_key:
            self.client.set_key(api_key)
        else:
            self.client.set_key(os.getenv('APPWRITE_API_KEY'))
        
        self.storage = Storage(self.client)
        self.functions = Functions(self.client)
        self.storage_bucket_id = storage_bucket_id or os.getenv('APPWRITE_STORAGE_BUCKET_ID', 'videos')
        
        print(f"Appwrite renderer initialized - Project: {self.client._project_id}")
    
    async def process_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a rendering job."""
        try:
            # Validate job data
            if 'conversation' not in job_data:
                raise ValueError("Missing 'conversation' in job data")
            
            conversation = job_data['conversation']
            validate_conversation(conversation)
            
            # Get job parameters
            preset = job_data.get('preset', 'standard')
            output_filename = job_data.get('output_filename', 'chat_video.mp4')
            output_filename = sanitize_filename(output_filename)
            
            # Create temporary output file
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
                temp_output = f.name
            
            try:
                # Render video
                print(f"Starting render job - Preset: {preset}, Output: {output_filename}")
                renderer = ChatRenderer(
                    conversation=conversation,
                    output_path=temp_output,
                    preset=preset
                )
                
                result_path = await renderer.render()
                
                # Upload to Appwrite Storage
                print("Uploading video to Appwrite Storage...")
                with open(result_path, 'rb') as video_file:
                    upload_result = self.storage.create_file(
                        bucket_id=self.storage_bucket_id,
                        file_id='unique()',  # Let Appwrite generate ID
                        file=video_file,
                        name=output_filename
                    )
                
                # Get public URL
                file_id = upload_result['$id']
                public_url = f"{self.client._endpoint}/storage/buckets/{self.storage_bucket_id}/files/{file_id}/view"
                
                # Clean up temp file
                os.unlink(result_path)
                
                return {
                    'success': True,
                    'file_id': file_id,
                    'public_url': public_url,
                    'filename': output_filename,
                    'file_size': upload_result.get('sizeOriginal', 0),
                    'completed_at': datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                # Clean up temp file on error
                if os.path.exists(temp_output):
                    os.unlink(temp_output)
                raise e
                
        except Exception as e:
            print(f"Job processing failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
    
    async def submit_job(self, conversation: Dict[str, Any], 
                        preset: str = 'standard',
                        output_filename: str = None) -> str:
        """Submit a job for processing."""
        job_data = {
            'conversation': conversation,
            'preset': preset,
            'output_filename': output_filename or f"chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        }
        
        # For direct processing (synchronous)
        result = await self.process_job(job_data)
        
        if result['success']:
            return result['public_url']
        else:
            raise RuntimeError(f"Job failed: {result['error']}")
    
    def get_file_url(self, file_id: str) -> str:
        """Get public URL for a file."""
        return f"{self.client._endpoint}/storage/buckets/{self.storage_bucket_id}/files/{file_id}/view"
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a file from storage."""
        try:
            self.storage.delete_file(self.storage_bucket_id, file_id)
            return True
        except AppwriteException as e:
            print(f"Failed to delete file {file_id}: {e}")
            return False

# HTTP handler for Appwrite Functions
async def handler(request):
    """Appwrite Function handler."""
    try:
        # Parse request data
        if hasattr(request, 'json'):
            job_data = request.json()
        else:
            job_data = json.loads(request.body)
        
        # Initialize renderer
        renderer = AppwriteRenderer()
        
        # Process job
        result = await renderer.process_job(job_data)
        
        # Return response
        return {
            'statusCode': 200 if result['success'] else 500,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }

# CLI interface
async def main():
    """CLI interface for testing."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Appwrite Chat Renderer')
    parser.add_argument('--conversation', required=True, help='Path to conversation JSON file')
    parser.add_argument('--preset', default='standard', help='Video quality preset')
    parser.add_argument('--output', help='Output filename')
    parser.add_argument('--endpoint', help='Appwrite endpoint')
    parser.add_argument('--project-id', help='Appwrite project ID')
    parser.add_argument('--api-key', help='Appwrite API key')
    parser.add_argument('--bucket-id', help='Storage bucket ID')
    
    args = parser.parse_args()
    
    try:
        # Load conversation
        with open(args.conversation, 'r') as f:
            conversation = json.load(f)
        
        # Initialize renderer
        renderer = AppwriteRenderer(
            endpoint=args.endpoint,
            project_id=args.project_id,
            api_key=args.api_key,
            storage_bucket_id=args.bucket_id
        )
        
        # Submit job
        print("Submitting job to Appwrite...")
        public_url = await renderer.submit_job(
            conversation=conversation,
            preset=args.preset,
            output_filename=args.output
        )
        
        print(f"✅ Job completed successfully!")
        print(f"📹 Video URL: {public_url}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit_code = asyncio.run(main())
    exit(exit_code)

