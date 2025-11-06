# Exodia - Agentic Workforce System

An experimental system designed to test emergent behavior in AI agent coordination through minimal foundational infrastructure.

## Overview

Exodia creates a "workforce" of AI agents that can autonomously coordinate work through explicit task delegation, shared knowledge creation, and self-organized collaboration patterns.

## Core Principles

1. **Message-Passing Architecture**: Every task is a directed message to a specific agent
2. **Minimal Structure**: Generic schemas allow maximum flexibility
3. **Explicit Routing**: Agents explicitly choose recipients when delegating work
4. **Shared Knowledge**: All agents read/write to a common document store
5. **Failsafe Orchestration**: Chief of Staff handles routing and edge cases

## Tech Stack

- **Backend**: Convex (serverless database + functions)
- **LLM**: Google Gemini API (free tier)
- **Language**: TypeScript

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
```

This will:
- Create a new Convex project
- Generate the `CONVEX_DEPLOYMENT` URL
- Start the development server

### 3. Configure Environment Variables

Update `.env.local` with:

```env
CONVEX_DEPLOYMENT=<your-convex-deployment-url>
GEMINI_API_KEY=<your-gemini-api-key>
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 4. Bootstrap the Agent System

In the Convex dashboard or via the CLI, run the bootstrap mutation:

```bash
npx convex run setup:bootstrap
```

This creates 5 initial agents:
- Chief of Staff (task router)
- Research Analyst
- Content Writer
- Technical Writer
- Project Manager

## Project Structure

```
convex/
├── schema.ts          # Database schema
├── agents.ts          # Agent CRUD + processing logic
├── tasks.ts           # Task management
├── documents.ts       # Document management
├── llm.ts             # Gemini API integration
└── setup.ts           # Bootstrap script
```

## Usage

### Creating a Task

Use the Convex dashboard to call the `tasks:create` mutation:

```json
{
  "assignedTo": "<agent-id>",
  "createdBy": "user",
  "title": "Write a blog post about AI agents",
  "description": "Create an engaging blog post explaining how AI agents work..."
}
```

### Monitoring Tasks

Query `tasks:listRecent` to see all tasks and their statuses.

### Viewing Documents

Query `documents:list` to see all documents created by agents.

## How It Works

1. User creates a task assigned to an agent
2. Convex triggers the agent's `processTask` action
3. Agent calls Gemini LLM with context (task, available agents, documents)
4. LLM returns JSON array of actions (assignTask, writeDocument, completeTask, etc.)
5. Actions are executed, potentially creating new tasks for other agents
6. Process cascades through the agent workforce

## Next Steps (Phase 2+)

- [ ] Build React frontend UI
- [ ] Add task monitoring dashboard
- [ ] Create document viewer
- [ ] Add agent activity visualization
- [ ] Implement testing and observation tools

## License

ISC
