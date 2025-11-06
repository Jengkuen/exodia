// convex/documents.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create document
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      updatedBy: args.createdBy,
    });
  },
});

// Update document
export const update = mutation({
  args: {
    docId: v.id("documents"),
    content: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.docId, {
      content: args.content,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });
  },
});

// Get document
export const get = query({
  args: { docId: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.docId);
  },
});

// List all documents
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").order("desc").collect();
  },
});
