import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TaskMonitor() {
  const tasks = useQuery(api.tasks.listRecent, { limit: 50 });
  const agents = useQuery(api.agents.listActive);

  const getAgentRole = (agentId: string) => {
    return agents?.find((a) => a._id === agentId)?.role || agentId;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!tasks) {
    return <div className="task-monitor">Loading tasks...</div>;
  }

  return (
    <div className="task-monitor">
      <h2>Task Monitor</h2>
      <div className="task-stats">
        <div className="stat">
          <span className="stat-label">Total Tasks:</span>
          <span className="stat-value">{tasks.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Pending:</span>
          <span className="stat-value pending">
            {tasks.filter((t) => t.status === "pending").length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">In Progress:</span>
          <span className="stat-value in-progress">
            {tasks.filter((t) => t.status === "in_progress").length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Completed:</span>
          <span className="stat-value completed">
            {tasks.filter((t) => t.status === "completed").length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Failed:</span>
          <span className="stat-value failed">
            {tasks.filter((t) => t.status === "failed").length}
          </span>
        </div>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <div key={task._id} className={`task-card status-${task.status}`}>
            <div className="task-header">
              <h3>{task.title}</h3>
              <span className={`status-badge ${task.status}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
            <div className="task-meta">
              <span>
                <strong>Assigned to:</strong> {getAgentRole(task.assignedTo)}
              </span>
              <span>
                <strong>Created by:</strong> {task.createdBy}
              </span>
              <span>
                <strong>Created:</strong> {formatDate(task.createdAt)}
              </span>
            </div>
            <p className="task-description">{task.description}</p>
            {task.parentTaskId && (
              <small className="task-parent">
                Subtask of: {task.parentTaskId}
              </small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
