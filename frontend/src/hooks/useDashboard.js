import { useState, useEffect, useCallback } from 'react';
import {
  getProjects,
  getRecentTasks,
  getDashboardStats,
  getActivityFeed,
  createProject as apiCreateProject,
  deleteProject as apiDeleteProject,
} from '../api/dashboardApi';

/**
 * useDashboard
 *
 * Central data hook for the Dashboard page.
 * Returns projects, recent tasks, stats, activity feed,
 * loading/error states, and mutation helpers.
 */
export function useDashboard() {
  const [projects,      setProjects]      = useState([]);
  const [recentTasks,   setRecentTasks]   = useState([]);
  const [stats,         setStats]         = useState(null);
  const [activity,      setActivity]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // ── Initial fetch (all in parallel) ─────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, taskRes, statsRes, actRes] = await Promise.all([
        getProjects(),
        getRecentTasks({ limit: 8 }),
        getDashboardStats(),
        getActivityFeed(),
      ]);
      setProjects(projRes.data?.results   ?? projRes.data   ?? []);
      setRecentTasks(taskRes.data?.results ?? taskRes.data  ?? []);
      setStats(statsRes.data ?? null);
      setActivity(actRes.data?.results    ?? actRes.data    ?? []);
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create project ───────────────────────────────────────────
  const createProject = useCallback(async (formData) => {
    const { data } = await apiCreateProject(formData);
    setProjects((prev) => [data, ...prev]);
    return data;
  }, []);

  // ── Delete project (optimistic) ──────────────────────────────
  const deleteProject = useCallback(async (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiDeleteProject(id);
    } catch {
      // rollback handled by re-fetching
      fetchAll();
    }
  }, [fetchAll]);

  return {
    projects,
    recentTasks,
    stats,
    activity,
    loading,
    error,
    refetch: fetchAll,
    createProject,
    deleteProject,
  };
}