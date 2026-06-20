import { useState, useEffect, useCallback } from 'react';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  reorderTasks,
} from '../api/tasks';

/**
 * Custom hook to manage task data.
 * Provides tasks list, loading & error states, and CRUD operations.
 */
export default function useTasks(projectId, boardId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build query params based on provided ids
  const params = {};
  if (projectId) params.project = projectId;
  if (boardId) params.board = boardId;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTasks(params);
      setTasks(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, boardId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = async (data) => {
    setLoading(true);
    try {
      const res = await createTask(data, projectId, boardId);
      setTasks((prev) => [...prev, res.data]);
    } finally {
      setLoading(false);
    }
  };

  const editTask = async (id, data) => {
    setLoading(true);
    try {
      const res = await updateTask(id, data, projectId, boardId);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    } finally {
      setLoading(false);
    }
  };

  const removeTask = async (id) => {
    setLoading(true);
    try {
      await deleteTask(id, projectId, boardId);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const move = async (id, boardId, position) => {
    setLoading(true);
    try {
      const res = await moveTask(id, boardId, position);
      // Update local state: replace the moved task
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    } finally {
      setLoading(false);
    }
  };

  const reorder = async (newOrder) => {
    // newOrder = [{id, position}, ...]
    setLoading(true);
    try {
      const res = await reorderTasks(boardId, newOrder);
      setTasks(res.data);
    } finally {
      setLoading(false);
    }
  };

  return {
    tasks,
    loading,
    error,
    reload: loadTasks,
    addTask,
    editTask,
    removeTask,
    move,
    reorder,
  };
}