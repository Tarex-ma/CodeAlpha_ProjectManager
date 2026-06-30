// src/components/settings/PreferencesSettings.jsx
import React from 'react';
import SettingsForm from './SettingsForm';
import FormField from './FormField';

export default function PreferencesSettings() {
  return (
    <div className="p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
      <SettingsForm>
        {({ settings, handleChange, handleSave, saving, success }) => (
          <>
            <FormField
              label="Default Dashboard"
              name="default_dashboard"
              type="select"
              value={settings.default_dashboard}
              onChange={handleChange}
              options={[
                { value: 'projects', label: 'Projects' },
                { value: 'tasks', label: 'Tasks' },
                { value: 'calendar', label: 'Calendar' },
              ]}
            />
            <FormField
              label="Default Calendar View"
              name="default_calendar_view"
              type="select"
              value={settings.default_calendar_view}
              onChange={handleChange}
              options={[
                { value: 'month', label: 'Month' },
                { value: 'week', label: 'Week' },
                { value: 'day', label: 'Day' },
              ]}
            />
            <FormField
              label="Task Sorting"
              name="task_sorting"
              type="select"
              value={settings.task_sorting}
              onChange={handleChange}
              options={[
                { value: 'priority', label: 'Priority' },
                { value: 'due_date', label: 'Due Date' },
                { value: 'created_at', label: 'Created Date' },
              ]}
            />
            <FormField
              label="Project Sorting"
              name="project_sorting"
              type="select"
              value={settings.project_sorting}
              onChange={handleChange}
              options={[
                { value: 'name', label: 'Name' },
                { value: 'created_at', label: 'Created Date' },
                { value: 'updated_at', label: 'Last Updated' },
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
