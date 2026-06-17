/** Returns an error string or undefined */
export const validateEmail = (value) => {
  if (!value) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
};



export const validatePasswordMatch = (password, confirm) => {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
};

export const validateName = (value, label = 'This field') => {
  if (!value || !value.trim()) return `${label} is required`;
  if (value.trim().length < 2) return `${label} must be at least 2 characters`;
};

/**
 * Run a map of field validators and return { field: errorString }.
 * Usage:
 *   const errors = runValidations({
 *     email:    () => validateEmail(form.email),
 *     password: () => validatePassword(form.password),
 *   });
 */
export const runValidations = (rules) => {
  const errors = {};
  for (const [field, validator] of Object.entries(rules)) {
    const error = validator();
    if (error) errors[field] = error;
  }
  return errors;
};

/**
 * Extract a human-readable message from an Axios error.
 * Handles: network errors, DRF detail, non_field_errors, field errors.
 */
export const parseApiError = (error) => {
  if (!error.response) {
    return 'Network error — please check your connection.';
  }
  const data = error.response.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors) return data.non_field_errors.join(' ');
  const fieldErrors = Object.entries(data)
    .map(([field, msgs]) => {
      const msg = Array.isArray(msgs) ? msgs.join(' ') : msgs;
      return `${field}: ${msg}`;
    })
    .join(' · ');
  return fieldErrors || 'Something went wrong. Please try again.';
};
