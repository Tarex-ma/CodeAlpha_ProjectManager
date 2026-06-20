import React, { useState } from 'react';
import TaskForm from './TaskForm';
import axiosInstance from '../../api/axiosInstance';

export default function TaskModal({ task, onClose, refresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`/projects/${task.project}/boards/${task.board}/tasks/${task.id}/`);
      refresh();
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      const url = task.id
        ? `/projects/${task.project}/boards/${task.board}/tasks/${task.id}/`
        : `/projects/${task.project}/boards/${task.board}/tasks/`;
      const method = task.id ? 'patch' : 'post';
      await axiosInstance[method](url, data);
      refresh();
      setIsEditing(false);
      if (!task.id) onClose();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
          onClick={onClose}
        >
          ✕
        </button>
        {error && (
          <div className="mb-2 text-red-500 text-sm" role="alert">
            {error}
          </div>
        )}
        {isEditing ? (
          <TaskForm
            initialData={task}
            onCancel={() => setIsEditing(false)}
            onSubmit={handleSave}
            loading={loading}
          />
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">{task.title}</h2>
            <p className="text-gray-300">{task.description}</p>
            <div className="flex justify-between items-center">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}