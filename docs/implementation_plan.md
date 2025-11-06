# Implementation Plan: Agentic Workforce System

## Technical Stack

- **Backend**: Convex (serverless database + functions)
- **LLM**: Google Gemini API (free tier)
- **Frontend**: React + TypeScript
- **Agent SDK**: Convex Agents SDK

## Architecture Overview

### Reactive Event System

```
User creates task → Convex mutation → Database insert → 
Convex trigger → Agent action spawns → LLM planning → 
Agent mutations (create tasks/docs) → Cascade to other agents
```

### Agent Execution Model

- **Stateless**: Each task processing creates fresh LLM context
- **Reactive**: Agents triggered by database changes (new tasks)
- **On-demand**: No continuously running processes
- **Context from DB**: System prompt + task history loaded per invocation

### LLM Context Strategy

Each agent invocation:
1. Load agent's system prompt from database
2. Load assigned task details
3. Query relevant context (other tasks, documents)
4. Call Gemini with fresh context
5. Parse LLM response for actions
6. Execute actions via Convex mutations
7. Complete

## Database Schema

### Convex Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    role: v.string(),
    capabilities: v.string(),
    systemPrompt: v.string(),
    isActive: v.boolean(),
  }),
  
  tasks: defineTable({
    assignedTo: v.id("agents"),
    createdBy: v.string(), // agent ID or "user" or "system"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
    parentTaskId: v.optional(v.id("tasks")),
    relatedDocuments: v.optional(v.array(v.id("documents"))),
  })
    .index("by_assignedTo", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_parent", ["parentTaskId"]),
  
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    createdBy: v.string(), // agent ID
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.string(), // agent ID
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_updatedAt", ["updatedAt"]),
});
```

## Core Functions

### Agent Management

```typescript
// convex/agents.ts

// Create a new agent
export const createAgent = mutation(async (
  ctx,
  { role, capabilities, systemPrompt }
) => {
  return await ctx.db.insert('agents', {
    role,
    capabilities,
    systemPrompt,
    isActive: true,
  });
});

// List all active agents
export const listActive = query(async (ctx) => {
  return await ctx.db
    .query('agents')
    .filter(q => q.eq(q.field('isActive'), true))
    .collect();
});

// Get specific agent
export const get = query(async (ctx, { agentId }) => {
  return await ctx.db.get(agentId);
});

// Update agent (for system prompt tuning)
export const updateAgent = mutation(async (
  ctx,
  { agentId, systemPrompt }
) => {
  await ctx.db.patch(agentId, { systemPrompt });
});
```

### Task Management

```typescript
// convex/tasks.ts

// Create and assign task
export const create = mutation(async (ctx, args) => {
  const taskId = await ctx.db.insert('tasks', {
    assignedTo: args.assignedTo,
    createdBy: args.createdBy,
    title: args.title,
    description: args.description,
    status: 'pending',
    createdAt: Date.now(),
    metadata: args.metadata,
    parentTaskId: args.parentTaskId,
    relatedDocuments: args.relatedDocuments,
  });
  
  // Trigger agent processing
  await ctx.scheduler.runAfter(0, internal.agents.processTask, {
    taskId,
  });
  
  return taskId;
});

// Update task status
export const updateStatus = mutation(async (
  ctx,
  { taskId, status, completedAt }
) => {
  await ctx.db.patch(taskId, {
    status,
    ...(completedAt && { completedAt }),
  });
});

// Get task details
export const get = query(async (ctx, { taskId }) => {
  return await ctx.db.get(taskId);
});

// List tasks for monitoring
export const listRecent = query(async (ctx, { limit = 50 }) => {
  return await ctx.db
    .query('tasks')
    .order('desc')
    .take(limit);
});

// Get tasks by agent
export const byAgent = query(async (ctx, { agentId, status }) => {
  return await ctx.db
    .query('tasks')
    .withIndex('by_assignedTo', q => q.eq('assignedTo', agentId))
    .filter(q => status ? q.eq(q.field('status'), status) : true)
    .collect();
});
```

### Document Management

```typescript
// convex/documents.ts

// Create document
export const create = mutation(async (
  ctx,
  { title, content, createdBy }
) => {
  const now = Date.now();
  return await ctx.db.insert('documents', {
    title,
    content,
    createdBy,
    createdAt: now,
    updatedAt: now,
    updatedBy: createdBy,
  });
});

// Update document
export const update = mutation(async (
  ctx,
  { docId, content, updatedBy }
) => {
  await ctx.db.patch(docId, {
    content,
    updatedAt: Date.now(),
    updatedBy,
  });
});

// Get document
export const get = query(async (ctx, { docId }) => {
  return await ctx.db.get(docId);
});

// List all documents
export const list = query(async (ctx) => {
  return await ctx.db
    .query('documents')
    .order('desc')
    .collect();
});
```

### Agent Processing (Core Logic)

```typescript
// convex/agents.ts

// Internal action triggered when task is created
export const processTask = internalAction(async (ctx, { taskId }) => {
  // Load task and agent details
  const task = await ctx.runQuery(api.tasks.get, { taskId });
  const agent = await ctx.runQuery(api.agents.get, { 
    agentId: task.assignedTo 
  });
  
  if (!agent || !agent.isActive) {
    await ctx.runMutation(api.tasks.updateStatus, {
      taskId,
      status: 'failed',
    });
    return;
  }
  
  // Mark as in progress
  await ctx.runMutation(api.tasks.updateStatus, {
    taskId,
    status: 'in_progress',
  });
  
  try {
    // Get LLM decision
    const actions = await callGemini(ctx, agent, task);
    
    // Execute each action
    for (const action of actions) {
      await executeAction(ctx, task, action);
    }
    
  } catch (error) {
    console.error(`Agent ${agent.role} failed task ${taskId}:`, error);
    await ctx.runMutation(api.tasks.updateStatus, {
      taskId,
      status: 'failed',
    });
  }
});

// Execute individual agent action
async function executeAction(ctx, task, action) {
  switch (action.action) {
    case 'assignTask':
      await ctx.runMutation(api.tasks.create, {
        assignedTo: action.recipientId,
        createdBy: task.assignedTo,
        title: action.title,
        description: action.description,
        parentTaskId: task._id,
        metadata: action.metadata,
      });
      break;
      
    case 'writeDocument':
      await ctx.runMutation(api.documents.create, {
        title: action.title,
        content: action.content,
        createdBy: task.assignedTo,
      });
      break;
      
    case 'updateDocument':
      await ctx.runMutation(api.documents.update, {
        docId: action.docId,
        content: action.content,
        updatedBy: task.assignedTo,
      });
      break;
      
    case 'completeTask':
      await ctx.runMutation(api.tasks.updateStatus, {
        taskId: task._id,
        status: 'completed',
        completedAt: Date.now(),
      });
      break;
      
    case 'failTask':
      await ctx.runMutation(api.tasks.updateStatus, {
        taskId: task._id,
        status: 'failed',
        completedAt: Date.now(),
      });
      break;
  }
}
```

### LLM Integration

```typescript
// convex/llm.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function callGemini(ctx, agent, task) {
  // Load additional context
  const allAgents = await ctx.runQuery(api.agents.listActive);
  const documents = await ctx.runQuery(api.documents.list);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
  });
  
  const prompt = `${agent.systemPrompt}

## Available Agents
${allAgents.map(a => `- ${a._id}: ${a.role} - ${a.capabilities}`).join('\n')}

## Your Assigned Task
Title: ${task.title}
Description: ${task.description}
${task.parentTaskId ? `This is a subtask of: ${task.parentTaskId}` : ''}

## Available Documents
${documents.slice(0, 10).map(d => `- ${d._id}: ${d.title}`).join('\n')}

## Instructions
Analyze this task and decide what actions to take. Respond with a JSON array of actions.

Available actions:
1. assignTask: Create a task for another agent
   {"action": "assignTask", "recipientId": "agent_id", "title": "...", "description": "..."}

2. writeDocument: Create a new document
   {"action": "writeDocument", "title": "...", "content": "..."}

3. updateDocument: Update existing document
   {"action": "updateDocument", "docId": "doc_id", "content": "..."}

4. completeTask: Mark your task as done
   {"action": "completeTask"}

5. failTask: Mark task as failed
   {"action": "failTask"}

You can perform multiple actions. Always include completeTask or failTask as your final action.

Respond ONLY with valid JSON array, no other text:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('LLM did not return valid JSON array');
  }
  
  return JSON.parse(jsonMatch[0]);
}
```

## Bootstrap Setup

```typescript
// convex/setup.ts

export const bootstrap = mutation(async (ctx) => {
  // Create Chief of Staff
  const cosId = await ctx.db.insert('agents', {
    role: "Chief of Staff",
    capabilities: "Task routing, escalation handling, coordination",
    systemPrompt: `You are the Chief of Staff for an AI agent workforce.

Your role is to:
1. Route incoming tasks to the most appropriate agent
2. Handle tasks when no clear specialist exists
3. Break complex tasks into subtasks for multiple agents
4. Coordinate work across agents

When you receive a task:
- Analyze what needs to be done
- Search available agents using their roles and capabilities
- Either assign to a specialist OR handle it yourself
- If handling yourself, break it into manageable subtasks
- Always complete tasks assigned to you

Remember: Every task you create MUST have a specific recipient (recipientId).`,
    isActive: true,
  });
  
  // Create Research Analyst
  await ctx.db.insert('agents', {
    role: "Research Analyst",
    capabilities: "Information gathering, data analysis, report creation",
    systemPrompt: `You are a Research Analyst.

Your capabilities:
- Gather information on topics
- Analyze data and trends
- Create comprehensive research reports
- Summarize findings clearly

When you receive a research task:
1. Create a document with your research findings
2. If the research needs writing/formatting, assign to Content Writer
3. Complete your task when research is documented

Always write your research to a document so others can access it.`,
    isActive: true,
  });
  
  // Create Content Writer
  await ctx.db.insert('agents', {
    role: "Content Writer",
    capabilities: "Article writing, documentation, editing, content creation",
    systemPrompt: `You are a Content Writer.

Your capabilities:
- Write articles and blog posts
- Create documentation
- Edit and refine content
- Transform research into readable content

When you receive a writing task:
1. Check if research is needed - assign to Research Analyst if so
2. Read any related documents for context
3. Write your content to a new document
4. Complete your task when content is written

Always create documents with clear, engaging writing.`,
    isActive: true,
  });
  
  // Create Technical Writer
  await ctx.db.insert('agents', {
    role: "Technical Writer",
    capabilities: "Technical documentation, API docs, code documentation",
    systemPrompt: `You are a Technical Writer.

Your capabilities:
- Write technical documentation
- Document APIs and code
- Create how-to guides
- Explain complex technical concepts clearly

When you receive a technical writing task:
1. Review any technical context in the description
2. Create clear, structured documentation
3. Use code examples where appropriate
4. Complete task when documentation is written`,
    isActive: true,
  });
  
  // Create Project Manager
  await ctx.db.insert('agents', {
    role: "Project Manager",
    capabilities: "Project planning, task breakdown, coordination",
    systemPrompt: `You are a Project Manager.

Your capabilities:
- Break down complex projects into tasks
- Coordinate work across multiple agents
- Track progress and dependencies
- Plan project execution

When you receive a project task:
1. Break it into discrete subtasks
2. Assign each subtask to appropriate specialists
3. Create a project document outlining the plan
4. Complete your task once all subtasks are assigned`,
    isActive: true,
  });
  
  return { 
    message: "System bootstrapped successfully",
    chiefOfStaffId: cosId 
  };
});
```

## Frontend Implementation

### Project Structure

```
src/
├── App.tsx                 # Main app component
├── components/
│   ├── TaskCreator.tsx    # Task creation form
│   ├── TaskMonitor.tsx    # Task list view
│   ├── DocumentViewer.tsx # Document browser
│   └── AgentList.tsx      # Agent registry view
└── lib/
    └── convex.ts          # Convex client setup
```

### Task Creator Component

```typescript
// src/components/TaskCreator.tsx
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function TaskCreator() {
  const agents = useQuery(api.agents.listActive);
  const createTask = useMutation(api.tasks.create);
  
  const [formData, setFormData] = useState({
    assignedTo: "",
    title: "",
    description: "",
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assignedTo || !formData.title || !formData.description) {
      alert("Please fill all fields");
      return;
    }
    
    await createTask({
      assignedTo: formData.assignedTo as any,
      createdBy: "user",
      title: formData.title,
      description: formData.description,
    });
    
    // Reset form
    setFormData({ assignedTo: "", title: "", description: "" });
  };
  
  return (
    <div className="task-creator">
      <h2>Create New Task</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Assign To:</label>
          <select
            value={formData.assignedTo}
            onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
          >
            <option value="">Select an agent...</option>
            {agents?.map(agent => (
              <option key={agent._id} value={agent._id}>
                {agent.role}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Brief task summary"
          />
        </div>
        
        <div>
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Use suggested format:
## Context
[Why this task exists]

## Objective
[What needs to be done]

## Input
[Data/documents needed]

## Expected Output
[What should be produced]"
            rows={12}
          />
        </div>
        
        <button type="submit">Assign Task</button>
      </form>
    </div>
  );
}
```

### Task Monitor Component

```typescript
// src/components/TaskMonitor.tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TaskMonitor() {
  const tasks = useQuery(api.tasks.listRecent, { limit: 50 });
  const agents = useQuery(api.agents.listActive);
  
  const getAgentRole = (agentId: string) => {
    return agents?.find(a => a._id === agentId)?.role || agentId;
  };
  
  return (
    <div className="task-monitor">
      <h2>Task Monitor</h2>
      <div className="task-list">
        {tasks?.map(task => (
          <div key={task._id} className={`task-card status-${task.status}`}>
            <div className="task-header">
              <h3>{task.title}</h3>
              <span className={`status-badge ${task.status}`}>
                {task.status}
              </span>
            </div>
            <div className="task-meta">
              <span>Assigned to: {getAgentRole(task.assignedTo)}</span>
              <span>Created by: {task.createdBy}</span>
            </div>
            <p className="task-description">{task.description}</p>
            {task.parentTaskId && (
              <small>Subtask of: {task.parentTaskId}</small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Implementation Phases

### Phase 1: Infrastructure Setup (Day 1)
1. Initialize Convex project
2. Define schema
3. Create basic CRUD functions for agents, tasks, documents
4. Set up Gemini API integration
5. Run bootstrap script

### Phase 2: Core Agent Logic (Day 2)
1. Implement `processTask` action
2. Build LLM prompt engineering
3. Implement action execution logic
4. Test with manual task creation

### Phase 3: UI Development (Day 3)
1. Create task creation form
2. Build task monitor view
3. Add document viewer
4. Add agent list display

### Phase 4: Testing & Observation (Day 4-5)
1. Seed with simple tasks
2. Observe agent behaviors
3. Document emergent patterns
4. Refine system prompts
5. Add logging/debugging tools

### Phase 5: Iteration (Ongoing)
1. Adjust agent system prompts based on behavior
2. Add new specialist agents as patterns emerge
3. Refine task description conventions
4. Optimize LLM prompts

## Environment Setup

```bash
# .env.local
CONVEX_DEPLOYMENT=<your-convex-deployment>
GEMINI_API_KEY=<your-gemini-api-key>
```

## Testing Strategy

### Unit Tests
- Test individual Convex functions
- Verify schema validation
- Test action parsing

### Integration Tests
- Create task → verify agent triggered
- Test agent delegation chains
- Verify document creation/updates

### Observation Tests
- Seed with known task types
- Monitor for expected delegation patterns
- Verify no infinite loops
- Check for stuck tasks

### Edge Cases to Test
1. Agent assigns to non-existent agent
2. Task with missing required fields
3. LLM returns invalid JSON
4. Circular task dependencies
5. All agents inactive

## Monitoring & Debugging

### Key Metrics to Track
- Tasks created per hour
- Average task completion time
- Agent utilization (tasks per agent)
- Document creation rate
- Failed task rate

### Debugging Tools Needed
- Task dependency visualizer
- Agent activity timeline
- LLM prompt/response logger
- Document edit history

## Cost Estimation

- **Convex**: Free tier (1M function calls/month)
- **Gemini API**: Free tier (60 requests/minute)
- Expected cost: $0/month for initial testing

## Next Steps

1. Set up Convex project
2. Implement schema and basic functions
3. Create bootstrap script with 5 agents
4. Build minimal UI
5. Test with simple task: "Write a blog post about AI agents"
6. Observe what happens!

## Success Indicators

- Task chains form naturally (research → writing → editing)
- Agents reference documents created by other agents
- Chief of Staff successfully routes ambiguous tasks
- No infinite loops or deadlocks
- Documents accumulate useful knowledge
