---
name: run
description: Run Caryo locally — start backend, frontend, and infrastructure services
user-invocable: true
---

# Run Caryo Locally

**IMPORTANT:** Do NOT execute `autotrader.sh` via the Bash tool. The script produces rich terminal output (colors, progress, service summary, test accounts) that the user needs to see in their own terminal. Instead, check prerequisites, check what's already running, and tell the user the exact commands to run.

## Step 1: Check Prerequisites

Verify the environment silently:

```bash
java -version 2>&1 | head -1
node -v
docker info > /dev/null 2>&1 && echo "Docker: running" || echo "Docker: NOT running"
```

Report any issues:
- **Wrong Java:** tell the user to run `sdk use java 21.0.8-zulu`
- **Docker not running:** tell the user to start Docker Desktop
- **Node missing:** tell the user to install Node.js

## Step 2: Check What's Already Running

```bash
# Check backend containers
cd backend/autotrader-backend && ./autotrader.sh dev status 2>&1

# Check if frontend dev server is running
lsof -i :3000 -sTCP:LISTEN 2>/dev/null | head -5
```

## Step 3: Tell the User What to Run

Based on what's already running, give the user only the commands they need:

### If nothing is running — give both commands:

**Terminal 1 (Backend + Infrastructure):**
```
cd backend/autotrader-backend
./autotrader.sh dev start
```

**Terminal 2 (Frontend — run after backend is ready):**
```
cd frontend
npm install --legacy-peer-deps   # first time only
npm run dev
```

### If backend is running but frontend is not:

**Tell the user to run in a terminal:**
```
cd frontend
npm install --legacy-peer-deps   # first time only
npm run dev
```

### If everything is already running:

Tell the user both backend and frontend are already up, with the URLs:
- Backend API: http://localhost:8080
- Frontend: http://localhost:3000

### Useful Variants
- `./autotrader.sh dev start --rebuild` — clean rebuild with tests
- `./autotrader.sh dev start --rebuild --skip-tests` — clean rebuild, skip tests
- `./autotrader.sh dev stop` — stop everything
- `./autotrader.sh dev status` — check what's running
- `./autotrader.sh dev health` — health check
- `./autotrader.sh dev logs` — view logs

## What autotrader.sh Does

The script handles everything in order:
1. Builds the backend Docker image
2. Starts PostgreSQL, MinIO, Redis, Mailpit, Adminer
3. Creates MinIO buckets and uploads sample car images
4. Starts the Spring Boot backend
5. Waits for all services to be healthy
6. Prints a summary with URLs, ports, and test account credentials
