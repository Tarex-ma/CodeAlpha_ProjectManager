import { useState } from 'react';
import UserAvatar from '../common/UserAvatar';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  LABEL_CONFIG,
  formatDate,
  isDueSoon,
  isOverdue,
} from '../../utils/taskDetailUtils';

const ALL_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const ALL_STATUSES   = ['todo', 'in_progress', 'review', 'done'];
const ALL_LABELS     = Object.keys(LABEL_CONFIG);

function MetaRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
      <div className="w-5 flex-shrink-0 flex items-center justify-center text-[#444] mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">{label}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * TaskMeta
 *
 * Props:
 *   task        – task object
 *   onUpdate    – async (field, value) => void
 *   readOnly    – boolean
 */
export default function TaskMeta({ task, onUpdate, readOnly = false }) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'priority' | 'status' | 'labels' | null

  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const status   = STATUS_CONFIG[task.status]     ?? STATUS_CONFIG.todo;
  const labels   = task.labels ?? [];
  const overdue  = isOverdue(task.due_date) && task.status !== 'done';
  const soon     = isDueSoon(task.due_date) && !overdue;

  const toggle = (dropdown) =>
    setOpenDropdown((v) => (v === dropdown ? null : dropdown));

  const handlePriority = (p) => { onUpdate?.('priority', p); setOpenDropdown(null); };
  const handleStatus   = (s) => { onUpdate?.('status',   s); setOpenDropdown(null); };
  const handleLabel    = (l) => {
    const next = labels.includes(l) ? labels.filter((x) => x !== l) : [...labels, l];
    onUpdate?.('labels', next);
  };

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-1">

      {/* Priority */}
      <MetaRow
        label="Priority"
        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.1 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>}
      >
        <div className="relative">
          <button
            onClick={() => !readOnly && toggle('priority')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium transition-all ${priority.bg} ${priority.text} ${!readOnly ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
            {!readOnly && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 opacity-60">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </button>
          {openDropdown === 'priority' && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-8 z-20 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-1.5 w-36 shadow-xl shadow-black/50">
                {ALL_PRIORITIES.map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => handlePriority(p)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-[#252525] ${task.priority === p ? cfg.text : 'text-[#888]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </MetaRow>

      {/* Status */}
      <MetaRow
        label="Status"
        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
      >
        <div className="relative">
          <button
            onClick={() => !readOnly && toggle('status')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium transition-all ${status.bg} ${status.text} ${!readOnly ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
          >
            {status.label}
            {!readOnly && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </button>
          {openDropdown === 'status' && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-8 z-20 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-1.5 w-36 shadow-xl shadow-black/50">
                {ALL_STATUSES.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatus(s)}
                      className={`w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-[#252525] ${task.status === s ? cfg.text : 'text-[#888]'}`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </MetaRow>

      {/* Assignee */}
      <MetaRow
        label="Assignee"
        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
      >
        {task.assignee_name ? (
          <UserAvatar
            name={task.assignee_name}
            avatar={task.assignee_avatar}
            size="sm"
            showName
            color={task.assignee_color}
          />
        ) : (
          <span className="text-[12px] text-[#444]">Unassigned</span>
        )}
      </MetaRow>

      {/* Due date */}
      <MetaRow
        label="Due date"
        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
      >
        {task.due_date ? (
          <span className={`text-[12px] font-medium ${overdue ? 'text-[#e53935]' : soon ? 'text-[#ff9800]' : 'text-[#ccc]'}`}>
            {formatDate(task.due_date)}
            {overdue && <span className="ml-1.5 text-[10px] bg-[#3a1a1a] text-[#e53935] px-1.5 py-0.5 rounded">Overdue</span>}
            {soon    && <span className="ml-1.5 text-[10px] bg-[#3a2a1a] text-[#ff9800] px-1.5 py-0.5 rounded">Due soon</span>}
          </span>
        ) : (
          <span className="text-[12px] text-[#444]">No due date</span>
        )}
      </MetaRow>

      {/* Labels */}
      <MetaRow
        label="Labels"
        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}
      >
        <div className="relative">
          <div className="flex flex-wrap gap-1 mb-1">
            {labels.length > 0
              ? labels.map((l) => {
                  const cfg = LABEL_CONFIG[l] ?? { color: '#888', bg: 'bg-[#222]' };
                  return (
                    <span
                      key={l}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg}`}
                      style={{ color: cfg.color }}
                    >
                      {l}
                    </span>
                  );
                })
              : <span className="text-[12px] text-[#444]">None</span>
            }
          </div>
          {!readOnly && (
            <button
              onClick={() => toggle('labels')}
              className="text-[10px] text-[#444] hover:text-[#888] transition-colors"
            >
              {openDropdown === 'labels' ? 'Close' : '+ Edit labels'}
            </button>
          )}
          {openDropdown === 'labels' && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-6 z-20 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-3 w-48 shadow-xl shadow-black/50">
                <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Toggle labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_LABELS.map((l) => {
                    const cfg    = LABEL_CONFIG[l];
                    const active = labels.includes(l);
                    return (
                      <button
                        key={l}
                        onClick={() => handleLabel(l)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${active ? cfg.bg : 'bg-[#252525] hover:bg-[#2a2a2a]'}`}
                        style={{ color: active ? cfg.color : '#555' }}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </MetaRow>

      {/* Project */}
      {task.project_name && (
        <MetaRow
          label="Project"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
        >
          <span className="text-[12px] font-medium" style={{ color: task.project_color ?? '#2196f3' }}>
            {task.project_name}
          </span>
        </MetaRow>
      )}

      {/* Created date */}
      {task.created_at && (
        <MetaRow
          label="Created"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        >
          <span className="text-[12px] text-[#555]">{formatDate(task.created_at)}</span>
        </MetaRow>
      )}
    </div>
  );
}