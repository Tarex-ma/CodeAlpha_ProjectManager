// src/components/calendar/CalendarPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import CreateTaskModal from "./CreateTaskModal";
import axios from "axios";
import "./calendar.css";

// ── Icons ─────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────
function getEventColor(priority) {
  switch (priority) {
    case "urgent": return { bg: "linear-gradient(135deg,#dc2626,#b91c1c)", shadow: "rgba(220,38,38,0.4)" };
    case "high":   return { bg: "linear-gradient(135deg,#d97706,#b45309)", shadow: "rgba(217,119,6,0.4)" };
    case "low":    return { bg: "linear-gradient(135deg,#059669,#047857)", shadow: "rgba(5,150,105,0.4)" };
    default:       return { bg: "linear-gradient(135deg,#8b5cf6,#6366f1)", shadow: "rgba(139,92,246,0.4)" };
  }
}

// ── Component ─────────────────────────────────────────────────
export default function CalendarPage() {
  // Prevent StrictMode double-unmount crash
  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => { setShouldRender(true); }, []);

  const calendarRef = useRef(null);
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/v1/calendar/tasks/", { credentials: "include" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const mapped = data.map((task) => {
        const { bg } = getEventColor(task.priority);
        return {
          id: String(task.id),
          title: task.title,
          start: task.due_date,
          backgroundColor: bg,
          borderColor: "transparent",
          extendedProps: {
            projectId: task.project,
            boardId: task.board || null,
            priority: task.priority,
            status: task.status,
          },
        };
      });
      setEvents(mapped);
    } catch (e) {
      console.error("Failed to load calendar tasks", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Handlers ───────────────────────────────────────────────
  const handleDateClick = useCallback((info) => {
    setSelectedDate(info.dateStr);
    setModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(async (info) => {
    const { event } = info;
    try {
      await axios.patch(
        `/api/v1/projects/${event.extendedProps.projectId}/boards/${event.extendedProps.boardId}/tasks/${event.id}/`,
        { due_date: event.startStr }
      );
      fetchEvents();
    } catch (err) {
      console.error("Failed to update task date", err);
      info.revert();
    }
  }, [fetchEvents]);

  // ── Stats ──────────────────────────────────────────────────
  const total   = events.length;
  const urgent  = events.filter(e => e.extendedProps?.priority === "urgent").length;
  const done    = events.filter(e => e.extendedProps?.status === "done").length;
  const pending = total - done;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="cal-page">

      {/* Header */}
      <div className="cal-header">
        <div className="cal-header-left">
          <div className="cal-icon-wrap"><CalendarIcon /></div>
          <div>
            <h2 className="cal-title">Project Calendar</h2>
            <p className="cal-subtitle">All your tasks at a glance · drag to reschedule</p>
          </div>
        </div>
        <button className="cal-add-btn" onClick={() => { setSelectedDate(new Date().toISOString().slice(0,10)); setModalOpen(true); }}>
          <PlusIcon />
          New Task
        </button>
      </div>

      {/* Stats strip */}
      <div className="cal-stats">
        <div className="cal-stat-card">
          <span className="cal-stat-dot purple" />
          <div className="cal-stat-info">
            <span className="cal-stat-num">{total}</span>
            <span className="cal-stat-label">Total Tasks</span>
          </div>
        </div>
        <div className="cal-stat-card">
          <span className="cal-stat-dot amber" />
          <div className="cal-stat-info">
            <span className="cal-stat-num">{pending}</span>
            <span className="cal-stat-label">Pending</span>
          </div>
        </div>
        <div className="cal-stat-card">
          <span className="cal-stat-dot green" />
          <div className="cal-stat-info">
            <span className="cal-stat-num">{done}</span>
            <span className="cal-stat-label">Completed</span>
          </div>
        </div>
        <div className="cal-stat-card">
          <span className="cal-stat-dot red" />
          <div className="cal-stat-info">
            <span className="cal-stat-num">{urgent}</span>
            <span className="cal-stat-label">Urgent</span>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div className="cal-card">
        {loading ? (
          <div className="cal-loading">
            <div className="cal-spinner" />
            <span>Loading your tasks…</span>
          </div>
        ) : shouldRender && (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
            events={events}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            editable={true}
            selectable={true}
            eventDurationEditable={false}
            eventResizableFromStart={false}
            height="auto"
          />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        onTaskCreated={() => { fetchEvents(); setModalOpen(false); }}
      />
    </div>
  );
}
