import api from './axiosInstance';

// ── Columns ───────────────────────────────────────────────────────
export const getColumns   = (projectId)       => api.get(`/projects/${projectId}/columns/`);
export const createColumn = (projectId, data) => api.post(`/projects/${projectId}/columns/`, data);
export const updateColumn = (id, data)        => api.patch(`/columns/${id}/`, data);
export const deleteColumn = (id)              => api.delete(`/columns/${id}/`);
export const reorderColumns = (projectId, data) => api.post(`/projects/${projectId}/columns/reorder/`, data);

// ── Tasks ─────────────────────────────────────────────────────────
export const getTasks     = (columnId)        => api.get(`/columns/${columnId}/tasks/`);
export const getTask      = (id)              => api.get(`/tasks/${id}/`);
export const createTask   = (data)            => api.post('/tasks/', data);
export const updateTask   = (id, data)        => api.patch(`/tasks/${id}/`, data);
export const deleteTask   = (id)              => api.delete(`/tasks/${id}/`);

/**
 * Move a task to a different column and/or position.
 * Django expects: { column: newColumnId, order: newIndex }
 */
export const moveTask = (id, data) => api.patch(`/tasks/${id}/move/`, data);

// ── Board (fetch everything at once) ──────────────────────────────
export const getBoardData = (projectId) => api.get(`/projects/${projectId}/board/`);