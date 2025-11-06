import { useState } from "react";
import { TaskCreator } from "./components/TaskCreator";
import { TaskMonitor } from "./components/TaskMonitor";
import { DocumentViewer } from "./components/DocumentViewer";
import { AgentList } from "./components/AgentList";
import "./App.css";

type View = "tasks" | "documents" | "agents" | "create";

function App() {
  const [activeView, setActiveView] = useState<View>("tasks");

  return (
    <div className="app">
      <header className="app-header">
        <h1>Exodia</h1>
        <p className="app-subtitle">Agentic Workforce System</p>
      </header>

      <nav className="app-nav">
        <button
          className={activeView === "tasks" ? "active" : ""}
          onClick={() => setActiveView("tasks")}
        >
          Task Monitor
        </button>
        <button
          className={activeView === "create" ? "active" : ""}
          onClick={() => setActiveView("create")}
        >
          Create Task
        </button>
        <button
          className={activeView === "documents" ? "active" : ""}
          onClick={() => setActiveView("documents")}
        >
          Documents
        </button>
        <button
          className={activeView === "agents" ? "active" : ""}
          onClick={() => setActiveView("agents")}
        >
          Agents
        </button>
      </nav>

      <main className="app-main">
        {activeView === "tasks" && <TaskMonitor />}
        {activeView === "create" && <TaskCreator />}
        {activeView === "documents" && <DocumentViewer />}
        {activeView === "agents" && <AgentList />}
      </main>

      <footer className="app-footer">
        <p>
          Experimental AI agent coordination platform | Phase 2: UI Development
        </p>
      </footer>
    </div>
  );
}

export default App;
