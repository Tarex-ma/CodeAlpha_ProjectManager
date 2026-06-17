import { create } from 'zustand';

/**
 * useBoardStore
 *
 * Single source of truth for all board state.
 * Columns carry their tasks inline: [{ id, title, order, tasks: [...] }]
 *
 * All mutations are optimistic — the UI updates instantly;
 * callers are responsible for rolling back on API failure.
 */
export const useBoardStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────
  columns:      [],   // ColumnWithTasks[]
  activeTaskId: null, // id of task being dragged (for DragOverlay)
  loading:      true,
  error:        null,

  // ── Setters ────────────────────────────────────────────────────
  setColumns: (columns) => set({ columns }),
  setLoading: (loading) => set({ loading }),
  setError:   (error)   => set({ error }),

  setActiveTaskId: (id) => set({ activeTaskId: id }),

  // Snapshot for rollback
  snapshot: () => JSON.parse(JSON.stringify(get().columns)),

  // ── Column mutations ───────────────────────────────────────────
  addColumn: (column) =>
    set({ columns: [...get().columns, { ...column, tasks: [] }] }),

  updateColumn: (id, data) =>
    set({
      columns: get().columns.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }),

  removeColumn: (id) =>
    set({ columns: get().columns.filter((c) => c.id !== id) }),

  // ── Task mutations ────────────────────────────────────────────
  addTask: (columnId, task) =>
    set({
      columns: get().columns.map((c) =>
        c.id === columnId ? { ...c, tasks: [...c.tasks, task] } : c
      ),
    }),

  updateTask: (taskId, data) =>
    set({
      columns: get().columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
      })),
    }),

  removeTask: (taskId) =>
    set({
      columns: get().columns.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== taskId),
      })),
    }),

  /**
   * Move a task within or between columns (optimistic).
   * @param {string|number} taskId
   * @param {string|number} fromColumnId
   * @param {string|number} toColumnId
   * @param {number}        newIndex
   */
  moveTask: (taskId, fromColumnId, toColumnId, newIndex) => {
    const cols = JSON.parse(JSON.stringify(get().columns));
    const from = cols.find((c) => c.id === fromColumnId);
    const to   = cols.find((c) => c.id === toColumnId);
    if (!from || !to) return;

    const taskIdx = from.tasks.findIndex((t) => t.id === taskId);
    if (taskIdx === -1) return;

    const [task] = from.tasks.splice(taskIdx, 1);
    task.column = toColumnId;
    to.tasks.splice(newIndex, 0, task);

    set({ columns: cols });
  },

  // Restore a snapshot (on drag cancel or API failure)
  restoreSnapshot: (snapshot) => set({ columns: snapshot }),

  // ── Helpers ───────────────────────────────────────────────────
  findTask: (taskId) => {
    for (const col of get().columns) {
      const task = col.tasks.find((t) => t.id === taskId);
      if (task) return { task, column: col };
    }
    return null;
  },

  findColumnByTaskId: (taskId) => {
    return get().columns.find((c) => c.tasks.some((t) => t.id === taskId)) ?? null;
  },
}));