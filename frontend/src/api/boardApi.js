import api from './axiosInstance';

// ── Columns ───────────────────────────────────────────────────────
export const getColumns   = (projectId)       => api.get(`/projects/${projectId}/boards/`);
export const createColumn = (projectId, data) => api.post(`/projects/${projectId}/boards/`, data);
export const updateColumn = (id, data)        => api.patch(`/boards/${id}/`, data);
export const deleteColumn = (id)              => api.delete(`/boards/${id}/`);
export const reorderColumns = (projectId, data) => api.post(`/projects/${projectId}/boards/reorder/`, data);

// ── Tasks ─────────────────────────────────────────────────────────
export const getTasks     = (boardId)        => api.get(`/boards/${boardId}/tasks/`);
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