// src/components/calendar/CreateTaskModal.jsx
import { useState } from "react";
import axios from "axios";
import "./calendar.css";

// ── Icons ─────────────────────────────────────────────────────
const TaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const PRIORITIES = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUSES = [
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review",   label: "In Review" },
  { value: "done",        label: "Done" },
];

// ── Component ─────────────────────────────────────────────────
export default function CreateTaskModal({ isOpen, onRequestClose, selectedDate, onTaskCreated }) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId]   = useState("");
  const [priority, setPriority]     = useState("medium");
  const [status, setStatus]         = useState("todo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle(""); setDescription(""); setProjectId("");
    setPriority("medium"); setStatus("todo"); setError("");
  };

  const handleClose = () => { resetForm(); onRequestClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = { title, description, project: projectId, priority, status, due_date: selectedDate };
      const resp = await axios.post(`/api/v1/projects/${projectId}/boards/1/tasks/`, payload);
      onTaskCreated(resp.data);
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to create task. Please check all fields.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ctm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="ctm-box" role="dialog" aria-modal="true" aria-label="Create Task">

        {/* Header */}
        <div className="ctm-header">
          <div className="ctm-header-left">
            <div className="ctm-header-icon"><TaskIcon /></div>
            <div>
              <h3 className="ctm-title">Create New Task</h3>
              <p className="ctm-date-badge">{formatDateLabel(selectedDate)}</p>
            </div>
          </div>
          <button className="ctm-close-btn" onClick={handleClose} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className="ctm-divider" />

        {/* Form */}
        <form className="ctm-form" onSubmit={handleSubmit}>

          {/* Title */}
          <div className="ctm-field">
            <label className="ctm-label">Task Title *</label>
            <input
              className="ctm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design landing page mockup"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="ctm-field">
            <label className="ctm-label">Description</label>
            <textarea
              className="ctm-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context about this task…"
              rows={3}
            />
          </div>

          {/* Project ID */}
          <div className="ctm-field">
            <label className="ctm-label">Project ID *</label>
            <input
              className="ctm-input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter the project ID"
              required
            />
          </div>

          {/* Priority */}
          <div className="ctm-field">
            <label className="ctm-label">Priority</label>
            <div className="ctm-priority-grid">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`ctm-priority-btn ${p.value}${priority === p.value ? " active" : ""}`}
                  onClick={() => setPriority(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="ctm-field">
            <label className="ctm-label">Status</label>
            <select
              className="ctm-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && <div className="ctm-error">{error}</div>}

          {/* Footer */}
          <div className="ctm-footer">
            <button type="button" className="ctm-cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="ctm-submit-btn" disabled={submitting}>
              <SendIcon />
              {submitting ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
