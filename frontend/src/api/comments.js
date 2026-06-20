import axiosInstance from './axiosInstance';

// Comments CRUD (nested under tasks)
export const fetchComments = (taskId) => axiosInstance.get(`/comments/?task=${taskId}`);
export const createComment = (taskId, data) => axiosInstance.post(`/tasks/${taskId}/comments/`, data);
export const updateComment = (taskId, commentId, data) => axiosInstance.patch(`/tasks/${taskId}/comments/${commentId}/`, data);
export const deleteComment = (taskId, commentId) => axiosInstance.delete(`/tasks/${taskId}/comments/${commentId}/`);
