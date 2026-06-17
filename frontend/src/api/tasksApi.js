import axiosInstance from "./axiosInstance";

export const createTask = async (data) => {
  const response = await axiosInstance.post("/tasks/", data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await axiosInstance.put(`/tasks/${id}/`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await axiosInstance.delete(`/tasks/${id}/`);
  return response.data;
};

export const moveTask = async (id, columnId, index) => {
  const response = await axiosInstance.patch(`/tasks/${id}/move/`, {
    columnId,
    index,
  });

  return response.data;
};