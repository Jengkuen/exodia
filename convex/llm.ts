// convex/llm.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const callGemini = internalAction({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Load agent and task
    const agent = await ctx.runQuery(api.agents.get, { agentId: args.agentId });
    const task = await ctx.runQuery(api.tasks.get, { taskId: args.taskId });

    if (!agent || !task) {
      throw new Error("Agent or task not found");
    }

    // Load additional context
    const allAgents = await ctx.runQuery(api.agents.listActive, {});
    const documents = await ctx.runQuery(api.documents.list, {});

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Fast and efficient model
    });

    const prompt = `${agent.systemPrompt}

## Available Agents
${allAgents.map((a) => `- ${a._id}: ${a.role} - ${a.capabilities}`).join("\n")}

## Your Assigned Task
Title: ${task.title}
Description: ${task.description}
${task.parentTaskId ? `This is a subtask of: ${task.parentTaskId}` : ""}

## Available Documents
${documents.slice(0, 10).map((d) => `- ${d._id}: ${d.title}`).join("\n")}

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
      throw new Error("LLM did not return valid JSON array");
    }

    return JSON.parse(jsonMatch[0]);
  },
});
