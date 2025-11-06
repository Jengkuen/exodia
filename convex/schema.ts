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
