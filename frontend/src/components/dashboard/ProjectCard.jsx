import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
  active:    { dot: 'bg-[#4caf50]', bg: 'bg-[#1b3a2e]', text: 'text-[#4caf50]', label: 'Active'    },
  on_hold:   { dot: 'bg-[#ff9800]', bg: 'bg-[#3a2a1a]', text: 'text-[#ff9800]', label: 'On Hold'   },
  completed: { dot: 'bg-[#2196f3]', bg: 'bg-[#1a2a3a]', text: 'text-[#2196f3]', label: 'Completed' },
  archived:  { dot: 'bg-[#555]',    bg: 'bg-[#222]',    text: 'text-[#777]',    label: 'Archived'  },
};

/**
 * ProjectCard
 *
 * Props:
 *   project   – project object from API
 *   onDelete  – (id) => void
 */
export default function ProjectCard({ project, onDelete }) {
  const navigate     = useNavigate();
  const [menu, setMenu] = useState(false);

  const status  = STATUS_STYLES[project.status] ?? STATUS_STYLES.active;
  const total   = project.total_tasks   ?? 0;
  const done    = project.done_tasks    ?? 0;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const overdue = project.overdue_tasks ?? 0;

  const handleCardClick = (e) => {
    if (e.target.closest('[data-menu]')) return;
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenu(false);
    onDelete?.(project.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-[#161616] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-xl p-5 cursor-pointer transition-all duration-200 relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${project.color}22`, border: `1px solid ${project.color}44` }}
          >
            {project.icon ?? '📁'}
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-medium text-white truncate leading-tight">
              {project.name}
            </h3>
            <p className="text-[11px] text-[#555] mt-0.5 truncate">
              {project.description || 'No description'}
            </p>
          </div>
        </div>

        {/* Context menu */}
        <div className="relative flex-shrink-0" data-menu>
          <button
            onClick={(e) => { e.stopPropagation(); setMenu((v) => !v); }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#444] hover:text-[#aaa] hover:bg-[#222] transition-all opacity-0 group-hover:opacity-100"
            aria-label="Project options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>

          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-1 w-40 shadow-xl shadow-black/40">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenu(false); navigate(`/projects/${project.id}`); }}
                  className="w-full text-left px-3 py-2 text-[12px] text-[#aaa] hover:text-white hover:bg-[#252525] transition-colors"
                >
                  Open project
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenu(false); navigate(`/projects/${project.id}/settings`); }}
                  className="w-full text-left px-3 py-2 text-[12px] text-[#aaa] hover:text-white hover:bg-[#252525] transition-colors"
                >
                  Settings
                </button>
                <div className="h-px bg-[#2a2a2a] my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-[12px] text-[#e53935] hover:bg-[#2a1a1a] transition-colors"
                >
                  Delete project
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e53935]/10 text-[#e53935]">
            {overdue} overdue
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-[#555] mb-1.5">
          <span>Progress</span>
          <span className="text-[#888]">{done}/{total} tasks</span>
        </div>
        <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:      `${pct}%`,
              background: project.color ?? '#2196f3',
              boxShadow:  `0 0 8px ${project.color ?? '#2196f3'}66`,
            }}
          />
        </div>
        <p className="text-right text-[10px] text-[#555] mt-1">{pct}%</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1a1a1a]">
        {/* Member avatars */}
        <div className="flex -space-x-1.5">
          {(project.members ?? []).slice(0, 4).map((m, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border border-[#161616] flex items-center justify-center text-[9px] font-semibold text-white"
              style={{ background: m.color ?? '#2196f3', zIndex: 4 - i }}
              title={m.name ?? m.username}
            >
              {(m.name ?? m.username ?? '?')[0].toUpperCase()}
            </div>
          ))}
          {(project.members?.length ?? 0) > 4 && (
            <div className="w-6 h-6 rounded-full border border-[#161616] bg-[#2a2a2a] flex items-center justify-center text-[9px] text-[#888]">
              +{project.members.length - 4}
            </div>
          )}
        </div>

        {/* Due date */}
        {project.due_date && (
          <span className="text-[10px] text-[#555] flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}