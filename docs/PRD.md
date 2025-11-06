# Product Requirements Document: Agentic Workforce System

## Overview

An experimental system designed to test emergent behavior in AI agent coordination through minimal foundational infrastructure. The core philosophy is "emergence, not engineering" - creating simple primitives that enable complex, non-deterministic workflows to develop organically.

## Vision

Build a barebones infrastructure where AI agents can autonomously coordinate work through explicit task delegation, shared knowledge creation, and self-organized collaboration patterns.

## Core Principles

1. **Message-Passing Architecture**: No task queues or marketplaces. Every task is a directed message to a specific agent.
2. **Minimal Structure**: Keep schemas and interfaces generic to allow maximum flexibility.
3. **Explicit Routing**: Agents must explicitly choose recipients when delegating work.
4. **Shared Knowledge**: All agents read/write to a common document store.
5. **Failsafe Orchestration**: Chief of Staff handles routing decisions and edge cases.

## System Components

### 1. Agents

**Purpose**: Autonomous workers with specialized roles and capabilities.

**Characteristics**:
- Each agent has a defined role (e.g., "Research Analyst", "Content Writer")
- System prompt defines behavior and decision-making logic
- All agents implement the same interface for consistency
- Agents discover each other through a shared registry

**Core Behaviors**:
- Receive tasks assigned to them
- Read task descriptions and decide on actions
- Delegate work by creating new tasks for other agents
- Create and update shared documents
- Complete or fail tasks with context

### 2. Tasks

**Purpose**: Primary communication mechanism between agents.

**Characteristics**:
- Every task must have exactly one assigned recipient
- Tasks are never "claimed" - they are explicitly assigned
- Rich descriptions provide context for receiving agent
- Status tracking enables progress monitoring
- Task trees enable work breakdown (parent/child relationships)

**Lifecycle**:
1. Created with specific recipient
2. Recipient processes task
3. May spawn subtasks to other agents
4. Completed or failed with status update

### 3. Documents

**Purpose**: Shared knowledge base for persistent information.

**Characteristics**:
- Markdown-based artifacts
- Any agent can read any document
- Any agent can create or update documents
- Provides shared context across the workforce
- Audit trail through creator/updater tracking

### 4. Chief of Staff

**Purpose**: Default router and orchestration failsafe.

**Responsibilities**:
- Receives tasks when creating agent doesn't know appropriate recipient
- Routes tasks to suitable agents based on roles/capabilities
- Handles ambiguous or complex assignments
- Manages edge cases and conflicts
- Acts as system coordinator

## Data Models

### Agent Schema
```
- id: unique identifier
- role: human-readable role description
- capabilities: what this agent can do
- systemPrompt: LLM instructions for decision-making
- isActive: whether agent is available
```

### Task Schema
```
- id: unique identifier
- assignedTo: agent ID (required, single recipient)
- createdBy: agent ID or "user"
- createdAt: timestamp
- completedAt: timestamp (optional)
- status: pending | in_progress | completed | failed
- title: brief summary
- description: detailed context and instructions
- metadata: flexible key-value data (optional)
- parentTaskId: for task hierarchies (optional)
- relatedDocuments: array of document IDs (optional)
```

### Document Schema
```
- id: unique identifier
- title: document name
- content: markdown text
- createdBy: agent ID
- createdAt: timestamp
- updatedAt: timestamp
- updatedBy: agent ID
```

## Agent Interface

All agent implementations must support:

**Discovery**:
- `searchAgents()`: List all active agents in the system

**Task Management**:
- `receiveTask(task)`: Process an assigned task
- `completeTask(taskId, result?)`: Mark task as completed
- `failTask(taskId, reason)`: Mark task as failed
- `assignTask(input, recipientId)`: Create task for another agent

**Knowledge Base**:
- `readDocument(docId)`: Retrieve a document
- `writeDocument(title, content)`: Create new document
- `updateDocument(docId, content)`: Modify existing document

## Task Description Convention

While agents can use free-form descriptions, a suggested structure:

```markdown
## Context
[Why this task exists, background information]

## Objective
[What needs to be accomplished]

## Input
[Data, documents, or information needed]

## Expected Output
[What the receiving agent should produce]
```

Agents may adapt or ignore this structure - emergence is expected.

## User Interface

**Task Creation Form**:
- Dropdown to select recipient agent
- Text input for task title
- Textarea for task description
- Submit button to create task

**Task Monitor View**:
- List of recent tasks
- Display: title, assigned agent, status
- Visual distinction by status (pending/in-progress/completed/failed)
- Ability to see task details and description

**No Conversational Interface**: Direct database manipulation only for this experiment.

## Success Criteria

The experiment is successful if:

1. **Agents delegate work appropriately**: Research agents assign writing to writers, writers request research from researchers, etc.
2. **Emergent workflows develop**: Multi-step processes form without explicit programming
3. **Knowledge accumulates**: Documents created by agents are referenced by other agents
4. **Chief of Staff routes effectively**: Unknown tasks get distributed to appropriate agents
5. **System remains stable**: No infinite loops, runaway costs, or deadlocks

## Out of Scope (For Initial Experiment)

- User authentication/authorization
- Complex task prioritization
- Agent learning or memory beyond task/document history
- Document version control or merge conflict resolution
- Real-time collaborative editing
- Agent performance metrics or analytics
- Cost optimization or rate limiting
- Production-grade error handling
- Multi-tenancy

## Key Questions to Explore

1. What delegation patterns emerge naturally?
2. How do agents decide when to create documents vs. tasks?
3. Does the Chief of Staff become a bottleneck or effective router?
4. What failure modes arise in agent coordination?
5. How much structure in task descriptions is actually needed?

## Next Steps

1. Build minimal infrastructure
2. Create 3-5 starter agents with diverse roles
3. Seed with simple tasks
4. Observe and document emergent behaviors
5. Iterate based on observations
