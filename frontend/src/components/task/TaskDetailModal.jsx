import { useEffect, useRef } from 'react';
import { useTaskDetail }  from '../../hooks/useTaskDetail';
import TaskMeta          from './TaskMeta';
import TaskChecklist     from './TaskChecklist';
import CommentsSection   from './CommentsSection';
import { PRIORITY_CONFIG } from '../../utils/taskDetailUtils';

/**
 * TaskDetailModal
 *
 * Full-featured task detail modal.
 *
 * Props:
 *   taskId         – id to load (null = closed)
 *   onClose        – () => void
 *   onTaskUpdated  – (task) => void   (propagate changes to board)
 *   onTaskDeleted  – (id)  => void
 *   currentUser    – { id, name, avatar }
 */
export default function TaskDetailModal({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  currentUser,
}) {
  const isOpen = taskId != null;
  const titleRef = useRef(null);

  const detail = useTaskDetail(taskId, {
    onTaskUpdated,
    onTaskDeleted: (id) => { onTaskDeleted?.(id); onClose(); },
  });

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus title on open
  useEffect(() => {
    if (isOpen && detail.task) setTimeout(() => titleRef.current?.focus?.(), 80);
  }, [isOpen, detail.task]);

  if (!isOpen) return null;

  const { task, loadingTask, error } = detail;
  const priority = PRIORITY_CONFIG[task?.priority] ?? PRIORITY_CONFIG.medium;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[840px] max-h-[90vh] flex flex-col bg-[#141414] border border-[#1e1e1e] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">

        {/* ── Top bar ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1a1a1a] flex-shrink-0 bg-[#111]">
          <div className="flex items-center gap-2.5">
            {/* Priority accent */}
            {task && (
              <div
                className="w-1 h-5 rounded-full flex-shrink-0"
                style={{ background: priority.color }}
              />
            )}
            <span className="text-[11px] text-[#444] uppercase tracking-wider">Task</span>
            {task?.id && (
              <span className="text-[11px] text-[#2a2a2a] font-mono">#{task.id}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy link */}
            <button
              className="w-7 h-7 flex items-center justify-center text-[#444] hover:text-[#888] hover:bg-[#1a1a1a] rounded-lg transition-all"
              aria-label="Copy link"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
            </button>

            {/* Delete task */}
            {task && (
              <button
                onClick={detail.deleteTask}
                className="w-7 h-7 flex items-center justify-center text-[#444] hover:text-[#e53935] hover:bg-[#2a1a1a] rounded-lg transition-all"
                aria-label="Delete task"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-[#444] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-all"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="px-6 py-4 bg-[#e53935]/10 border-b border-[#e53935]/20 text-[13px] text-[#ef9a9a] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── Loading skeleton ────────────────────────────────── */}
        {loadingTask && !task && (
          <div className="flex-1 grid grid-cols-[1fr_240px] overflow-hidden animate-pulse">
            <div className="px-6 py-6 border-r border-[#1a1a1a] space-y-5">
              <div className="w-3/4 h-6 bg-[#1e1e1e] rounded" />
              <div className="w-full h-3 bg-[#1e1e1e] rounded" />
              <div className="w-5/6 h-3 bg-[#1e1e1e] rounded" />
              <div className="w-2/3 h-3 bg-[#1e1e1e] rounded" />
            </div>
            <div className="px-4 py-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-[#1e1e1e] rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {/* ── Main content ───────────────────────────────────── */}
        {task && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_240px] overflow-hidden">

            {/* ── Left: title, description, checklist, comments ── */}
            <div className="overflow-y-auto px-6 py-5 space-y-6 border-r border-[#1a1a1a]">

              {/* Title */}
              <div>
                {detail.editingField === 'title' ? (
                  <div>
                    <input
                      ref={titleRef}
                      value={detail.fieldValue}
                      onChange={(e) => detail.setFieldValue(e.target.value)}
                      onBlur={() => detail.saveField('title')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')  detail.saveField('title');
                        if (e.key === 'Escape') detail.cancelEditField();
                      }}
                      className="w-full bg-transparent text-[18px] font-semibold text-white border-b border-[#2196f3] outline-none pb-1 leading-tight"
                      autoFocus
                    />
                    <p className="text-[10px] text-[#333] mt-1">↵ to save · Esc to cancel</p>
                  </div>
                ) : (
                  <button
                    id="task-detail-title"
                    onClick={() => detail.startEditField('title')}
                    className="w-full text-left text-[18px] font-semibold text-white leading-tight hover:text-[#ddd] transition-colors group"
                  >
                    {task.title}
                    <svg
                      className="inline ml-2 opacity-0 group-hover:opacity-40 transition-opacity"
                      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">Description</span>
                </div>

                {detail.editingField === 'description' ? (
                  <div>
                    <textarea
                      value={detail.fieldValue}
                      onChange={(e) => detail.setFieldValue(e.target.value)}
                      onBlur={() => detail.saveField('description')}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') detail.cancelEditField();
                      }}
                      rows={5}
                      className="w-full bg-[#1a1a1a] border border-[#2196f3]/40 rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none leading-relaxed"
                      placeholder="Add a description…"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => detail.saveField('description')}
                        disabled={detail.savingField}
                        className="px-3 py-1.5 bg-[#2196f3] hover:bg-[#1976d2] text-white text-[11px] font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {detail.savingField ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={detail.cancelEditField}
                        className="px-3 py-1.5 text-[11px] text-[#555] hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => detail.startEditField('description')}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all group ${
                      task.description
                        ? 'bg-[#111] border-[#1a1a1a] hover:border-[#222]'
                        : 'bg-[#111] border-dashed border-[#1a1a1a] hover:border-[#252525]'
                    }`}
                  >
                    <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${task.description ? 'text-[#aaa] group-hover:text-[#bbb]' : 'text-[#333] group-hover:text-[#444]'}`}>
                      {task.description || 'Click to add a description…'}
                    </p>
                  </button>
                )}
              </div>

              {/* Checklist */}
              <div className="pt-1">
                <TaskChecklist
                  checklist={detail.checklist}
                  doneCount={detail.doneCount}
                  pct={detail.checklistPct}
                  newCheckItem={detail.newCheckItem}
                  setNewCheckItem={detail.setNewCheckItem}
                  addingCheck={detail.addingCheck}
                  onAdd={detail.addCheckItem}
                  onToggle={detail.toggleCheckItem}
                  onDelete={detail.deleteCheckItem}
                />
              </div>

              {/* Comments */}
              <div className="pt-1 pb-4">
                <CommentsSection
                  comments={detail.comments}
                  loading={detail.loadingCmts}
                  commentText={detail.commentText}
                  setCommentText={detail.setCommentText}
                  submitting={detail.submittingCmt}
                  onSubmit={detail.submitComment}
                  editingCmtId={detail.editingCmtId}
                  editingCmtText={detail.editingCmtText}
                  setEditingCmtText={detail.setEditingCmtText}
                  savingCmt={detail.savingCmt}
                  onStartEdit={detail.startEditComment}
                  onCancelEdit={detail.cancelEditComment}
                  onSaveEdit={detail.saveComment}
                  onDelete={detail.deleteComment}
                  currentUser={currentUser}
                />
              </div>
            </div>

            {/* ── Right: meta sidebar ─────────────────────────── */}
            <div className="overflow-y-auto px-4 py-5 hidden md:block">
              <TaskMeta
                task={task}
                onUpdate={detail.updateField}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}