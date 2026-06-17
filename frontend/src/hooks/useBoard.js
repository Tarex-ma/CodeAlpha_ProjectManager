import { useEffect, useCallback } from 'react';
import { useBoardStore } from '../store/boardStore';
import {
  getBoardData,
  createTask   as apiCreateTask,
  updateTask   as apiUpdateTask,
  deleteTask   as apiDeleteTask,
  moveTask     as apiMoveTask,
  createColumn as apiCreateColumn,
  updateColumn as apiUpdateColumn,
  deleteColumn as apiDeleteColumn,
} from '../api/boardApi';

/**
 * useBoard
 *
 * @param {string|number} projectId
 *
 * Returns all board state + action handlers.
 * All mutations are optimistic — UI updates instantly with API sync in background.
 */
export function useBoard(projectId) {
  const store = useBoardStore();

  // ── Initial data load ──────────────────────────────────────────
  const fetchBoard = useCallback(async () => {
    if (!projectId) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const { data } = await getBoardData(projectId);
      // Expect: { columns: [{ id, title, order, color, tasks: [...] }] }
      store.setColumns(data.columns ?? data ?? []);
    } catch (err) {
      store.setError(err?.response?.data?.detail ?? 'Failed to load board.');
    } finally {
      store.setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  // ── Task actions ───────────────────────────────────────────────
  const createTask = useCallback(async (columnId, formData) => {
    const { data } = await apiCreateTask({ ...formData, column: columnId });
    store.addTask(columnId, data);
    return data;
  }, []);

  const updateTask = useCallback(async (taskId, formData) => {
    store.updateTask(taskId, formData); // optimistic
    try {
      const { data } = await apiUpdateTask(taskId, formData);
      store.updateTask(taskId, data);
      return data;
    } catch (err) {
      await fetchBoard(); // rollback
      throw err;
    }
  }, [fetchBoard]);

  const deleteTask = useCallback(async (taskId) => {
    store.removeTask(taskId); // optimistic
    try {
      await apiDeleteTask(taskId);
    } catch {
      await fetchBoard(); // rollback
    }
  }, [fetchBoard]);

  /**
   * Called by dnd-kit after a successful drop.
   * @param {string|number} taskId
   * @param {string|number} fromColumnId
   * @param {string|number} toColumnId
   * @param {number}        newIndex
   * @param {any[]}         snapshot  - store snapshot taken before drag started
   */
  const moveTask = useCallback(async (taskId, fromColumnId, toColumnId, newIndex, snapshot) => {
    // UI already updated optimistically in onDragEnd
    try {
      await apiMoveTask(taskId, { column: toColumnId, order: newIndex });
    } catch {
      store.restoreSnapshot(snapshot); // rollback UI
    }
  }, []);

  // ── Column actions ─────────────────────────────────────────────
  const createColumn = useCallback(async (title) => {
    const { data } = await apiCreateColumn(projectId, { title });
    store.addColumn(data);
    return data;
  }, [projectId]);

  const updateColumn = useCallback(async (columnId, data) => {
    store.updateColumn(columnId, data);
    try {
      await apiUpdateColumn(columnId, data);
    } catch {
      await fetchBoard();
    }
  }, [fetchBoard]);

  const deleteColumn = useCallback(async (columnId) => {
    store.removeColumn(columnId);
    try {
      await apiDeleteColumn(columnId);
    } catch {
      await fetchBoard();
    }
  }, [fetchBoard]);

  return {
    columns:      store.columns,
    loading:      store.loading,
    error:        store.error,
    activeTaskId: store.activeTaskId,
    refetch:      fetchBoard,
    // Tasks
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    // Columns
    createColumn,
    updateColumn,
    deleteColumn,
    // Store direct access (for drag logic)
    store,
  };
}