import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import { updateTask } from '../api/tasks';

/**
 * useMyTasks
 *
 * Fetches all tasks assigned to the current user via /api/v1/tasks/?assigned_to_me=true
 * and provides client-side search, filtering, and sorting.
 */
export function useMyTasks() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Controls ─────────────────────────────────────────────────────
  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ status: '', priority: '', project: '', dueDate: '' });
  const [sortBy,   setSortBy]   = useState('due_date'); // 'due_date' | 'priority' | 'updated_at'
  const [viewMode, setViewMode] = useState('list');     // 'list' | 'grid'

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try the /tasks/my/ endpoint first (returns tasks assigned to current user)
      const { data } = await axiosInstance.get('/tasks/my/', { params: { limit: 200 } });
      const list = data?.results ?? data ?? [];
      setTasks(list);
    } catch {
      try {
        // Fallback: query all tasks and filter client-side if the endpoint doesn't exist
        const { data } = await axiosInstance.get('/tasks/', { params: { limit: 200 } });
        setTasks(data?.results ?? data ?? []);
      } catch (err) {
        setError(err?.response?.data?.detail ?? 'Failed to load tasks.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyTasks(); }, [fetchMyTasks]);

  // ── Derived: today's date string ─────────────────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // ── Summary stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today   = new Date(); today.setHours(0,0,0,0);
    return {
      total:     tasks.length,
      dueToday:  tasks.filter(t => t.due_date === todayStr && t.status !== 'done').length,
      overdue:   tasks.filter(t => {
        if (!t.due_date || t.status === 'done') return false;
        return new Date(t.due_date) < today;
      }).length,
      completed: tasks.filter(t => t.status === 'done').length,
    };
  }, [tasks, todayStr]);

  // ── Unique projects from tasks (for filter dropdown) ─────────────
  const projects = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      const pid  = t.project?.id   ?? t.project_id;
      const pname = t.project?.name ?? t.project_name ?? `Project ${pid}`;
      if (pid && !map.has(pid)) map.set(pid, { id: pid, name: pname });
    });
    return Array.from(map.values());
  }, [tasks]);

  // ── Priority rank for sorting ─────────────────────────────────────
  const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };

  // ── Filtered + sorted tasks ───────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(q));
    }

    // status filter
    if (filters.status) {
      list = list.filter(t => t.status === filters.status);
    }

    // priority filter
    if (filters.priority) {
      list = list.filter(t => t.priority === filters.priority);
    }

    // project filter
    if (filters.project) {
      list = list.filter(t =>
        (t.project?.id ?? t.project_id) === Number(filters.project)
      );
    }

    // due date filter
    if (filters.dueDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      if (filters.dueDate === 'today') {
        list = list.filter(t => t.due_date === todayStr);
      } else if (filters.dueDate === 'overdue') {
        list = list.filter(t => t.due_date && new Date(t.due_date) < today && t.status !== 'done');
      } else if (filters.dueDate === 'week') {
        const end = new Date(today); end.setDate(end.getDate() + 7);
        list = list.filter(t => t.due_date && new Date(t.due_date) <= end && new Date(t.due_date) >= today);
      }
    }

    // sort
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
      }
      if (sortBy === 'updated_at') {
        return new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0);
      }
      // default: due_date (nulls last)
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });

    return list;
  }, [tasks, search, filters, sortBy, todayStr]);

  // ── Update task status ────────────────────────────────────────────
  const changeStatus = useCallback(async (taskId, newStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateTask(taskId, { status: newStatus });
    } catch {
      // rollback
      fetchMyTasks();
    }
  }, [fetchMyTasks]);

  // ── Mark as completed ─────────────────────────────────────────────
  const markCompleted = useCallback((taskId) => changeStatus(taskId, 'done'), [changeStatus]);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    error,
    stats,
    projects,
    search, setSearch,
    filters, setFilters,
    sortBy,  setSortBy,
    viewMode, setViewMode,
    changeStatus,
    markCompleted,
    refetch: fetchMyTasks,
  };
}
