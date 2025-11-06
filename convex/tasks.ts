// convex/tasks.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Create and assign task
export const create = mutation({
  args: {
    assignedTo: v.id("agents"),
    createdBy: v.string(),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
    parentTaskId: v.optional(v.id("tasks")),
    relatedDocuments: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      assignedTo: args.assignedTo,
      createdBy: args.createdBy,
      title: args.title,
      description: args.description,
      status: "pending",
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
  },
});

// Update task status
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: args.status,
      ...(args.completedAt && { completedAt: args.completedAt }),
    });
  },
});

// Get task details
export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// List tasks for monitoring
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db.query("tasks").order("desc").take(limit);
  },
});

// Get tasks by agent
export const byAgent = query({
  args: {
    agentId: v.id("agents"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("tasks")
      .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.agentId));

    if (args.status) {
      const tasks = await query.collect();
      return tasks.filter((task) => task.status === args.status);
    }

    return await query.collect();
  },
});
