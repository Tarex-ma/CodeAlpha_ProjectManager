import { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from '../task/TaskCard';

const COLUMN_COLORS = [
  '#7c5cbf', '#2196f3', '#4caf50', '#ff9800',
  '#e91e63', '#00bcd4', '#f44336', '#607d8b',
];

/**
 * BoardColumn
 *
 * Props:
 *   column        – { id, title, color, tasks: [] }
 *   onAddTask     – (columnId) => void
 *   onEditTask    – (task)     => void
 *   onEditColumn  – (id, data) => void
 *   onDeleteColumn– (id)       => void
 *   activeTaskId  – id of currently dragged task
 */
export default function BoardColumn({
  column,
  onAddTask,
  onEditTask,
  onEditColumn,
  onDeleteColumn,
  activeTaskId,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  });

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const titleInputRef = useRef(null);

  const taskIds = column.tasks.map((t) => t.id);

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue.trim() !== column.title) {
      onEditColumn?.(column.id, { title: titleValue.trim() });
    } else {
      setTitleValue(column.title);
    }
  };

  const color = column.color ?? '#2196f3';

  return (
    <div className="flex flex-col w-[280px] flex-shrink-0 snap-start">
      {/* ── Column header ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Color dot */}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />

          {/* Editable title */}
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') { setTitleValue(column.title); setEditingTitle(false); }
              }}
              className="flex-1 min-w-0 bg-transparent text-[13px] font-semibold text-white border-b border-[#2196f3] outline-none pb-0.5"
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setEditingTitle(true); setTimeout(() => titleInputRef.current?.select(), 10); }}
              className="text-[13px] font-semibold text-white hover:text-[#aaa] transition-colors truncate text-left"
            >
              {column.title}
            </button>
          )}

          {/* Task count */}
          <span className="flex-shrink-0 w-5 h-5 bg-[#1e1e1e] rounded-md flex items-center justify-center text-[10px] font-medium text-[#555]">
            {column.tasks.length}
          </span>
        </div>

        {/* Column actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Add task */}
          <button
            onClick={() => onAddTask?.(column.id)}
            className="w-6 h-6 flex items-center justify-center text-[#444] hover:text-[#aaa] hover:bg-[#1e1e1e] rounded-md transition-all"
            aria-label="Add task"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Column menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="w-6 h-6 flex items-center justify-center text-[#444] hover:text-[#aaa] hover:bg-[#1e1e1e] rounded-md transition-all"
              aria-label="Column options"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-7 z-20 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-1.5 w-44 shadow-xl shadow-black/50">
                  {/* Color options */}
                  <div className="px-3 py-2">
                    <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLUMN_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => { onEditColumn?.(column.id, { color: c }); setShowMenu(false); }}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-offset-[#1e1e1e]' : ''}`}
                          style={{ background: c, ringColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-[#252525] mx-2 my-1" />
                  <button
                    onClick={() => { setShowMenu(false); onDeleteColumn?.(column.id); }}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#e53935] hover:bg-[#2a1a1a] transition-colors"
                  >
                    Delete column
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Drop zone ──────────────────────────────────────── */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 flex flex-col gap-2.5 rounded-xl p-2.5 min-h-[120px] transition-all duration-200',
          isOver
            ? 'bg-[#1a2a3a] border border-dashed border-[#2196f3]/40'
            : 'bg-[#111] border border-transparent',
        ].join(' ')}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              isDragging={task.id === activeTaskId}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {column.tasks.length === 0 && !isOver && (
          <button
            onClick={() => onAddTask?.(column.id)}
            className="flex flex-col items-center justify-center gap-2 py-8 text-center border border-dashed border-[#1e1e1e] hover:border-[#2a2a2a] rounded-xl transition-colors group"
          >
            <div className="w-8 h-8 bg-[#1a1a1a] group-hover:bg-[#1e1e1e] rounded-lg flex items-center justify-center transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-[11px] text-[#333] group-hover:text-[#555] transition-colors">
              Add a task
            </span>
          </button>
        )}

        {/* Drop indicator */}
        {isOver && column.tasks.length === 0 && (
          <div
            className="h-16 rounded-lg border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: `${color}60`, background: `${color}08` }}
          >
            <span className="text-[11px]" style={{ color: `${color}80` }}>
              Drop here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}