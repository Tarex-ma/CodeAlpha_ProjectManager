import { useState, useEffect, useCallback } from 'react';
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
} from '../api/comments';

export default function useComments(taskId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      // In the backend, comments are accessible via /api/v1/comments/ if registered generally,
      // or via the nested router /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/
      // Wait, since the user fetches the task details they could get the comments directly.
      // But let's assume we use the global /comments/ endpoint if it exists, or pass the full nested url.
      // For now, let's assume `fetchComments` works.
      const res = await fetchComments(taskId);
      setComments(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = async (data) => {
    setLoading(true);
    try {
      const res = await createComment(taskId, data);
      setComments((prev) => [res.data, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const editComment = async (id, data) => {
    setLoading(true);
    try {
      const res = await updateComment(taskId, id, data);
      setComments((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    } finally {
      setLoading(false);
    }
  };

  const removeComment = async (id) => {
    setLoading(true);
    try {
      await deleteComment(taskId, id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    editComment,
    removeComment,
  };
}
