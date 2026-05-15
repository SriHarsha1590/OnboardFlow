# ⚡ OnboardFlow — Quick Start

## One-command setup (Mac/Linux)

```bash
chmod +x setup.sh && ./setup.sh
```

---

## Manual setup (Windows / step-by-step)

### 1. Start infrastructure
```bash
docker-compose up -d
# Wait 30 seconds for Temporal to initialize
```

### 2. Install dependencies
```bash
npm install
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Run DB migrations
```bash
cd backend && node src/db/migrate.js && cd ..
```

### 4. Start services (3 separate terminals)

**Terminal 1 — API:**
```bash
cd backend
node src/index.js
```

**Terminal 2 — Temporal Worker:**
```bash
cd backend
node src/workers/onboardingWorker.js
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## Open in browser

| Service | URL |
|---|---|
| React App | http://localhost:5173 |
| REST API | http://localhost:3001 |
| API Health | http://localhost:3001/api/health |
| Temporal UI | http://localhost:8080 |

---

## Demo walkthrough (5 minutes)

1. Go to **http://localhost:5173**
2. Click **"New Employee"** in sidebar
3. Click **"Fill Demo Data"** then **"Start Temporal Workflow"**
4. Go to **Approvals** — see workflow paused at `waitForSignal()`
5. Click **"Approve & Signal"** — watch workflow advance in real-time
6. Go to **Workflows** — see step-by-step timeline
7. Open **http://localhost:8080** (Temporal UI) — see full workflow history & event log
8. Go to **Audit Logs** — immutable audit trail

---

## Tear down
```bash
docker-compose down        # stop (keeps data)
docker-compose down -v     # stop + delete all data
```
