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

### 2. Set Up Convex Backend

In one terminal, start the Convex development server:

```bash
npm run dev:backend
```

This will:
- Create a new Convex project
- Generate the `CONVEX_DEPLOYMENT` URL
- Start the backend server and watch for changes

### 3. Configure Environment Variables

Update `.env.local` with the values from Convex:

```env
CONVEX_DEPLOYMENT=<your-convex-deployment-url>
VITE_CONVEX_URL=<your-convex-deployment-url>  # Same as above
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

### 5. Start the Frontend

In a second terminal, start the React frontend:

```bash
npm run dev
```

The UI will be available at `http://localhost:3000`

## Project Structure

```
convex/                    # Backend (Convex functions)
├── schema.ts              # Database schema
├── agents.ts              # Agent CRUD + processing logic
├── tasks.ts               # Task management
├── documents.ts           # Document management
├── llm.ts                 # Gemini API integration
└── setup.ts               # Bootstrap script

src/                       # Frontend (React)
├── components/
│   ├── TaskCreator.tsx    # Task creation form
│   ├── TaskMonitor.tsx    # Task list and monitoring
│   ├── DocumentViewer.tsx # Document browser
│   └── AgentList.tsx      # Agent registry
├── lib/
│   └── convex.ts          # Convex client setup
├── App.tsx                # Main app component
├── App.css                # App styles
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## Usage

### Using the Web Interface

1. **View Agents**: Click "Agents" to see all active agents in your workforce
2. **Create Tasks**: Click "Create Task" to assign work to an agent
3. **Monitor Progress**: Click "Task Monitor" to see all tasks and their statuses
4. **View Documents**: Click "Documents" to browse knowledge created by agents

### Creating Your First Task

1. Go to "Create Task"
2. Select an agent (try "Chief of Staff" for complex tasks)
3. Enter a title and description
4. Submit and watch the agents work!

Example task:
```
Title: Write a blog post about AI agents
Description:
## Context
We need content for our tech blog

## Objective
Create an engaging blog post explaining how AI agents work

## Expected Output
A 500-word blog post in markdown format
```

## How It Works

1. User creates a task assigned to an agent
2. Convex triggers the agent's `processTask` action
3. Agent calls Gemini LLM with context (task, available agents, documents)
4. LLM returns JSON array of actions (assignTask, writeDocument, completeTask, etc.)
5. Actions are executed, potentially creating new tasks for other agents
6. Process cascades through the agent workforce

## Development & Validation

### Code Quality Scripts

```bash
# Run ESLint to check code style
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Run TypeScript type checking (requires convex dev running)
npm run typecheck

# Run all validation checks
npm run validate
```

### Validation Status

✅ **Phase 1 Code Validated**
- Zero ESLint errors
- TypeScript ready (requires generated types from `convex dev`)
- All functions properly typed
- See [VALIDATION.md](./VALIDATION.md) for detailed report

## Implementation Status

### ✅ Phase 1: Infrastructure (Complete)
- Database schema and Convex setup
- Agent CRUD operations
- Task management system
- Document management
- LLM integration with Gemini
- Bootstrap script with 5 agents

### ✅ Phase 2: Frontend UI (Complete)
- React + TypeScript frontend
- Task creation form
- Task monitoring dashboard
- Document viewer
- Agent list display
- Responsive design

### 🔄 Phase 3: Next Steps
- [ ] Add real-time updates with Convex subscriptions
- [ ] Implement agent activity visualization
- [ ] Add task filtering and search
- [ ] Create metrics and analytics dashboard
- [ ] Add document editing capabilities
- [ ] Implement task dependencies visualization

## License

ISC
