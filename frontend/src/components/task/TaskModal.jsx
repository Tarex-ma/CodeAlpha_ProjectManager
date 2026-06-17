import { useEffect, useRef } from 'react';
import { PRIORITY_CONFIG, LABEL_OPTIONS } from '../../utils/boardUtils';

/**
 * TaskModal
 *
 * Serves as both Create and Edit modal.
 * All state is managed by the useTaskModal hook passed as `modal` prop.
 *
 * Props:
 *   modal – return value of useTaskModal()
 */
export default function TaskModal({ modal }) {
  const {
    isOpen, isEditMode,
    form, errors, apiErr, loading,
    PRIORITY_OPTIONS,
    close,
    handleChange, setField, toggleLabel,
    handleSubmit, handleDelete,
  } = modal;

  const titleRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => titleRef.current?.focus(), 60);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[520px] max-h-[90vh] flex flex-col bg-[#161616] border border-[#252525] rounded-2xl shadow-2xl shadow-black/70 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#1e1e1e] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#2196f3]/10 rounded-lg flex items-center justify-center">
              {isEditMode ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              )}
            </div>
            <h2 id="task-modal-title" className="text-[14px] font-semibold text-white">
              {isEditMode ? 'Edit task' : 'Create task'}
            </h2>
          </div>
          <button
            onClick={close}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#555] hover:text-white hover:bg-[#222] transition-all"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* API error */}
            {apiErr && (
              <div className="flex items-start gap-2 bg-[#e53935]/10 border border-[#e53935]/25 rounded-lg px-3 py-2.5 text-[12px] text-[#ef9a9a]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {apiErr}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="task-title" className="block text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
                Title <span className="text-[#e53935]">*</span>
              </label>
              <input
                ref={titleRef}
                id="task-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                maxLength={120}
                aria-invalid={!!errors.title}
                className={`w-full bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-[#333] outline-none transition-all duration-200 focus:ring-1 ${
                  errors.title
                    ? 'border-[#e53935] focus:border-[#e53935] focus:ring-[#e53935]/20'
                    : 'border-[#252525] focus:border-[#2196f3] focus:ring-[#2196f3]/20'
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.title
                  ? <p className="text-[11px] text-[#e53935]">{errors.title}</p>
                  : <span />}
                <span className="text-[10px] text-[#333]">{form.title.length}/120</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-desc" className="block text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                id="task-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add more details…"
                rows={3}
                className="w-full bg-[#1a1a1a] border border-[#252525] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-[#333] outline-none resize-none transition-all duration-200 focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]/20"
              />
            </div>

            {/* Priority + Due date row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-[11px] font-medium text-[#555] uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="flex flex-col gap-1.5">
                  {PRIORITY_OPTIONS.map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setField('priority', p)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all duration-150 ${
                          form.priority === p
                            ? `${cfg.bg} ${cfg.text} ring-1`
                            : 'bg-[#1a1a1a] text-[#555] hover:bg-[#1e1e1e] hover:text-[#888]'
                        }`}
                        style={form.priority === p ? { ringColor: cfg.color } : {}}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due date */}
              <div>
                <label htmlFor="task-due" className="block text-[11px] font-medium text-[#555] uppercase tracking-wider mb-2">
                  Due date
                </label>
                <input
                  id="task-due"
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-[#252525] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none transition-all duration-200 focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]/20 [color-scheme:dark]"
                />

                {/* Assignee */}
                <label htmlFor="task-assignee" className="block text-[11px] font-medium text-[#555] uppercase tracking-wider mb-2 mt-4">
                  Assignee
                </label>
                <input
                  id="task-assignee"
                  name="assignee"
                  value={form.assignee}
                  onChange={handleChange}
                  placeholder="Username or email"
                  className="w-full bg-[#1a1a1a] border border-[#252525] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-[#333] outline-none transition-all duration-200 focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]/20"
                />
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-[11px] font-medium text-[#555] uppercase tracking-wider mb-2">
                Labels
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_OPTIONS.map(({ key, color, bg }) => {
                  const active = form.labels.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleLabel(key)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                        active ? bg : 'bg-[#1a1a1a] hover:bg-[#222]'
                      }`}
                      style={{
                        color:     active ? color : '#555',
                        outline:   active ? `1px solid ${color}40` : 'none',
                      }}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e1e1e] flex-shrink-0 bg-[#161616]">
            {/* Delete (edit mode only) */}
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-[#e53935] hover:bg-[#2a1a1a] rounded-lg transition-all disabled:opacity-40"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-[12px] text-[#777] hover:text-white bg-transparent hover:bg-[#1e1e1e] border border-[#252525] rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-[12px] font-medium text-white bg-[#2196f3] hover:bg-[#1976d2] active:scale-[0.98] rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : isEditMode ? (
                  'Save changes'
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Create task
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}