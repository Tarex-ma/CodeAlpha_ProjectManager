import React from "react"

const InputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  error,
  disabled,
  autoComplete,
  rightLabel
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <div className="flex justify-between items-center">
        {label && (
          <label htmlFor={name} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider select-none">
            {label}
          </label>
        )}
        {rightLabel}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`block w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2196f3] focus:border-[#2196f3] transition-all ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      />
      {error && <span className="text-xs text-red-500 mt-1 font-medium">{error}</span>}
    </div>
  )
}

export default InputField