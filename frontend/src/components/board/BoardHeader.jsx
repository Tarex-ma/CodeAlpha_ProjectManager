import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  active:    { label: 'Active',    dot: 'bg-[#4caf50]', bg: 'bg-[#1b3a2e]', text: 'text-[#4caf50]' },
  on_hold:   { label: 'On Hold',  dot: 'bg-[#ff9800]', bg: 'bg-[#3a2a1a]', text: 'text-[#ff9800]' },
  completed: { label: 'Completed',dot: 'bg-[#2196f3]', bg: 'bg-[#1a2a3a]', text: 'text-[#2196f3]' },
  archived:  { label: 'Archived', dot: 'bg-[#555]',    bg: 'bg-[#222]',    text: 'text-[#777]'    },
};

/**
 * BoardHeader
 *
 * Props:
 *   project   – { id, name, description, status, color, total_tasks, done_tasks }
 *   view      – 'board' | 'list'
 *   onViewChange – (view) => void
 *   onRefresh – () => void
 *   loading   – boolean
 */
export default function BoardHeader({ project, view, onViewChange, onRefresh, loading }) {
  const navigate  = useNavigate();
  const [copied, setCopied] = useState(false);

  const status  = STATUS_CONFIG[project?.status] ?? STATUS_CONFIG.active;
  const total   = project?.total_tasks ?? 0;
  const done    = project?.done_tasks  ?? 0;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const color   = project?.color ?? '#2196f3';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-shrink-0 bg-[#111] border-b border-[#1a1a1a]">
      <div className="px-4 sm:px-6 py-4">

        {/* ── Top row ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] hover:bg-[#222] border border-[#222] hover:border-[#2a2a2a] rounded-lg text-[#555] hover:text-[#aaa] transition-all flex-shrink-0"
              aria-label="Go back"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Project icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}33` }}
            >
              {project?.icon ?? '📁'}
            </div>

            {/* Title block */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[16px] font-semibold text-white tracking-tight truncate">
                  {project?.name ?? 'Board'}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              {project?.description && (
                <p className="text-[11px] text-[#444] mt-0.5 truncate max-w-[400px]">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* ── Right actions ──────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Share */}
            <button
              onClick={handleShare}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#1e1e1e] border border-[#222] hover:border-[#2a2a2a] rounded-lg text-[11px] text-[#666] hover:text-[#aaa] transition-all"
            >
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[#4caf50]">Copied!</span>
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share
                </>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] hover:bg-[#1e1e1e] border border-[#222] hover:border-[#2a2a2a] rounded-lg text-[#555] hover:text-[#aaa] transition-all disabled:opacity-40"
              aria-label="Refresh board"
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={loading ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>

            {/* Project settings */}
            <button
              onClick={() => navigate(`/projects/${project?.id}/settings`)}
              className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] hover:bg-[#1e1e1e] border border-[#222] hover:border-[#2a2a2a] rounded-lg text-[#555] hover:text-[#aaa] transition-all"
              aria-label="Project settings"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Progress bar ──────────────────────────────────── */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-[#444] mb-1.5">
            <span>{done} of {total} tasks complete</span>
            <span className="font-medium" style={{ color }}>{pct}%</span>
          </div>
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}55` }}
            />
          </div>
        </div>

        {/* ── View toggle ───────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#1e1e1e] rounded-lg p-0.5 w-fit">
          {[
            {
              key: 'board', label: 'Board',
              icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/>
                </svg>
              ),
            },
            {
              key: 'list', label: 'List',
              icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              ),
            },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onViewChange?.(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
                view === key
                  ? 'bg-[#252525] text-white shadow-sm'
                  : 'text-[#555] hover:text-[#888]'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}