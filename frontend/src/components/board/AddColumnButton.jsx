import { useState, useRef } from 'react';

/**
 * AddColumnButton
 *
 * Inline form that expands to a text input when clicked.
 *
 * Props:
 *   onAdd – async (title: string) => void
 */
export default function AddColumnButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const handleClose = () => {
    setOpen(false);
    setTitle('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const val = title.trim();
    if (!val) return;
    setLoading(true);
    try {
      await onAdd(val);
      handleClose();
    } catch {
      // let the parent handle error toasts
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 w-[280px] flex-shrink-0 px-4 py-3 bg-[#111] border border-dashed border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#141414] rounded-xl text-[12px] text-[#444] hover:text-[#777] transition-all snap-start"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add column
      </button>
    );
  }

  return (
    <div className="w-[280px] flex-shrink-0 bg-[#161616] border border-[#252525] rounded-xl p-3 snap-start">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && handleClose()}
          placeholder="Column name…"
          className="w-full bg-[#1a1a1a] border border-[#252525] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-[#333] outline-none focus:border-[#2196f3] mb-2.5"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="flex-1 py-2 text-[12px] font-medium text-white bg-[#2196f3] hover:bg-[#1976d2] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {loading
              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Add column'
            }
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-2 text-[12px] text-[#666] hover:text-white bg-transparent hover:bg-[#1e1e1e] border border-[#252525] rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}