# LiveKit Agent Manager

A full-stack dashboard for managing LiveKit voice AI agents powered by OpenAI Realtime models.

## Features

- **Agent Management**: Create, edit, start, stop, and delete voice agents
- **OpenAI Realtime Models**: Configure different models and voices per agent
- **Web Search**: Optional internet search capability for agents
- **MCP Servers**: Connect Model Context Protocol servers for external tools
- **Token Endpoint**: Secure token generation for frontend clients
- **Authentication**: JWT-based dashboard login with Basic Auth for token endpoint

## Architecture

```
├── backend/          NestJS API + Agent Process Manager
│   ├── src/
│   │   ├── auth/       Login, JWT session, Basic Auth guard
│   │   ├── agents/     Agent CRUD, start/stop, runner service
│   │   └── token/      GET /:agentName/token endpoint
│   └── agent-runners/  Auto-generated agent scripts (runtime)
└── frontend/         React SPA (Vite + Tailwind)
    └── src/
        ├── pages/      Login, Home, AgentForm
        └── components/ AgentCard, McpServerForm, Layout
```

## Prerequisites

- Node.js >= 20
- npm >= 10

## Quick Start

### 1. Clone and configure

```bash
cp .env.example backend/.env
# Edit backend/.env with your settings
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Start development servers

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Open the dashboard

Navigate to [http://localhost:5173](http://localhost:5173) and login with your configured credentials (default: admin/password).

## Agent Configuration

Each agent is configured with:

| Field | Description |
|-------|-------------|
| **Name** | Unique identifier, used in token endpoint URL |
| **LiveKit URL** | Your LiveKit Cloud or self-hosted server URL |
| **API Key/Secret** | LiveKit API credentials |
| **Model** | OpenAI Realtime model (gpt-4o-realtime-preview, etc.) |
| **Voice** | Voice selection (alloy, coral, marin, sage, etc.) |
| **Instructions** | System prompt for the agent |
| **Web Search** | Toggle internet search capability |
| **MCP Servers** | External tool servers (HTTP or Stdio transport) |

## Token Endpoint

Generate LiveKit room tokens with agent dispatch:

```
GET /:agentName/token
Authorization: Basic base64(username:password)
```

Response:
```json
{
  "serverUrl": "wss://...",
  "token": "jwt...",
  "roomName": "agent-name-1234567890",
  "identity": "user-1234567890"
}
```

## OpenAI Token URL

Configure `OPEN_AI_TOKEN_URL` in `.env` to point to your token provider. The agent fetches a fresh API key before each start. Expected response format:

```json
{
  "token": "sk-..."
}
```

## MCP Server Support

Agents support Model Context Protocol (MCP) servers via a custom adapter:

- **HTTP**: Connect to remote MCP servers (SSE or Streamable HTTP)
- **Stdio**: Launch local MCP server processes

Tools are automatically discovered and registered with the agent's LLM.

## Tech Stack

- **Backend**: NestJS, TypeORM, SQLite, Passport.js
- **Frontend**: React 18, Vite, TailwindCSS, React Router
- **Agent Runtime**: LiveKit Agents JS SDK, OpenAI Realtime API
- **MCP Client**: @modelcontextprotocol/sdk
