import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function DocumentViewer() {
  const documents = useQuery(api.documents.list);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!documents) {
    return <div className="document-viewer">Loading documents...</div>;
  }

  const selectedDocument = selectedDoc
    ? documents.find((d) => d._id === selectedDoc)
    : null;

  return (
    <div className="document-viewer">
      <h2>Document Library</h2>
      <div className="document-container">
        <div className="document-list">
          <h3>Documents ({documents.length})</h3>
          {documents.length === 0 ? (
            <p className="empty-state">
              No documents yet. Agents will create documents as they work on
              tasks.
            </p>
          ) : (
            <ul>
              {documents.map((doc) => (
                <li
                  key={doc._id}
                  className={selectedDoc === doc._id ? "selected" : ""}
                  onClick={() => setSelectedDoc(doc._id)}
                >
                  <div className="doc-item">
                    <strong>{doc.title}</strong>
                    <small>by {doc.createdBy}</small>
                    <small>{formatDate(doc.createdAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="document-content">
          {selectedDocument ? (
            <>
              <div className="document-header">
                <h3>{selectedDocument.title}</h3>
                <div className="document-meta">
                  <span>
                    <strong>Created by:</strong> {selectedDocument.createdBy}
                  </span>
                  <span>
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedDocument.createdAt)}
                  </span>
                  <span>
                    <strong>Updated:</strong>{" "}
                    {formatDate(selectedDocument.updatedAt)}
                  </span>
                  <span>
                    <strong>Updated by:</strong> {selectedDocument.updatedBy}
                  </span>
                </div>
              </div>
              <div className="document-body">
                <pre>{selectedDocument.content}</pre>
              </div>
            </>
          ) : (
            <div className="document-placeholder">
              <p>Select a document to view its contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
