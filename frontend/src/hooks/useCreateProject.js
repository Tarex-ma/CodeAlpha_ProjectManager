import { useState, useCallback } from 'react';

const COLORS = [
  '#5c6bc0', // blue-purple (selected/first)
  '#9c27b0', // purple
  '#e91e63', // pink
  '#f44336', // red-pink
  '#ff9800', // orange
  '#ffc107', // yellow
  '#4caf50', // green
  '#009688', // dark teal
  '#2196f3', // blue
  '#00bcd4', // cyan
];

const ICONS = ['🌐', '📱', '📣', '🔌', '📄', '🎯', '🚀', '💡'];

const PRIORITIES = ['low', 'medium', 'high'];

const INITIAL = {
  name:        '',
  description: '',
  color:       '#5c6bc0',
  icon:        '🌐',
  status:      'active',
  priority:    'medium',
  start_date:  '',
  due_date:    '',
};

/**
 * useCreateProject
 *
 * Manages the "Create Project" modal form state, validation,
 * and submission. Pass `onSubmit` as the API mutation.
 */
export function useCreateProject(onSubmit) {
  const [open,    setOpen]    = useState(false);
  const [form,    setForm]    = useState(INITIAL);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const openModal  = useCallback(() => { setForm(INITIAL); setErrors({}); setApiErr(''); setOpen(true);  }, []);
  const closeModal = useCallback(() => { setOpen(false); }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())             errs.name = 'Project name is required';
    if (form.name.trim().length > 80)  errs.name = 'Name must be under 80 characters';
    return errs;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setApiErr('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await onSubmit({
        title:       form.name.trim(),
        description: form.description.trim(),
        color:       form.color,
        icon:        form.icon,
        status:      form.status,
        due_date:    form.due_date || null,
      });
      closeModal();
    } catch (err) {
      setApiErr(err?.response?.data?.detail ?? 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  }, [form, onSubmit, closeModal]);

  return {
    open, openModal, closeModal,
    form, handleChange, setField,
    errors, apiErr, loading,
    handleSubmit,
    COLORS, ICONS, PRIORITIES,
  };
}