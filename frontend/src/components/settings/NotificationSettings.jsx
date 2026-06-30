// src/components/settings/NotificationSettings.jsx
import React from 'react';
import SettingsForm from './SettingsForm';
import FormField from './FormField';

export default function NotificationSettings() {
  return (
    <div className="p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Notification Settings</h2>
      <SettingsForm>
        {({ settings, handleChange, handleSave, saving, success }) => {
          const notifications = settings.notifications || {};
          
          const handleNotificationChange = (e) => {
            const { name, checked } = e.target;
            handleChange({
              target: {
                name: 'notifications',
                value: { ...notifications, [name]: checked }
              }
            });
          };

          return (
            <>
              <div className="space-y-4">
                <FormField
                  label="Email Notifications"
                  name="email_notifications"
                  type="checkbox"
                  value={notifications.email_notifications}
                  onChange={handleNotificationChange}
                />
                <FormField
                  label="Push Notifications"
                  name="push_notifications"
                  type="checkbox"
                  value={notifications.push_notifications}
                  onChange={handleNotificationChange}
                />
                <FormField
                  label="Task Updates"
                  name="task_updates"
                  type="checkbox"
                  value={notifications.task_updates}
                  onChange={handleNotificationChange}
                />
                <FormField
                  label="Project Updates"
                  name="project_updates"
                  type="checkbox"
                  value={notifications.project_updates}
                  onChange={handleNotificationChange}
                />
              </div>

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
          );
        }}
      </SettingsForm>
    </div>
  );
}
