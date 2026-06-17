import { useState, useEffect, useCallback } from 'react';
import {
  getTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask,
  getComments, createComment as apiCreateComment,
  updateComment as apiUpdateComment, deleteComment as apiDeleteComment,
  createChecklistItem as apiCreateChecklistItem,
  updateChecklistItem as apiUpdateChecklistItem,
  deleteChecklistItem as apiDeleteChecklistItem,
} from '../api/taskDetailApi';

/**
 * useTaskDetail
 *
 * Central hook for the Task Detail Modal.
 * Manages: task data, inline editing, comments (CRUD), checklist (CRUD).
 *
 * @param {string|number|null} taskId  – null means modal is closed
 * @param {{ onTaskUpdated, onTaskDeleted }} callbacks
 */
export function useTaskDetail(taskId, { onTaskUpdated, onTaskDeleted } = {}) {
  // ── Task state ─────────────────────────────────────────────────
  const [task,        setTask]        = useState(null);
  const [comments,    setComments]    = useState([]);
  const [loadingTask, setLoadingTask] = useState(false);
  const [loadingCmts, setLoadingCmts] = useState(false);
  const [error,       setError]       = useState(null);

  // ── Inline edit state ──────────────────────────────────────────
  const [editingField, setEditingField] = useState(null); // 'title' | 'description' | null
  const [fieldValue,   setFieldValue]   = useState('');
  const [savingField,  setSavingField]  = useState(false);

  // ── Comment compose state ──────────────────────────────────────
  const [commentText,    setCommentText]    = useState('');
  const [submittingCmt,  setSubmittingCmt]  = useState(false);
  const [editingCmtId,   setEditingCmtId]   = useState(null);
  const [editingCmtText, setEditingCmtText] = useState('');
  const [savingCmt,      setSavingCmt]      = useState(false);

  // ── Checklist state ────────────────────────────────────────────
  const [newCheckItem,   setNewCheckItem]   = useState('');
  const [addingCheck,    setAddingCheck]    = useState(false);

  // ── Fetch task + comments ──────────────────────────────────────
  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoadingTask(true);
    setError(null);
    try {
      const { data } = await getTask(taskId);
      setTask(data);
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to load task.');
    } finally {
      setLoadingTask(false);
    }
  }, [taskId]);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoadingCmts(true);
    try {
      const { data } = await getComments(taskId);
      setComments(data?.results ?? data ?? []);
    } catch {
      // non-fatal
    } finally {
      setLoadingCmts(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchComments();
    } else {
      setTask(null);
      setComments([]);
      setEditingField(null);
      setCommentText('');
    }
  }, [taskId, fetchTask, fetchComments]);

  // ── Inline field editing ───────────────────────────────────────
  const startEditField = useCallback((field) => {
    setEditingField(field);
    setFieldValue(task?.[field] ?? '');
  }, [task]);

  const cancelEditField = useCallback(() => {
    setEditingField(null);
    setFieldValue('');
  }, []);

  const saveField = useCallback(async (field) => {
    if (!task) return;
    const trimmed = fieldValue.trim();
    if (field === 'title' && !trimmed) return;
    if (trimmed === (task[field] ?? '')) { cancelEditField(); return; }

    setSavingField(true);
    try {
      const { data } = await apiUpdateTask(task.id, { [field]: trimmed });
      setTask((prev) => ({ ...prev, ...data }));
      onTaskUpdated?.({ ...task, [field]: trimmed });
    } catch {
      // revert silently
    } finally {
      setSavingField(false);
      setEditingField(null);
    }
  }, [task, fieldValue, cancelEditField, onTaskUpdated]);

  const updateField = useCallback(async (field, value) => {
    if (!task) return;
    setTask((prev) => ({ ...prev, [field]: value })); // optimistic
    try {
      const { data } = await apiUpdateTask(task.id, { [field]: value });
      setTask((prev) => ({ ...prev, ...data }));
      onTaskUpdated?.({ ...task, [field]: value });
    } catch {
      setTask((prev) => ({ ...prev, [field]: task[field] })); // rollback
    }
  }, [task, onTaskUpdated]);

  // ── Delete task ────────────────────────────────────────────────
  const deleteTask = useCallback(async () => {
    if (!task) return;
    try {
      await apiDeleteTask(task.id);
      onTaskDeleted?.(task.id);
    } catch {
      // let parent handle
    }
  }, [task, onTaskDeleted]);

  // ── Comment: create ────────────────────────────────────────────
  const submitComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !taskId) return;
    setSubmittingCmt(true);
    try {
      const { data } = await apiCreateComment(taskId, { body: text });
      setComments((prev) => [...prev, data]);
      setCommentText('');
    } catch {
      // non-fatal
    } finally {
      setSubmittingCmt(false);
    }
  }, [commentText, taskId]);

  // ── Comment: edit ──────────────────────────────────────────────
  const startEditComment = useCallback((comment) => {
    setEditingCmtId(comment.id);
    setEditingCmtText(comment.body);
  }, []);

  const cancelEditComment = useCallback(() => {
    setEditingCmtId(null);
    setEditingCmtText('');
  }, []);

  const saveComment = useCallback(async (commentId) => {
    const text = editingCmtText.trim();
    if (!text) return;
    setSavingCmt(true);
    try {
      const { data } = await apiUpdateComment(commentId, { body: text });
      setComments((prev) => prev.map((c) => (c.id === commentId ? data : c)));
      setEditingCmtId(null);
    } catch {
      // revert
    } finally {
      setSavingCmt(false);
    }
  }, [editingCmtText]);

  // ── Comment: delete ────────────────────────────────────────────
  const deleteComment = useCallback(async (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId)); // optimistic
    try {
      await apiDeleteComment(commentId);
    } catch {
      fetchComments(); // rollback
    }
  }, [fetchComments]);

  // ── Checklist: toggle ──────────────────────────────────────────
  const toggleCheckItem = useCallback(async (itemId, done) => {
    setTask((prev) => ({
      ...prev,
      checklist: prev.checklist.map((i) => (i.id === itemId ? { ...i, done } : i)),
    }));
    try {
      await apiUpdateChecklistItem(itemId, { done });
    } catch {
      fetchTask();
    }
  }, [fetchTask]);

  // ── Checklist: add ─────────────────────────────────────────────
  const addCheckItem = useCallback(async () => {
    const text = newCheckItem.trim();
    if (!text || !taskId) return;
    setAddingCheck(true);
    try {
      const { data } = await apiCreateChecklistItem(taskId, { title: text });
      setTask((prev) => ({ ...prev, checklist: [...(prev.checklist ?? []), data] }));
      setNewCheckItem('');
    } catch {
      // non-fatal
    } finally {
      setAddingCheck(false);
    }
  }, [newCheckItem, taskId]);

  // ── Checklist: delete ──────────────────────────────────────────
  const deleteCheckItem = useCallback(async (itemId) => {
    setTask((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((i) => i.id !== itemId),
    }));
    try {
      await apiDeleteChecklistItem(itemId);
    } catch {
      fetchTask();
    }
  }, [fetchTask]);

  // ── Computed ───────────────────────────────────────────────────
  const checklist    = task?.checklist ?? [];
  const doneCount    = checklist.filter((i) => i.done).length;
  const checklistPct = checklist.length > 0
    ? Math.round((doneCount / checklist.length) * 100)
    : 0;

  return {
    task, comments, loadingTask, loadingCmts, error,
    // field editing
    editingField, fieldValue, setFieldValue, savingField,
    startEditField, cancelEditField, saveField,
    updateField, deleteTask,
    // comments
    commentText, setCommentText, submittingCmt, submitComment,
    editingCmtId, editingCmtText, setEditingCmtText, savingCmt,
    startEditComment, cancelEditComment, saveComment, deleteComment,
    // checklist
    checklist, doneCount, checklistPct,
    newCheckItem, setNewCheckItem, addingCheck,
    addCheckItem, toggleCheckItem, deleteCheckItem,
    // refresh
    refetch: fetchTask,
  };
}