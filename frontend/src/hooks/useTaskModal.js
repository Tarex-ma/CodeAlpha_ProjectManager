import { useState, useCallback } from 'react';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

const EMPTY_FORM = {
  title:       '',
  description: '',
  priority:    'medium',
  due_date:    '',
  labels:      [],
  assignee:    '',
};

/**
 * useTaskModal
 *
 * Manages state for both Create and Edit task modals.
 *
 * @param {{ onCreate, onUpdate, onDelete }} handlers
 */
export function useTaskModal({ onCreate, onUpdate, onDelete }) {
  const [mode,     setMode]     = useState(null);  // 'create' | 'edit' | null
  const [columnId, setColumnId] = useState(null);
  const [task,     setTask]     = useState(null);  // task being edited
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiErr,   setApiErr]   = useState('');

  const isOpen      = mode !== null;
  const isEditMode  = mode === 'edit';
  const isCreateMode = mode === 'create';

  // ── Open handlers ──────────────────────────────────────────────
  const openCreate = useCallback((colId) => {
    setColumnId(colId);
    setTask(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setApiErr('');
    setMode('create');
  }, []);

  const openEdit = useCallback((taskObj) => {
    setTask(taskObj);
    setColumnId(taskObj.column);
    setForm({
      title:       taskObj.title       ?? '',
      description: taskObj.description ?? '',
      priority:    taskObj.priority    ?? 'medium',
      due_date:    taskObj.due_date    ?? '',
      labels:      taskObj.labels      ?? [],
      assignee:    taskObj.assignee    ?? '',
    });
    setErrors({});
    setApiErr('');
    setMode('edit');
  }, []);

  const close = useCallback(() => {
    setMode(null);
    setTask(null);
  }, []);

  // ── Form handlers ──────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, [errors]);

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleLabel = useCallback((label) => {
    setForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter((l) => l !== label)
        : [...prev.labels, label],
    }));
  }, []);

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim())            errs.title = 'Task title is required';
    if (form.title.trim().length > 120) errs.title = 'Title must be under 120 characters';
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    setApiErr('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        due_date:    form.due_date || null,
        labels:      form.labels,
        assignee:    form.assignee || null,
      };

      if (isEditMode) {
        await onUpdate(task.id, payload);
      } else {
        await onCreate(columnId, payload);
      }
      close();
    } catch (err) {
      setApiErr(err?.response?.data?.detail ?? 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  }, [form, mode, task, columnId, onCreate, onUpdate, close]);

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!task) return;
    setLoading(true);
    try {
      await onDelete(task.id);
      close();
    } catch {
      setApiErr('Failed to delete task.');
    } finally {
      setLoading(false);
    }
  }, [task, onDelete, close]);

  return {
    isOpen, isEditMode, isCreateMode,
    mode, task, columnId,
    form, errors, apiErr, loading,
    PRIORITY_OPTIONS,
    openCreate, openEdit, close,
    handleChange, setField, toggleLabel,
    handleSubmit, handleDelete,
  };
}