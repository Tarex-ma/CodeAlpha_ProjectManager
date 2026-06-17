import { useState, useMemo, useCallback } from 'react';
import { useParams }   from 'react-router-dom';
import { DndContext, DragOverlay } from '@dnd-kit/core';

import { useBoard }      from '../hooks/useBoard';
import { useTaskModal }  from '../hooks/useTaskModal';
import { useBoardDnd }   from '../hooks/useBoardDnd';

import BoardHeader      from '../components/board/BoardHeader';
import BoardToolbar     from '../components/board/BoardToolbar';
import BoardColumn      from '../components/board/BoardColumn';
import AddColumnButton  from '../components/board/AddColumnButton';
import DragOverlayCard  from '../components/board/DragOverlayCard';
import TaskModal        from '../components/task/TaskModal';

// ── Drop animation config ──────────────────────────────────────────
const DROP_ANIMATION = {
  sideEffects: ({ active }) => {
    active.node.classList.add('opacity-0');
    return () => active.node.classList.remove('opacity-0');
  },
};

// ── Filter helpers ─────────────────────────────────────────────────
const EMPTY_FILTERS = { search: '', priorities: [], labels: [] };

function taskMatchesFilters(task, filters) {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    if (
      !task.title.toLowerCase().includes(q) &&
      !(task.description ?? '').toLowerCase().includes(q)
    ) return false;
  }
  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
  if (filters.labels.length > 0    && !filters.labels.some((l) => (task.labels ?? []).includes(l))) return false;
  return true;
}

// ── List view row ──────────────────────────────────────────────────
function ListTaskRow({ task, onEdit, columnTitle, columnColor }) {
  return (
    <div
      onClick={() => onEdit(task)}
      className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#161616] cursor-pointer transition-colors group"
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: columnColor ?? '#555' }} />
      <span className="flex-1 text-[13px] text-[#ccc] group-hover:text-white truncate">{task.title}</span>
      <span className="text-[11px] text-[#444] hidden sm:block">{columnTitle}</span>
      {task.due_date && (
        <span className="text-[10px] text-[#444] hidden md:block">
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function BoardPage() {
  const { id: projectId } = useParams();
  const [view,    setView]    = useState('board');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // ── Data & mutations ─────────────────────────────────────────
  const {
    columns, loading, error, activeTaskId,
    refetch, store,
    createTask, updateTask, deleteTask, moveTask,
    createColumn, updateColumn, deleteColumn,
  } = useBoard(projectId);

  // ── Task modal ────────────────────────────────────────────────
  const modal = useTaskModal({
    onCreate: createTask,
    onUpdate: updateTask,
    onDelete: deleteTask,
  });

  // ── Drag & drop ───────────────────────────────────────────────
  const dnd = useBoardDnd({ moveTask });

  // ── Filters ───────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const filteredColumns = useMemo(() => {
    const hasFilters = filters.search || filters.priorities.length || filters.labels.length;
    if (!hasFilters) return columns;
    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => taskMatchesFilters(t, filters)),
    }));
  }, [columns, filters]);

  const totalCount   = columns.reduce((s, c) => s + c.tasks.length, 0);
  const visibleCount = filteredColumns.reduce((s, c) => s + c.tasks.length, 0);

  // Fake project object until a /projects/:id endpoint is wired
  const project = {
    id:          projectId,
    name:        'Project Board',
    description: 'Kanban board',
    status:      'active',
    color:       '#2196f3',
    icon:        '📋',
    total_tasks: totalCount,
    done_tasks:  columns.reduce((s, c) => s + c.tasks.filter((t) => t.status === 'done').length, 0),
  };

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-12 h-12 bg-[#e53935]/10 rounded-xl flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-[15px] font-medium text-white mb-1">Failed to load board</p>
        <p className="text-[13px] text-[#555] mb-5">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-[13px] text-[#aaa] hover:text-white rounded-lg transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#0f0f0f]">
        {/* Header skeleton */}
        <div className="flex-shrink-0 bg-[#111] border-b border-[#1a1a1a] px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg animate-pulse" />
            <div className="w-9 h-9 bg-[#1a1a1a] rounded-xl animate-pulse" />
            <div>
              <div className="w-40 h-4 bg-[#1a1a1a] rounded animate-pulse mb-1.5" />
              <div className="w-24 h-3 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
          </div>
          <div className="w-full h-1 bg-[#1a1a1a] rounded animate-pulse mb-3" />
          <div className="w-28 h-7 bg-[#1a1a1a] rounded-lg animate-pulse" />
        </div>

        {/* Columns skeleton */}
        <div className="flex-1 flex gap-4 px-6 py-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[280px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] animate-pulse" />
                <div className="w-24 h-3.5 bg-[#1a1a1a] rounded animate-pulse" />
              </div>
              <div className="flex flex-col gap-2.5 bg-[#111] rounded-xl p-2.5">
                {Array.from({ length: 3 - (i % 2) }).map((_, j) => (
                  <div key={j} className="bg-[#1a1a1a] rounded-xl p-3.5 animate-pulse">
                    <div className="w-3/4 h-3 bg-[#222] rounded mb-2" />
                    <div className="w-full h-2.5 bg-[#222] rounded mb-3" />
                    <div className="flex justify-between">
                      <div className="w-12 h-4 bg-[#222] rounded" />
                      <div className="w-10 h-3 bg-[#222] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Board view ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] overflow-hidden">

      <BoardHeader
        project={project}
        view={view}
        onViewChange={setView}
        onRefresh={refetch}
        loading={loading}
      />

      <BoardToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        taskCount={visibleCount}
        totalCount={totalCount}
      />

      {/* ── Board canvas ──────────────────────────────────── */}
      {view === 'board' ? (
        <DndContext
          sensors={dnd.sensors}
          collisionDetection={dnd.collisionDetection}
          onDragStart={dnd.onDragStart}
          onDragOver={dnd.onDragOver}
          onDragEnd={dnd.onDragEnd}
          onDragCancel={dnd.onDragCancel}
        >
          <div className="flex-1 flex gap-4 px-4 sm:px-6 py-5 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pb-4">

            {filteredColumns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                onAddTask={modal.openCreate}
                onEditTask={modal.openEdit}
                onEditColumn={updateColumn}
                onDeleteColumn={deleteColumn}
                activeTaskId={activeTaskId}
              />
            ))}

            <AddColumnButton onAdd={createColumn} />

            {/* Spacer so last column isn't flush against edge */}
            <div className="w-4 flex-shrink-0" />
          </div>

          <DragOverlay dropAnimation={DROP_ANIMATION}>
            <DragOverlayCard />
          </DragOverlay>
        </DndContext>

      ) : (
        // ── List view ────────────────────────────────────
        <div className="flex-1 overflow-y-auto">
          {filteredColumns.map((col) =>
            col.tasks.length > 0 ? (
              <div key={col.id}>
                {/* Column group header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-[#1a1a1a] sticky top-0 z-10">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color ?? '#555' }} />
                  <span className="text-[12px] font-semibold text-[#888]">{col.title}</span>
                  <span className="text-[10px] text-[#444]">{col.tasks.length}</span>
                </div>
                {col.tasks.map((task) => (
                  <ListTaskRow
                    key={task.id}
                    task={task}
                    onEdit={modal.openEdit}
                    columnTitle={col.title}
                    columnColor={col.color}
                  />
                ))}
              </div>
            ) : null
          )}

          {visibleCount === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[14px] text-[#444]">No tasks found</p>
              <p className="text-[12px] text-[#333] mt-1">
                {totalCount > 0 ? 'Try adjusting your filters' : 'Add a task to get started'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Task modal (create + edit) ─────────────────── */}
      <TaskModal modal={modal} />
    </div>
  );
}