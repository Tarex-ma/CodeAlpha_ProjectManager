/**
 * AlertBanner
 * Props:
 *   message – string to display (renders nothing when falsy)
 *   type    – "error" | "success" | "info"
 *   onClose – optional dismiss handler
 */
export default function AlertBanner({ message, type = 'error', onClose }) {
  if (!message) return null;

  const styles = {
    error:   'bg-[#e53935]/10 border-[#e53935]/30 text-[#ef9a9a]',
    success: 'bg-[#4caf50]/10 border-[#4caf50]/30 text-[#a5d6a7]',
    info:    'bg-[#2196f3]/10 border-[#2196f3]/30 text-[#90caf9]',
  };

  const icons = {
    error: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    success: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    info: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 border rounded-lg px-3 py-2.5 text-[12px] leading-relaxed mb-4 ${styles[type]}`}
    >
      <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
