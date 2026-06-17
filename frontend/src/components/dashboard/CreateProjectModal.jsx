import { useEffect, useRef } from 'react';
import { useCreateProject } from '../../hooks/useCreateProject';

/**
 * CreateProjectModal
 *
 * Props:
 *   open      – boolean
 *   onClose   – () => void
 *   onSubmit  – async (formData) => void  (from useDashboard.createProject)
 */
export default function CreateProjectModal({ open, onClose, onSubmit }) {
  const {
    form, handleChange, setField,
    errors, apiErr, loading,
    handleSubmit,
    COLORS, ICONS,
  } = useCreateProject(onSubmit);

  const nameRef = useRef(null);

  // Focus name field when modal opens
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[480px] bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/60 animate-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1e1e1e]">
          <div>
            <h2 id="modal-title" className="text-[15px] font-semibold text-white">
              Create project
            </h2>
            <p className="text-[12px] text-[#555] mt-0.5">
              Set up a new workspace for your team
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#555] hover:text-white hover:bg-[#222] transition-all"
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5">

            {/* API error */}
            {apiErr && (
              <div className="flex items-start gap-2.5 bg-[#e53935]/10 border border-[#e53935]/30 rounded-lg px-3 py-2.5 text-[12px] text-[#ef9a9a]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {apiErr}
              </div>
            )}

            {/* Icon + Color row */}
            <div className="flex gap-4">
              {/* Icon picker */}
              <div className="flex-shrink-0">
                <label className="block text-[11px] font-medium text-[#666] uppercase tracking-wider mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-1.5 w-[112px]">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setField('icon', icon)}
                      className={`w-9 h-9 rounded-lg text-lg transition-all duration-150 ${
                        form.icon === icon
                          ? 'bg-[#2196f3]/20 ring-1 ring-[#2196f3] scale-105'
                          : 'bg-[#1e1e1e] hover:bg-[#252525]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-[#666] uppercase tracking-wider mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setField('color', color)}
                      className={`w-7 h-7 rounded-full transition-all duration-150 ${
                        form.color === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-[#161616]' : 'hover:scale-105'
                      }`}
                      style={{
                        background:  color,
                        ringColor:   color,
                        outlineColor: form.color === color ? color : 'transparent',
                        outline:     form.color === color ? `2px solid ${color}` : 'none',
                        outlineOffset: form.color === color ? '2px' : '0',
                      }}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>

                {/* Preview chip */}
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: `${form.color}22`, border: `1px solid ${form.color}55` }}
                  >
                    {form.icon}
                  </div>
                  <span className="text-[11px] text-[#555]">Preview</span>
                </div>
              </div>
            </div>

            {/* Project name */}
            <div>
              <label htmlFor="proj-name" className="block text-[11px] font-medium text-[#666] uppercase tracking-wider mb-1.5">
                Project name <span className="text-[#e53935]">*</span>
              </label>
              <input
                ref={nameRef}
                id="proj-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Website Redesign"
                maxLength={80}
                aria-invalid={!!errors.name}
                className={`w-full bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-[#333] outline-none transition-all duration-200 focus:ring-1 ${
                  errors.name
                    ? 'border-[#e53935] focus:border-[#e53935] focus:ring-[#e53935]/20'
                    : 'border-[#2a2a2a] focus:border-[#2196f3] focus:ring-[#2196f3]/20'
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.name
                  ? <p className="text-[11px] text-[#e53935]">{errors.name}</p>
                  : <span />
                }
                <span className="text-[10px] text-[#444]">{form.name.length}/80</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="proj-desc" className="block text-[11px] font-medium text-[#666] uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                id="proj-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What is this project about?"
                rows={3}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-[#333] outline-none resize-none transition-all duration-200 focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]/20"
              />
            </div>

            {/* Status + Due date row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="proj-status" className="block text-[11px] font-medium text-[#666] uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  id="proj-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none transition-all duration-200 focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]/20 appearance-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="proj-due" className="block text-[11px] font-medium text-[#666] uppercase tracking-wider mb-1.5">
                  Due date
                </label>
                <input
                  id="proj-due"
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none transition-all duration-200 focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]/20 [color-scheme:dark]"
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1e1e1e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-[#888] hover:text-white bg-transparent hover:bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-[13px] font-medium text-white bg-[#2196f3] hover:bg-[#1976d2] active:scale-[0.98] rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}