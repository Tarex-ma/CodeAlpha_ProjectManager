// src/components/settings/AppearanceSettings.jsx
import React from 'react';
import SettingsForm from './SettingsForm';
import FormField from './FormField';

export default function AppearanceSettings() {
  return (
    <div className="p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Appearance Settings</h2>
      <SettingsForm>
        {({ settings, handleChange, handleSave, saving, success }) => (
          <>
            <FormField
              label="Theme"
              name="theme"
              type="select"
              value={settings.theme}
              onChange={handleChange}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System Default' },
              ]}
            />
            <FormField
              label="Accent Color"
              name="accent_color"
              type="color"
              value={settings.accent_color}
              onChange={handleChange}
              className="w-16 h-10 rounded cursor-pointer border border-gray-600 bg-transparent p-1"
            />
            
            <div className="mt-6 flex justify-end items-center space-x-4">
              {success && (
                <span className="text-green-500 font-medium animate-pulse">
                  Saved successfully!
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors duration-200 ${
                  saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? 'Updating...' : 'Update'}
              </button>
            </div>
          </>
        )}
      </SettingsForm>
    </div>
  );
}
