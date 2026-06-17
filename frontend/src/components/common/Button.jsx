/**
 * Button
 * Props:
 *   variant   – "primary" | "ghost" | "danger"
 *   loading   – shows spinner and disables the button
 *   fullWidth – applies w-full
 *   size      – "sm" | "md" (default)
 *   ...rest   – forwarded to <button>
 */
export default function Button({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  size = 'md',
  className = '',
  disabled,
  icon,
  ...rest
}) {
  const base = [
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
    'transition-all duration-200 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    fullWidth ? 'w-full' : '',
    size === 'sm' ? 'text-[12px] px-3 py-1.5' : 'text-[13px] px-4 py-2.5',
    loading || disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
  ].join(' ');

  const variants = {
    primary: 'bg-[#2196f3] text-white hover:bg-[#1976d2] active:scale-[0.98] focus-visible:ring-[#2196f3]',
    ghost: 'bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400',
    danger: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 focus-visible:ring-red-500',
    social: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] focus-visible:ring-[#2196f3]',
  };

  return (
    <button
      className={`${base} ${variants[variant] || ''} ${className}`}
      disabled={loading || disabled}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          <span>Loading…</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0 flex items-center">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
