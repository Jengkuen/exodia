# Exodia - Agentic Workforce System

An experimental system designed to test emergent behavior in AI agent coordination through minimal foundational infrastructure.

## Overview

Exodia creates a "workforce" of AI agents that can autonomously coordinate work through explicit task delegation, shared knowledge creation, and self-organized collaboration patterns.

**Current Configuration**: Business Strategy & Marketing Team
- Specialized agents work together to transform business context into actionable marketing strategies
- Automated workflow: Strategy → ICP Research → Marketing Plan

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

This creates 4 specialized agents:
- **Chief of Staff (COS)**: Task routing and coordination
- **Chief Strategy Officer (CSO)**: Business strategy and planning
- **ICP Analyst**: Ideal customer profile research and analysis
- **Chief Marketing Officer (CMO)**: Marketing strategy and campaign planning

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
4. **View Documents**: Click "Documents" to browse strategies and plans created by agents

### Agent Workflow

The agents work together in a coordinated workflow:

1. **User → CSO**: Provide business context to Chief Strategy Officer
2. **CSO → ICP Analyst**: CSO creates strategy and assigns ICP research
3. **ICP Analyst → CMO**: Analyst delivers customer profiles for marketing planning
4. **CMO**: Creates tailored marketing strategy based on ICPs and business strategy

### Creating Your First Strategy Task

1. Go to "Create Task"
2. Select "Chief Strategy Officer" as the agent
3. Provide business context
4. Submit and watch the agents collaborate!

Example task:
```
Title: Develop go-to-market strategy for AI-powered productivity app

Description:
## Context
We're launching a new AI-powered productivity application that helps remote teams
coordinate work using autonomous AI agents. We have a small team and limited marketing
budget ($10K/month). Launch target is in 3 months.

## Product Details
- SaaS application, $29/user/month
- Integrates with Slack, Teams, and email
- Uses AI to automatically route tasks, track progress, and generate reports
- Key differentiator: Autonomous coordination vs manual project management

## Objective
Develop a comprehensive business strategy including target customer identification
and go-to-market approach

## Expected Output
1. Strategic plan document
2. Ideal customer profiles (ICPs)
3. Marketing strategy tailored to identified ICPs
```

The CSO will:
- Analyze your business context
- Create a strategic plan
- Assign ICP research to the ICP Analyst
- Coordinate with CMO for marketing strategy

All outputs will be available as documents that you can review in the Documents tab.

## How It Works

### Technical Flow

1. User creates a task assigned to an agent (e.g., CSO)
2. Convex triggers the agent's `processTask` action
3. Agent calls Gemini LLM with context (task description, available agents, existing documents)
4. LLM analyzes the task and returns JSON array of actions:
   - `writeDocument`: Create strategy/research/plan documents
   - `assignTask`: Delegate work to other agents
   - `completeTask`: Mark task as done
5. Actions are executed, potentially creating new tasks for other agents
6. Process cascades through the agent workforce

### Business Strategy Workflow Example

**Step 1: User → CSO**
```
User creates task: "Develop strategy for SaaS product"
CSO receives task → Analyzes business context
```

**Step 2: CSO Actions**
```
CSO creates document: "Business Strategy Plan"
CSO assigns task to ICP Analyst: "Research target customer profiles"
CSO completes its task
```

**Step 3: ICP Analyst → CMO**
```
ICP Analyst receives task → Reviews strategy document
ICP Analyst creates document: "Ideal Customer Profiles"
ICP Analyst assigns task to CMO: "Develop marketing strategy"
ICP Analyst completes its task
```

**Step 4: CMO Completes Workflow**
```
CMO receives task → Reviews strategy + ICP documents
CMO creates document: "Marketing Strategy & Campaign Plan"
CMO completes its task
```

**Result**: Three comprehensive documents created through autonomous agent collaboration

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
- Bootstrap script with business strategy agents

### ✅ Phase 2: Frontend UI (Complete)
- React + TypeScript frontend
- Task creation form
- Task monitoring dashboard
- Document viewer
- Agent list display
- Responsive design

### ✅ Current Configuration: Business Strategy & Marketing Team
- **4 Specialized Agents**:
  - Chief of Staff (COS) - Coordination & routing
  - Chief Strategy Officer (CSO) - Business strategy
  - ICP Analyst - Customer research & profiling
  - Chief Marketing Officer (CMO) - Marketing strategy
- **Automated Workflow**: Strategy → ICP Research → Marketing Plan
- **Document-Based Collaboration**: Agents share knowledge through documents

### 🔄 Phase 3: Potential Enhancements
- [ ] Add real-time updates with Convex subscriptions
- [ ] Implement agent activity timeline visualization
- [ ] Add task filtering and search
- [ ] Create metrics dashboard (time per task, documents created, etc.)
- [ ] Add document editing capabilities
- [ ] Implement task dependencies visualization
- [ ] Add more specialized agents (Sales, Product, Engineering, etc.)
- [ ] Create agent templates for different business domains

## License

ISC
