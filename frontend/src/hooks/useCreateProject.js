import { useState, useCallback } from 'react';

const COLORS = [
  '#7c5cbf', // purple
  '#2196f3', // blue
  '#4caf50', // green
  '#ff9800', // orange
  '#e91e63', // pink
  '#00bcd4', // cyan
  '#f44336', // red
  '#9c27b0', // violet
];

const ICONS = ['🌐', '📱', '📣', '🔌', '📄', '🎯', '🚀', '💡'];

const INITIAL = {
  name:        '',
  description: '',
  color:       COLORS[0],
  icon:        ICONS[0],
  status:      'active',
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
        name:        form.name.trim(),
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
    COLORS, ICONS,
  };
}