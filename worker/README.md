# Worker (no Docker quickstart)

1) Create a `.env` file in the project root (same folder as package.json) with:

```
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_ACCOUNT_NAME=...
AZURE_STORAGE_ACCOUNT_KEY=...
# Optional when not using Redis from API
RENDER_QUEUE_ENABLED=false
# Optional temp dir
WORK_DIR=%TEMP%
```

2) Install deps:

```
pnpm install
```

3) Run the worker directly:

```
node worker/worker.cjs
```

Notes:
-- With `RENDER_QUEUE_ENABLED=false`, the worker will poll Appwrite every ~15s for recent `pending` jobs and process them.
- If you enable queueing, set `RENDER_QUEUE_ENABLED=true` and provide `REDIS_URL` (TLS: `rediss://...:6380`).
- Ensure the API host has the same Appwrite and Azure envs so it can insert jobs.

## Deploying the worker (production)

You need a long-running process in production to consume jobs and upload to Azure. Two simple options:

### Option A: Azure Container Apps
1. Build and push the worker image:
	```cmd
	docker build -f Dockerfile.worker -t <your-registry>/script-to-video-worker:latest .
	docker push <your-registry>/script-to-video-worker:latest
	```
2. Create an Azure Container App pointing to the image. Configure env vars (same as your API):
		- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
		- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
		- `APPWRITE_API_KEY`
		- `APPWRITE_DATABASE_ID`
		- `APPWRITE_COLLECTION_VIDEO_RENDERS_ID`
	- `AZURE_STORAGE_CONNECTION_STRING`
	- `AZURE_STORAGE_ACCOUNT_NAME`
	- `AZURE_STORAGE_ACCOUNT_KEY`
	- Optional queue: `RENDER_QUEUE_ENABLED=true`, `REDIS_URL=rediss://:<pwd>@<host>:6380`
3. Set CPU/memory (e.g., 1 vCPU / 2 GB) and min replicas ≥ 1.
4. Verify logs show "Polling fallback active" or "Queue worker started" and that jobs move to `done`.

### Option B: Render.com (or Railway/Fly.io)
1. Create a new "Background Worker" service from your GitHub repo.
2. Start command: `node worker/worker.cjs`
3. Env vars: same list as above. Leave Redis unset for polling mode, or set for queue mode.
4. Deploy and monitor logs. Scale instances if needed.

### Notes
- Polling mode (no Redis) is fine for most small/medium workloads.
- Queue mode (Redis) is recommended for higher throughput or when you need backpressure and retries. Ensure `REDIS_URL` is valid to avoid WRONGPASS errors.
- Make sure the worker Appwrite envs point to the same project as the API. Otherwise it won’t see the jobs your API inserted.
