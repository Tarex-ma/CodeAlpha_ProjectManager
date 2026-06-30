// src/components/settings/FormField.jsx
import React from 'react';

/**
 * Simple reusable form field component with label and input.
 * Supports custom type (text, email, password, etc.) and passes all
 * remaining props to the underlying <input> element.
 */
export default function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  ...rest
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-200 mb-1"
      >
        {label}
      </label>
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="w-full rounded-md border border-gray-600 bg-gray-800 bg-opacity-60 text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3 py-2"
          {...rest}
        >
          {rest.options && rest.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={!!value}
          onChange={onChange}
          className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 h-5 w-5"
          {...rest}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-600 bg-gray-800 bg-opacity-60 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3 py-2"
          {...rest}
        />
      )}
    </div>
  );
}
