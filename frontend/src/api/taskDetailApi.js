import api from './axiosInstance';

// ── Task ──────────────────────────────────────────────────────────
export const getTask    = (id)       => api.get(`/tasks/${id}/`);
export const updateTask = (id, data) => api.patch(`/tasks/${id}/`, data);
export const deleteTask = (id)       => api.delete(`/tasks/${id}/`);

// ── Comments ──────────────────────────────────────────────────────
export const getComments    = (taskId)           => api.get(`/tasks/${taskId}/comments/`);
export const createComment  = (taskId, data)     => api.post(`/tasks/${taskId}/comments/`, data);
export const updateComment  = (commentId, data)  => api.patch(`/comments/${commentId}/`, data);
export const deleteComment  = (commentId)        => api.delete(`/comments/${commentId}/`);

// ── Checklist ─────────────────────────────────────────────────────
export const createChecklistItem = (taskId, data)  => api.post(`/tasks/${taskId}/checklist/`, data);
export const updateChecklistItem = (itemId, data)  => api.patch(`/checklist/${itemId}/`, data);
export const deleteChecklistItem = (itemId)        => api.delete(`/checklist/${itemId}/`);

// ── Attachments ───────────────────────────────────────────────────
export const getAttachments    = (taskId)      => api.get(`/tasks/${taskId}/attachments/`);
export const uploadAttachment  = (taskId, formData) =>
  api.post(`/tasks/${taskId}/attachments/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteAttachment  = (attachmentId) => api.delete(`/attachments/${attachmentId}/`);