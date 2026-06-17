import { useState } from "react"

export const validators = {
  required: (value) => {
    if (value === undefined || value === null) return 'This field is required';
    if (typeof value === 'string' && value.trim() === '') return 'This field is required';
    if (typeof value === 'boolean' && !value) return 'This field is required';
    return undefined;
  },
  email: (value) => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? undefined : 'Please enter a valid email address';
  },
  minLength: (len) => (value) => {
    if (!value) return undefined;
    return value.length >= len ? undefined : `Must be at least ${len} characters`;
  },
  pattern: (regex, message) => (value) => {
    if (!value) return undefined;
    return regex.test(value) ? undefined : message;
  },
  match: (otherValue, otherFieldName) => (value) => {
    return value === otherValue ? undefined : `${otherFieldName}s do not match`;
  }
}

export const useForm = (initialValues = {}, initialRules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }))
  }

  const handleBlur = (e) => {
    // Optionally trigger field-level validation on blur.
    // For this simple form flow, manual/form-level validation suffices.
  }

  const validateAll = (rules = initialRules) => {
    const newErrors = {}
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = values[field]
      if (!fieldRules) continue

      for (const rule of fieldRules) {
        const errorMsg = rule(value)
        if (errorMsg) {
          newErrors[field] = errorMsg
          isValid = false
          break
        }
      }
    }

    setErrors(newErrors)
    return isValid
  }

  return {
    values,
    errors,
    setErrors,
    handleChange,
    handleBlur,
    setValues,
    validateAll,
    validate: validateAll,
  }
}