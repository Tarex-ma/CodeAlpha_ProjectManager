// src/components/settings/LanguageRegionSettings.jsx
import React from 'react';
import SettingsForm from './SettingsForm';
import FormField from './FormField';

export default function LanguageRegionSettings() {
  return (
    <div className="p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Language & Region Settings</h2>
      <SettingsForm>
        {({ settings, handleChange, handleSave, saving, success }) => (
          <>
            <FormField
              label="Language"
              name="language"
              type="select"
              value={settings.language}
              onChange={handleChange}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
              ]}
            />
            <FormField
              label="Timezone"
              name="timezone"
              type="select"
              value={settings.timezone}
              onChange={handleChange}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
                { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
                { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
                { value: 'Europe/London', label: 'London' },
                { value: 'Europe/Paris', label: 'Paris' },
                { value: 'Asia/Tokyo', label: 'Tokyo' },
              ]}
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
