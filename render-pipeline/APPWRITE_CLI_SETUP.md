# Appwrite CLI Setup Guide - Production Ready

This guide provides **exact, copy-paste ready** terminal commands to set up Appwrite for storing video metadata and files.

## Prerequisites

- Appwrite Cloud account: https://cloud.appwrite.io
- OR Self-hosted Appwrite instance
- Node.js installed (for Appwrite CLI)

---

## Step 1: Install Appwrite CLI

```bash
# Install via npm
npm install -g appwrite-cli

# Or via yarn
yarn global add appwrite-cli

# Verify installation
appwrite --version
```

---

## Step 2: Authenticate with Appwrite

```bash
# Login to Appwrite Cloud
appwrite login

# You'll be prompted for:
# - Email: your-email@example.com
# - Password: your-password

# Or login with API key directly
appwrite client --endpoint https://cloud.appwrite.io/v1 --key standard_142047ba905e3c5c3c44cbd505859907922b108892548498e89e66afa30a3418fece9807f931e5c652407e97204a2b6b8dba98335556930544ae36fbf95c9e04ff4278f9d109624e2f58a8e1a696660acb9f81ba2235d3adbfef5a3f3de3f78f312a56229aadfc64d762e22d8f74a39e51ecbd3f1a5a4487f23c274104decf14

# For self-hosted Appwrite
appwrite client --endpoint https://your-domain.com/v1
```

---

## Step 3: List and Select Project

```bash
# List all your projects
appwrite projects list

# Output example:
# ID                    | Name              | Team
# 507f1f77bcf86cd799439011 | Chat Renderer     | Personal

# Set the project you want to use
appwrite client --project-id 507f1f77bcf86cd799439011

# Or set as environment variable (recommended for scripts)
export APPWRITE_PROJECT_ID="507f1f77bcf86cd799439011"
export APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
export APPWRITE_API_KEY="standard_142047ba905e3c5c3c44cbd505859907922b108892548498e89e66afa30a3418fece9807f931e5c652407e97204a2b6b8dba98335556930544ae36fbf95c9e04ff4278f9d109624e2f58a8e1a696660acb9f81ba2235d3adbfef5a3f3de3f78f312a56229aadfc64d762e22d8f74a39e51ecbd3f1a5a4487f23c274104decf14"
```

---

## Step 4: Create API Key for Server-Side Access

```bash
# Create a new API key with required permissions
appwrite projects create-key \
  --project-id "$APPWRITE_PROJECT_ID" \
  --name "Video Renderer API Key" \
  --scopes 'databases.read' 'databases.write' 'collections.read' 'collections.write' 'documents.read' 'documents.write' 'files.read' 'files.write' 'buckets.read'

# Save the returned API key securely!
# Output example:
# {
#   "$id": "key_abc123xyz",
#   "name": "Video Renderer API Key",
#   "secret": "your-secret-api-key-save-this"
# }
```

**⚠️ Important:** Save the `secret` value - you won't be able to see it again!

---

## Step 5: Create Database

```bash
# Create a new database for video metadata
appwrite databases create \
  --database-id "videos_db" \
  --name "Video Renders Database"

# Output:
# ✓ Database created successfully
# ID: videos_db
# Name: Video Renders Database

# Or let Appwrite generate ID
appwrite databases create \
  --database-id "unique()" \
  --name "Video Renders Database"
```

---

## Step 6: Create Collection for Video Metadata

```bash
# Create collection to store video job metadata
appwrite databases create-collection \
  --database-id "videos_db" \
  --collection-id "video_jobs" \
  --name "Video Jobs" \
  --permissions 'read("any")' 'create("users")' 'update("users")' 'delete("users")' \
  --document-security true

# Output:
# ✓ Collection created successfully
# ID: video_jobs
# Name: Video Jobs
```

---

## Step 7: Add Attributes to Collection

```bash
# Set the database and collection for subsequent commands
export DB_ID="videos_db"
export COLLECTION_ID="video_jobs"

# Add job_id attribute (unique identifier)
appwrite databases create-string-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "job_id" \
  --size 255 \
  --required true

# Add conversation_data attribute (JSON of the input)
appwrite databases create-string-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "conversation_data" \
  --size 10000 \
  --required false

# Add status attribute (pending, rendering, completed, failed)
appwrite databases create-enum-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "status" \
  --elements 'pending' 'rendering' 'completed' 'failed' \
  --required true \
  --default "pending"

# Add video_url attribute (Appwrite Storage URL)
appwrite databases create-string-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "video_url" \
  --size 500 \
  --required false

# Add file_id attribute (Appwrite file ID)
appwrite databases create-string-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "file_id" \
  --size 255 \
  --required false

# Add duration attribute (video duration in seconds)
appwrite databases create-float-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "duration" \
  --required false

# Add render_time attribute (how long render took in seconds)
appwrite databases create-float-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "render_time" \
  --required false

# Add error_message attribute (for failed jobs)
appwrite databases create-string-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "error_message" \
  --size 1000 \
  --required false

# Add user_id attribute (who requested the render)
appwrite databases create-string-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "user_id" \
  --size 255 \
  --required false

# Add created_at timestamp
appwrite databases create-datetime-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "created_at" \
  --required true

# Add updated_at timestamp
appwrite databases create-datetime-attribute \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "updated_at" \
  --required true
```

---

## Step 8: Create Indexes for Fast Queries

```bash
# Index on status for filtering by job status
appwrite databases create-index \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "idx_status" \
  --type "key" \
  --attributes "status"

# Index on user_id for filtering by user
appwrite databases create-index \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "idx_user_id" \
  --type "key" \
  --attributes "user_id"

# Index on created_at for sorting by date
appwrite databases create-index \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "idx_created_at" \
  --type "key" \
  --attributes "created_at" \
  --orders "DESC"

# Compound index for user + status queries
appwrite databases create-index \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "idx_user_status" \
  --type "key" \
  --attributes "user_id" "status"

# Index on job_id for direct lookups
appwrite databases create-index \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --key "idx_job_id" \
  --type "unique" \
  --attributes "job_id"
```

---

## Step 9: Create Storage Bucket for Videos

```bash
# Create bucket for rendered video files
appwrite storage create-bucket \
  --bucket-id "rendered_videos" \
  --name "Rendered Videos" \
  --permissions 'read("any")' 'create("users")' 'update("users")' 'delete("users")' \
  --file-security true \
  --enabled true \
  --maximum-file-size 104857600 \
  --allowed-file-extensions 'mp4' 'mov' 'avi' \
  --compression "gzip" \
  --encryption true \
  --antivirus true

# Output:
# ✓ Bucket created successfully
# ID: rendered_videos
# Name: Rendered Videos
# Max size: 100 MB
```

---

## Step 10: Set Bucket Permissions (Production Security)

```bash
# For production, restrict bucket access
appwrite storage update-bucket \
  --bucket-id "rendered_videos" \
  --permissions 'read("users")' 'create("users")' 'delete("users")'

# For public access (use with caution)
appwrite storage update-bucket \
  --bucket-id "rendered_videos" \
  --permissions 'read("any")'
```

---

## Step 11: Verify Setup

```bash
# List all databases
appwrite databases list

# List collections in database
appwrite databases list-collections --database-id "$DB_ID"

# List attributes in collection
appwrite databases list-attributes \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID"

# List indexes
appwrite databases list-indexes \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID"

# List storage buckets
appwrite storage list-buckets
```

---

## Step 12: Test Database Operations

### Create a Test Document

```bash
# Create a test video job record
appwrite databases create-document \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --document-id "unique()" \
  --data '{
    "job_id": "test_job_001",
    "status": "pending",
    "conversation_data": "{\"messages\":[{\"sender\":\"you\",\"text\":\"Test\"}]}",
    "user_id": "test_user",
    "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "updated_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }' \
  --permissions 'read("any")'

# Output: Document created with ID
```

### Query Documents

```bash
# Get all jobs
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID"

# Get jobs by status
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'equal("status", "completed")'

# Get jobs by user
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'equal("user_id", "test_user")'

# Get recent jobs (sorted by created_at)
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'orderDesc("created_at")' 'limit(10)'
```

### Update a Document

```bash
# Update job status to completed
appwrite databases update-document \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --document-id "DOCUMENT_ID_HERE" \
  --data '{
    "status": "completed",
    "video_url": "https://cloud.appwrite.io/v1/storage/buckets/rendered_videos/files/file123/view",
    "file_id": "file123",
    "duration": 15.5,
    "render_time": 45.2,
    "updated_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'
```

### Delete a Document

```bash
# Delete test document
appwrite databases delete-document \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --document-id "DOCUMENT_ID_HERE"
```

---

## Step 13: Environment Variables for Production

Create a `.env` file with your Appwrite credentials:

```bash
# Create .env file
cat > .env << 'EOF'
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=507f1f77bcf86cd799439011
APPWRITE_API_KEY=your-secret-api-key-from-step-4
APPWRITE_DATABASE_ID=videos_db
APPWRITE_COLLECTION_ID=video_jobs
APPWRITE_BUCKET_ID=rendered_videos
EOF

# Secure the file
chmod 600 .env

# Load environment variables
source .env  # Linux/Mac
# Or: set -a; source .env; set +a
```

---

## Python Integration Example

### Install Appwrite SDK

```bash
pip install appwrite
```

### Complete Python Script

```python
import os
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.id import ID
from datetime import datetime

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

databases = Databases(client)
storage = Storage(client)

# Create a video job record
def create_video_job(job_id, user_id, conversation_data):
    return databases.create_document(
        database_id=os.getenv('APPWRITE_DATABASE_ID'),
        collection_id=os.getenv('APPWRITE_COLLECTION_ID'),
        document_id=ID.unique(),
        data={
            'job_id': job_id,
            'status': 'pending',
            'user_id': user_id,
            'conversation_data': conversation_data,
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'updated_at': datetime.utcnow().isoformat() + 'Z'
        }
    )

# Update job status
def update_job_status(document_id, status, video_url=None, file_id=None, 
                     duration=None, render_time=None, error_message=None):
    data = {
        'status': status,
        'updated_at': datetime.utcnow().isoformat() + 'Z'
    }
    if video_url:
        data['video_url'] = video_url
    if file_id:
        data['file_id'] = file_id
    if duration:
        data['duration'] = duration
    if render_time:
        data['render_time'] = render_time
    if error_message:
        data['error_message'] = error_message
    
    return databases.update_document(
        database_id=os.getenv('APPWRITE_DATABASE_ID'),
        collection_id=os.getenv('APPWRITE_COLLECTION_ID'),
        document_id=document_id,
        data=data
    )

# Upload video to storage
def upload_video(file_path):
    bucket_id = os.getenv('APPWRITE_BUCKET_ID')
    with open(file_path, 'rb') as file:
        result = storage.create_file(
            bucket_id=bucket_id,
            file_id=ID.unique(),
            file=file
        )
    
    file_id = result['$id']
    project_id = os.getenv('APPWRITE_PROJECT_ID')
    endpoint = os.getenv('APPWRITE_ENDPOINT')
    video_url = f"{endpoint}/storage/buckets/{bucket_id}/files/{file_id}/view?project={project_id}"
    
    return {
        'file_id': file_id,
        'url': video_url
    }

# Get all jobs for a user
def get_user_jobs(user_id, status=None):
    from appwrite.query import Query
    
    queries = [Query.equal('user_id', user_id)]
    if status:
        queries.append(Query.equal('status', status))
    queries.append(Query.order_desc('created_at'))
    
    return databases.list_documents(
        database_id=os.getenv('APPWRITE_DATABASE_ID'),
        collection_id=os.getenv('APPWRITE_COLLECTION_ID'),
        queries=queries
    )

# Example usage
if __name__ == '__main__':
    # Create a new job
    job = create_video_job(
        job_id='job_' + ID.unique(),
        user_id='user_123',
        conversation_data='{"messages":[...]}'
    )
    print(f"Created job: {job['$id']}")
    
    # Simulate uploading video
    # upload_result = upload_video('/path/to/video.mp4')
    
    # Update job to completed
    # update_job_status(
    #     document_id=job['$id'],
    #     status='completed',
    #     video_url=upload_result['url'],
    #     file_id=upload_result['file_id'],
    #     duration=15.5,
    #     render_time=45.2
    # )
```

---

## Advanced: Webhooks for Real-Time Updates

```bash
# Create webhook for document events
appwrite projects create-webhook \
  --project-id "$APPWRITE_PROJECT_ID" \
  --name "Video Job Updates" \
  --events 'databases.*.collections.video_jobs.documents.*.create' \
           'databases.*.collections.video_jobs.documents.*.update' \
  --url "https://your-domain.com/api/webhooks/appwrite" \
  --security true \
  --httpUser "webhook_user" \
  --httpPass "secure_password_here"
```

---

## Monitoring and Analytics Queries

```bash
# Count total jobs
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'limit(1)' | jq '.total'

# Count completed jobs
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'equal("status", "completed")' 'limit(1)' | jq '.total'

# Count failed jobs
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'equal("status", "failed")' 'limit(1)' | jq '.total'

# Get average render time (requires custom function)
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'equal("status", "completed")' 'limit(100)'
```

---

## Backup and Restore

```bash
# Export all documents to JSON
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'limit(5000)' > backup_$(date +%Y%m%d).json

# Download all videos from bucket
mkdir -p video_backups
appwrite storage list-files --bucket-id "rendered_videos" | \
  jq -r '.files[].$id' | \
  xargs -I {} appwrite storage get-file-download \
    --bucket-id "rendered_videos" \
    --file-id {} \
    --destination "video_backups/{}.mp4"
```

---

## Cleanup Commands

```bash
# Delete old completed jobs (older than 30 days)
# Note: Requires custom script for date filtering

# Delete all test documents
appwrite databases list-documents \
  --database-id "$DB_ID" \
  --collection-id "$COLLECTION_ID" \
  --queries 'equal("user_id", "test_user")' | \
  jq -r '.documents[].$id' | \
  xargs -I {} appwrite databases delete-document \
    --database-id "$DB_ID" \
    --collection-id "$COLLECTION_ID" \
    --document-id {}

# Delete entire collection (careful!)
# appwrite databases delete-collection \
#   --database-id "$DB_ID" \
#   --collection-id "$COLLECTION_ID"
```

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all credentials
3. **Rotate API keys** regularly (every 90 days)
4. **Limit API key scopes** to minimum required permissions
5. **Enable antivirus scanning** on storage buckets
6. **Use HTTPS only** for all endpoints
7. **Implement rate limiting** in your application
8. **Monitor API usage** via Appwrite dashboard

---

## Troubleshooting

### Authentication Failed

```bash
# Clear cached credentials
rm -rf ~/.appwrite

# Re-login
appwrite login
```

### Permission Denied

```bash
# Check API key permissions
appwrite projects list-keys --project-id "$APPWRITE_PROJECT_ID"

# Verify bucket permissions
appwrite storage get-bucket --bucket-id "rendered_videos"
```

### Quota Exceeded

```bash
# Check project usage
appwrite projects get-usage --project-id "$APPWRITE_PROJECT_ID"

# Upgrade plan if needed
# Visit: https://cloud.appwrite.io/console/project-{id}/settings
```

---

## Quick Reference

```bash
# Essential commands
appwrite login
appwrite databases list-documents --database-id videos_db --collection-id video_jobs
appwrite storage list-files --bucket-id rendered_videos

# Create document
appwrite databases create-document \
  --database-id videos_db \
  --collection-id video_jobs \
  --document-id unique() \
  --data '{"job_id":"job_123","status":"pending",...}'

# Upload file
appwrite storage create-file \
  --bucket-id rendered_videos \
  --file-id unique() \
  --file @video.mp4
```

---

## Next Steps

1. ✅ Complete this Appwrite setup
2. ✅ Test with the Python integration script
3. ✅ Deploy renderer to Camber (see CAMBER_CLI_COMMANDS.md)
4. ✅ Set up webhooks for production monitoring
5. ✅ Implement automated backups

---

## Resources

- **Appwrite Docs**: https://appwrite.io/docs
- **CLI Reference**: https://appwrite.io/docs/command-line
- **Python SDK**: https://appwrite.io/docs/sdks#python
- **Console**: https://cloud.appwrite.io/console
