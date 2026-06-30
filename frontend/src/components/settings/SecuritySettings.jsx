// src/components/settings/SecuritySettings.jsx
import React, { useState } from 'react';
import FormField from './FormField';
import axios from 'axios';

export default function SecuritySettings() {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1/'}auth/change-password/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setFormData({ old_password: '', new_password: '', confirm_new_password: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
      
      <div className="space-y-4">
        <FormField
          label="Current Password"
          name="old_password"
          type="password"
          value={formData.old_password}
          onChange={handleChange}
        />
        <FormField
          label="New Password"
          name="new_password"
          type="password"
          value={formData.new_password}
          onChange={handleChange}
        />
        <FormField
          label="Confirm New Password"
          name="confirm_new_password"
          type="password"
          value={formData.confirm_new_password}
          onChange={handleChange}
        />
      </div>

      {error && <div className="mt-4 text-red-400 font-medium">{error}</div>}

      <div className="mt-6 flex justify-end items-center space-x-4">
        {success && (
          <span className="text-green-500 font-medium animate-pulse">
            Password updated successfully!
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !formData.old_password || !formData.new_password || formData.new_password !== formData.confirm_new_password}
          className={`px-4 py-2 rounded-lg font-medium text-white transition-colors duration-200 ${
            saving || !formData.old_password || !formData.new_password || formData.new_password !== formData.confirm_new_password
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
