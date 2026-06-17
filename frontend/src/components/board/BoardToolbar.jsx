import { useState } from 'react';
import { PRIORITY_CONFIG, LABEL_OPTIONS } from '../../utils/boardUtils';

/**
 * BoardToolbar
 *
 * Props:
 *   filters       – { search, priorities, labels }
 *   onFilterChange – (key, value) => void
 *   onClearFilters – () => void
 *   taskCount     – number (total visible tasks after filtering)
 *   totalCount    – number (total tasks)
 */
export default function BoardToolbar({
  filters,
  onFilterChange,
  onClearFilters,
  taskCount,
  totalCount,
}) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filters.search ||
    filters.priorities.length > 0 ||
    filters.labels.length > 0;

  const togglePriority = (p) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((x) => x !== p)
      : [...filters.priorities, p];
    onFilterChange('priorities', next);
  };

  const toggleLabel = (l) => {
    const next = filters.labels.includes(l)
      ? filters.labels.filter((x) => x !== l)
      : [...filters.labels, l];
    onFilterChange('labels', next);
  };

  return (
    <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 border-b border-[#1a1a1a] bg-[#0f0f0f]">

      {/* ── Main toolbar row ─────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-[280px]">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#333] pointer-events-none"
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search tasks…"
            className="w-full bg-[#161616] border border-[#1e1e1e] focus:border-[#2a2a2a] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-white placeholder:text-[#333] outline-none transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
              aria-label="Clear search"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-[#1a2a3a] border-[#2196f3]/30 text-[#2196f3]'
              : 'bg-[#161616] border-[#1e1e1e] text-[#555] hover:text-[#888] hover:border-[#2a2a2a]'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-4 h-4 bg-[#2196f3] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {filters.priorities.length + filters.labels.length + (filters.search ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-[#e53935] hover:bg-[#2a1a1a] rounded-lg transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Clear
          </button>
        )}

        {/* Task count indicator */}
        {hasActiveFilters && (
          <span className="text-[11px] text-[#444] ml-auto">
            {taskCount} of {totalCount} tasks
          </span>
        )}
      </div>

      {/* ── Expanded filter panel ─────────────────────────── */}
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex flex-wrap gap-4">

          {/* Priority filter */}
          <div>
            <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Priority</p>
            <div className="flex gap-1.5">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                const active = filters.priorities.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => togglePriority(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      active ? `${cfg.bg} ${cfg.text}` : 'bg-[#161616] text-[#555] hover:bg-[#1a1a1a] hover:text-[#888]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label filter */}
          <div>
            <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Labels</p>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_OPTIONS.map(({ key, color, bg }) => {
                const active = filters.labels.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleLabel(key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      active ? bg : 'bg-[#161616] hover:bg-[#1a1a1a]'
                    }`}
                    style={{ color: active ? color : '#555' }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}