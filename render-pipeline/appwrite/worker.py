#!/usr/bin/env python3
"""
Background worker for processing chat rendering jobs from a queue.
"""

import os
import json
import asyncio
import redis
from typing import Dict, Any, Optional
from datetime import datetime

# Add parent directory to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from appwrite.function_wrapper import AppwriteRenderer

class ChatRendererWorker:
    """Background worker for chat rendering jobs."""
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis_client = redis.from_url(self.redis_url)
        self.appwrite_renderer = AppwriteRenderer()
        self.running = False
        
        print(f"Worker initialized - Redis: {self.redis_url}")
    
    async def start(self):
        """Start the worker."""
        self.running = True
        print("🚀 Starting chat renderer worker...")
        
        while self.running:
            try:
                # Poll for jobs
                job_data = await self.poll_job()
                
                if job_data:
                    await self.process_job(job_data)
                else:
                    # No jobs available, wait a bit
                    await asyncio.sleep(1)
                    
            except Exception as e:
                print(f"❌ Worker error: {e}")
                await asyncio.sleep(5)  # Wait before retrying
    
    async def poll_job(self) -> Optional[Dict[str, Any]]:
        """Poll for a job from the queue."""
        try:
            # Use Redis BLPOP for blocking pop
            result = self.redis_client.blpop('chat_render_jobs', timeout=1)
            
            if result:
                queue_name, job_json = result
                return json.loads(job_json)
            
            return None
            
        except Exception as e:
            print(f"Error polling for jobs: {e}")
            return None
    
    async def process_job(self, job_data: Dict[str, Any]):
        """Process a single job."""
        job_id = job_data.get('id', 'unknown')
        print(f"📝 Processing job {job_id}")
        
        try:
            # Process the job
            result = await self.appwrite_renderer.process_job(job_data)
            
            if result['success']:
                print(f"✅ Job {job_id} completed successfully")
                print(f"📹 Video URL: {result['public_url']}")
                
                # Store result
                await self.store_job_result(job_id, result)
            else:
                print(f"❌ Job {job_id} failed: {result['error']}")
                await self.store_job_result(job_id, result)
                
        except Exception as e:
            print(f"❌ Job {job_id} error: {e}")
            error_result = {
                'success': False,
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
            await self.store_job_result(job_id, error_result)
    
    async def store_job_result(self, job_id: str, result: Dict[str, Any]):
        """Store job result in Redis."""
        try:
            result_key = f"job_result:{job_id}"
            self.redis_client.setex(
                result_key, 
                3600,  # Expire after 1 hour
                json.dumps(result)
            )
        except Exception as e:
            print(f"Error storing job result: {e}")
    
    def stop(self):
        """Stop the worker."""
        self.running = False
        print("🛑 Stopping worker...")

def submit_job(conversation: Dict[str, Any], 
               preset: str = 'standard',
               output_filename: str = None,
               redis_url: str = None) -> str:
    """Submit a job to the queue."""
    redis_client = redis.from_url(redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379'))
    
    job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
    
    job_data = {
        'id': job_id,
        'conversation': conversation,
        'preset': preset,
        'output_filename': output_filename or f"chat_{job_id}.mp4",
        'submitted_at': datetime.utcnow().isoformat()
    }
    
    # Add to queue
    redis_client.lpush('chat_render_jobs', json.dumps(job_data))
    
    print(f"📤 Job {job_id} submitted to queue")
    return job_id

def get_job_result(job_id: str, redis_url: str = None) -> Optional[Dict[str, Any]]:
    """Get job result from Redis."""
    redis_client = redis.from_url(redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379'))
    
    result_key = f"job_result:{job_id}"
    result_json = redis_client.get(result_key)
    
    if result_json:
        return json.loads(result_json)
    
    return None

async def main():
    """Main worker entry point."""
    worker = ChatRendererWorker()
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal")
        worker.stop()
    except Exception as e:
        print(f"❌ Worker crashed: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit_code = asyncio.run(main())
    exit(exit_code)

