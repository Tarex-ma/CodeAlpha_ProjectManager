import { useState, forwardRef } from 'react';

/**
 * FormInput
 * Props:
 *   label     – field label string
 *   id        – input id and htmlFor
 *   type      – input type (default "text")
 *   error     – error string shown below input
 *   hint      – optional right-aligned element (e.g. "Forgot password?" link)
 *   className – extra wrapper classes
 *   ...rest   – forwarded to <input>
 */
const FormInput = forwardRef(function FormInput(
  { label, id, type = 'text', error, hint, className = '', ...rest },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword    = type === 'password';
  const resolvedType  = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[11px] font-medium text-[#888] uppercase tracking-wider"
        >
          {label}
        </label>
        {hint && <div className="text-[11px]">{hint}</div>}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={resolvedType}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            'w-full bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-[13px] text-white',
            'placeholder:text-[#444] outline-none transition-all duration-200',
            'focus:ring-1',
            isPassword ? 'pr-10' : '',
            error
              ? 'border-[#e53935] focus:border-[#e53935] focus:ring-[#e53935]/20'
              : 'border-[#2a2a2a] focus:border-[#2196f3] focus:ring-[#2196f3]/20',
          ].join(' ')}
          {...rest}
        />

        {/* Password toggle eye */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[11px] text-[#e53935] flex items-center gap-1 mt-0.5"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

export default FormInput;
