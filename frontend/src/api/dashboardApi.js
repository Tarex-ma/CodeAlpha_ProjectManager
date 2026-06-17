import api from './axiosInstance';

// ── Projects ──────────────────────────────────────────────────────
export const getProjects   = (params) => api.get('/projects/', { params });
export const createProject = (data)   => api.post('/projects/', data);
export const updateProject = (id, d)  => api.patch(`/projects/${id}/`, d);
export const deleteProject = (id)     => api.delete(`/projects/${id}/`);

// ── Tasks ─────────────────────────────────────────────────────────
export const getRecentTasks = (params) => api.get('/tasks/recent/', { params });
export const getMyTasks     = (params) => api.get('/tasks/my/', { params });

// ── Stats & Activity ──────────────────────────────────────────────
export const getDashboardStats = () => api.get('/dashboard/stats/');
export const getActivityFeed   = () => api.get('/dashboard/activity/');