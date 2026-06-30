import { useEffect, useRef } from 'react';
import { useCreateProject } from '../../hooks/useCreateProject';
import styles from './CreateProjectModal.module.css';

/**
 * EditProjectModal
 *
 * Props:
 *   open      – boolean
 *   project   – project object to edit
 *   onClose   – () => void
 *   onSubmit  – async (formData) => void
 */
export default function EditProjectModal({ open, project, onClose, onSubmit }) {
  const {
    form, handleChange, setField,
    errors, apiErr, loading,
    handleSubmit,
    COLORS = [], PRIORITIES = [],
  } = useCreateProject(onSubmit);

  const nameRef = useRef(null);

  // Populate fields when modal opens or project changes
  useEffect(() => {
    if (open && project) {
      setField('name', project.name ?? '');
      setField('description', project.description ?? '');
      setField('priority', project.priority ?? (PRIORITIES[0] || ''));
      setField('status', project.status ?? 'active');
      setField('start_date', project.start_date ?? '');
      setField('due_date', project.due_date ?? '');
      setField('color', project.color ?? (COLORS[0] || ''));
    }
  }, [open, project, setField, PRIORITIES, COLORS]);

  // Focus name input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 60);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} style={{ position: 'absolute', inset: 0 }} />

      {/* Panel */}
      <div className={styles.modalPanel} style={{ position: 'relative' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #1e2a3a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id="modal-title" style={{ fontSize: '1.375rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
            Edit Project
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', padding: '4px' }} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {apiErr && <div className={styles.apiError}>{apiErr}</div>}

            <div className={styles.fieldGroup}>
              <label htmlFor="proj-name" className={styles.label}>Project Name <span className={styles.required}>*</span></label>
              <input
                ref={nameRef}
                id="proj-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="My Awesome Project"
                maxLength={80}
                aria-invalid={!!errors.name}
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="proj-desc" className={styles.label}>Description</label>
              <textarea
                id="proj-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What is this project about?"
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.gridTwoCols}>
              <div className={styles.fieldGroup}>
                <label htmlFor="proj-priority" className={styles.label}>Priority</label>
                <select id="proj-priority" name="priority" value={form.priority} onChange={handleChange} className={styles.select}>
                  {PRIORITIES.map(p => (<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="proj-status" className={styles.label}>Status</label>
                <select id="proj-status" name="status" value={form.status} onChange={handleChange} className={styles.select}>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className={styles.gridTwoCols}>
              <div className={styles.fieldGroup}>
                <label htmlFor="proj-start" className={styles.label}>Start Date</label>
                <input id="proj-start" name="start_date" type="date" value={form.start_date} onChange={handleChange} className={styles.dateInput} />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="proj-due" className={styles.label}>Due Date</label>
                <input id="proj-due" name="due_date" type="date" value={form.due_date} onChange={handleChange} className={styles.dateInput} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Cover Color</label>
              <div className={styles.colorRow}>
                {COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setField('color', color)}
                    className={`${styles.colorCircle} ${form.color === color ? styles.colorSelected : ''}`}
                    style={{ background: color }} aria-label={`Color ${color}`} />
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={onClose} className={styles.btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} className={styles.btnCreate}>
                {loading ? (<><span className={styles.spinner} />Updating…</>) : 'Update Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
