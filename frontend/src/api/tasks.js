import axiosInstance from './axiosInstance';

// CRUD operations
export const fetchTasks = (params = {}) => {
  if (params.project && params.board) {
    return axiosInstance.get(`/projects/${params.project}/boards/${params.board}/tasks/`, { params });
  }
  return axiosInstance.get('/tasks/', { params });
};
export const fetchTask = (id, pId, bId) => 
  (pId && bId) ? axiosInstance.get(`/projects/${pId}/boards/${bId}/tasks/${id}/`) : axiosInstance.get(`/tasks/${id}/`);

export const createTask = (data, pId, bId) => 
  (pId && bId) ? axiosInstance.post(`/projects/${pId}/boards/${bId}/tasks/`, data) : axiosInstance.post('/tasks/', data);

export const updateTask = (id, data, pId, bId) => 
  (pId && bId) ? axiosInstance.patch(`/projects/${pId}/boards/${bId}/tasks/${id}/`, data) : axiosInstance.patch(`/tasks/${id}/`, data);

export const deleteTask = (id, pId, bId) => 
  (pId && bId) ? axiosInstance.delete(`/projects/${pId}/boards/${bId}/tasks/${id}/`) : axiosInstance.delete(`/tasks/${id}/`);

// Move a task to another board/position
export const moveTask = (id, board_id, position) =>
  axiosInstance.post(`/tasks/${id}/move/`, { board_id, position });

// Reorder tasks within a board (bulk)
export const reorderTasks = (boardId, tasks) =>
  axiosInstance.post(`/boards/${boardId}/tasks/reorder/`, { tasks });

export const fetchActivity = (id) => axiosInstance.get(`/tasks/${id}/activity/`);

