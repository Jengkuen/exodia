import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AgentList() {
  const agents = useQuery(api.agents.listActive);

  if (!agents) {
    return <div className="agent-list">Loading agents...</div>;
  }

  return (
    <div className="agent-list">
      <h2>Agent Workforce</h2>
      <div className="agents-grid">
        {agents.map((agent) => (
          <div key={agent._id} className="agent-card">
            <div className="agent-header">
              <h3>{agent.role}</h3>
              <span
                className={`status-indicator ${
                  agent.isActive ? "active" : "inactive"
                }`}
              >
                {agent.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="agent-capabilities">
              <strong>Capabilities:</strong>
              <p>{agent.capabilities}</p>
            </div>
            <div className="agent-prompt">
              <strong>System Prompt:</strong>
              <details>
                <summary>View prompt</summary>
                <pre>{agent.systemPrompt}</pre>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
