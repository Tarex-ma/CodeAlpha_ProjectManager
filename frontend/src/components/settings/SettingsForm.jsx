// src/components/settings/SettingsForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getUserSettings, updateUserSettings } from '../../api';

/**
 * SettingsForm is a reusable wrapper that fetches the current user settings,
 * supplies them to a render‑prop child, and handles optimistic updates.
 */
export default function SettingsForm({ children, fetchFn = getUserSettings, updateFn = updateUserSettings }) {
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load settings on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const data = await fetchFn(token);
        setSettings(data);
        setOriginalSettings(data);
      } catch (e) {
        console.error('Failed to load settings', e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [fetchFn]);

  // Local field change handler
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setSuccess(false); // Clear success message on change
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      await updateFn(token, settings);
      setOriginalSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Hide after 3 seconds
    } catch (err) {
      console.error('Failed to persist setting', err);
      setError(err);
      // Revert UI to original settings on failure
      setSettings(originalSettings);
    } finally {
      setSaving(false);
    }
  }, [settings, originalSettings, updateFn]);

  if (loading) {
    return <div className="p-6 text-gray-400">Loading settings…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Failed to load settings.</div>;
  }

  // children is expected to be a render‑prop function
  return <>{children({ settings, handleChange, handleSave, saving, success })}</>;
}
