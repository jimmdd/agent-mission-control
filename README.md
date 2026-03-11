# Autensa

AI Agent Orchestration Dashboard. Create tasks. Triage with AI. Dispatch to agents. Watch them work.

[![GitHub Stars](https://img.shields.io/github/stars/jimmdd/agent-mission-control?style=flat-square)](https://github.com/jimmdd/agent-mission-control/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/jimmdd/agent-mission-control?style=flat-square)](https://github.com/jimmdd/agent-mission-control/issues)
[![License](https://img.shields.io/github/license/jimmdd/agent-mission-control?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

---

## Features

Task Management: Kanban board with drag-and-drop across 8 status columns.

Triage Workflow: Automated task triage system that replaces manual planning.

Linear Integration: Bi-directional sync with Linear issues, including auto-triage from developer replies.

Hive Claw Bridge: Dedicated bridge system for processing inbox tasks and spawning AI agents.

Context-Aware Triage: AI-generated clarifying questions posted directly to Linear issues.

Auto-Answer Triage: Automatic processing of Linear replies via Gemini to satisfy triage requirements.

Real-time Events: Server-Sent Events (SSE) for live updates on agent activity and task status.

OpenClaw Gateway Integration: Seamless connection to OpenClaw Gateway for agent orchestration.

SQLite Database: Lightweight, self-contained data storage.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       YOUR MACHINE                           │
│                                                              │
│  ┌─────────────────┐          ┌──────────────────────────┐  │
│  │     Autensa     │◄────────►│    OpenClaw Gateway      │  │
│  │   (Next.js)      │   WS     │  (AI Agent Runtime)      │  │
│  │   Port 4000      │          │  Port 18789              │  │
│  └────────┬─────────┘          └───────────┬──────────────┘  │
│           │                                │                  │
│           ▼                                ▼                  │
│  ┌─────────────────┐          ┌──────────────────────────┐  │
│  │     SQLite       │          │     AI Provider          │  │
│  │    Database      │          │  (Anthropic / OpenAI)    │  │
│  └─────────────────┘          └──────────────────────────┘  │
│           ▲                                                   │
│           │                                                   │
│  ┌────────┴─────────┐          ┌──────────────────────────┐  │
│  │ Hive Claw Bridge │◄────────►│      Linear API          │  │
│  │ (Python Script)  │  Polling │   (Issue Tracking)       │  │
│  └──────────────────┘  (5 min) └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Autensa: The dashboard for task management and orchestration.
OpenClaw Gateway: The AI runtime that executes tasks.
Hive Claw Bridge: Syncs with Linear and handles automated triage.
Linear: External issue tracker for developer communication.

---

## Quick Start

### Prerequisites

- Node.js v18+
- OpenClaw Gateway (npm install -g openclaw)
- AI API Keys (Anthropic, Google Gemini)
- Linear API Key (for sync features)

### Install

```bash
# Clone
git clone https://github.com/jimmdd/agent-mission-control.git
cd agent-mission-control

# Install dependencies
npm install

# Configure
cp .env.example .env.local
```

Edit .env.local with your OpenClaw and API credentials.

### Run

```bash
# Start OpenClaw (separate terminal)
openclaw gateway start

# Start Autensa
npm run dev
```

Open http://localhost:4000 to access the dashboard.

---

## Docker

You can run Autensa in a container using the included Dockerfile and docker-compose.yml.

### 1. Configure environment

Create a .env file for Compose:

```bash
cp .env.example .env
```

Set OPENCLAW_GATEWAY_URL to ws://host.docker.internal:18789 if running OpenClaw on the host.

### 2. Build and start

```bash
docker compose up -d --build
```

### 3. Useful commands

```bash
# View logs
docker compose logs -f mission-control

# Stop containers
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## How It Works

### Task Flow

INBOX → TRIAGE → PLANNING → ASSIGNED → IN_PROGRESS → TESTING → REVIEW → DONE

1. Inbox: New tasks arrive from Linear or manual entry.
2. Triage: The bridge posts clarifying questions to Linear.
3. Planning: Awaiting developer replies on Linear.
4. Assigned: Once triage is complete, a specialized agent is created.
5. Execution: The agent performs the work via OpenClaw Gateway.
6. Delivery: Completed work is reviewed and moved to Done.

---

## Configuration

| Variable | Required | Default | Description |
|:---------|:--------:|:--------|:------------|
| OPENCLAW_GATEWAY_URL | ✅ | ws://127.0.0.1:18789 | WebSocket URL to OpenClaw Gateway |
| OPENCLAW_GATEWAY_TOKEN | ✅ | — | Authentication token for OpenClaw |
| MC_API_TOKEN | — | — | API auth token for production |
| WEBHOOK_SECRET | — | — | HMAC secret for webhook validation |
| DATABASE_PATH | — | ./mission-control.db | SQLite database location |

---

## Project Structure

```
agent-mission-control/
├── src/
│   ├── app/                    # Next.js pages & API routes
│   │   ├── api/
│   │   │   ├── sync/           # Linear synchronization API
│   │   │   ├── tasks/          # Task CRUD and triage state
│   │   │   ├── agents/         # Agent management
│   │   │   └── webhooks/       # Agent completion webhooks
│   ├── components/             # React components
│   │   ├── MissionQueue.tsx    # Kanban board
│   │   ├── TriageChecklist.tsx # Triage status interface
│   │   ├── AgentsSidebar.tsx   # Agent panel
│   │   └── LiveFeed.tsx        # Real-time events
│   └── lib/
│       ├── db/                 # SQLite + migrations
│       └── openclaw/           # Gateway client
├── scripts/                    # Bridge and utility scripts
└── .env.example                # Environment template
```

---

## Troubleshooting

### Can't connect to OpenClaw Gateway
1. Check if OpenClaw is running: openclaw gateway status
2. Verify URL and token in .env.local
3. Ensure port 18789 is not blocked by a firewall.

### Port 4000 already in use
```bash
lsof -i :4000
kill -9 <PID>
```

---

## License

MIT License. See LICENSE for details.
