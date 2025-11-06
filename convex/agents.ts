// convex/agents.ts
import { mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

// Create a new agent
export const createAgent = mutation({
  args: {
    role: v.string(),
    capabilities: v.string(),
    systemPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agents", {
      role: args.role,
      capabilities: args.capabilities,
      systemPrompt: args.systemPrompt,
      isActive: true,
    });
  },
});

// List all active agents
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get specific agent
export const get = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

// Update agent (for system prompt tuning)
export const updateAgent = mutation({
  args: {
    agentId: v.id("agents"),
    systemPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, { systemPrompt: args.systemPrompt });
  },
});

// Internal action triggered when task is created
export const processTask = internalAction({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    // Load task and agent details
    const task = await ctx.runQuery(api.tasks.get, { taskId: args.taskId });
    if (!task) {
      console.error(`Task ${args.taskId} not found`);
      return;
    }

    const agent = await ctx.runQuery(api.agents.get, {
      agentId: task.assignedTo,
    });

    if (!agent || !agent.isActive) {
      await ctx.runMutation(api.tasks.updateStatus, {
        taskId: args.taskId,
        status: "failed",
      });
      return;
    }

    // Mark as in progress
    await ctx.runMutation(api.tasks.updateStatus, {
      taskId: args.taskId,
      status: "in_progress",
    });

    try {
      // Get LLM decision
      const actions = await ctx.runAction(internal.llm.callGemini, {
        agentId: agent._id,
        taskId: args.taskId,
      });

      // Execute each action
      for (const action of actions) {
        await executeAction(ctx, task, action);
      }
    } catch (error) {
      console.error(`Agent ${agent.role} failed task ${args.taskId}:`, error);
      await ctx.runMutation(api.tasks.updateStatus, {
        taskId: args.taskId,
        status: "failed",
      });
    }
  },
});

// Execute individual agent action
async function executeAction(ctx: any, task: any, action: any) {
  switch (action.action) {
    case "assignTask":
      await ctx.runMutation(api.tasks.create, {
        assignedTo: action.recipientId,
        createdBy: task.assignedTo,
        title: action.title,
        description: action.description,
        parentTaskId: task._id,
        metadata: action.metadata,
      });
      break;

    case "writeDocument":
      await ctx.runMutation(api.documents.create, {
        title: action.title,
        content: action.content,
        createdBy: task.assignedTo,
      });
      break;

    case "updateDocument":
      await ctx.runMutation(api.documents.update, {
        docId: action.docId,
        content: action.content,
        updatedBy: task.assignedTo,
      });
      break;

    case "completeTask":
      await ctx.runMutation(api.tasks.updateStatus, {
        taskId: task._id,
        status: "completed",
        completedAt: Date.now(),
      });
      break;

    case "failTask":
      await ctx.runMutation(api.tasks.updateStatus, {
        taskId: task._id,
        status: "failed",
        completedAt: Date.now(),
      });
      break;
  }
}
