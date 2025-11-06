import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, FormEvent } from "react";
import { Id } from "../../convex/_generated/dataModel";

export function TaskCreator() {
  const agents = useQuery(api.agents.listActive);
  const createTask = useMutation(api.tasks.create);

  const [formData, setFormData] = useState({
    assignedTo: "",
    title: "",
    description: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.assignedTo || !formData.title || !formData.description) {
      alert("Please fill all fields");
      return;
    }

    try {
      await createTask({
        assignedTo: formData.assignedTo as Id<"agents">,
        createdBy: "user",
        title: formData.title,
        description: formData.description,
      });

      // Reset form
      setFormData({ assignedTo: "", title: "", description: "" });
      alert("Task created successfully!");
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task");
    }
  };

  return (
    <div className="task-creator">
      <h2>Create New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="assignedTo">Assign To:</label>
          <select
            id="assignedTo"
            value={formData.assignedTo}
            onChange={(e) =>
              setFormData({ ...formData, assignedTo: e.target.value })
            }
          >
            <option value="">Select an agent...</option>
            {agents?.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.role}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Brief task summary"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={`Use suggested format:
## Context
[Why this task exists]

## Objective
[What needs to be done]

## Input
[Data/documents needed]

## Expected Output
[What should be produced]`}
            rows={12}
          />
        </div>

        <button type="submit" className="btn-primary">
          Assign Task
        </button>
      </form>
    </div>
  );
}
