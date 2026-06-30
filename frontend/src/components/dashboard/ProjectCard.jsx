import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';

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
export default function ProjectCard({ project, onDelete, onEdit }) {
  const navigate     = useNavigate();


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

        {/* Edit / Delete icons */}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100">
          <Pencil className="w-4 h-4 text-[#2196f3] hover:text-[#1976d2] cursor-pointer" onClick={(e) => { e.stopPropagation(); onEdit?.(project); }} />
          <Trash2 className="w-4 h-4 text-[#e53935] hover:text-[#c62828] cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(e); }} />
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