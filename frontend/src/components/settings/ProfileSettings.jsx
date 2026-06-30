import React from 'react';
import SettingsForm from './SettingsForm';
import FormField from './FormField';
import { getUserProfile, updateUserProfile } from '../../api';

export default function ProfileSettings() {
  return (
    <div className="p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
      <SettingsForm fetchFn={getUserProfile} updateFn={updateUserProfile}>
        {({ settings, handleChange, handleSave, saving, success }) => (
          <>
            <FormField
              label="First Name"
              name="first_name"
              value={settings.first_name}
              onChange={handleChange}
            />
            <FormField
              label="Last Name"
              name="last_name"
              value={settings.last_name}
              onChange={handleChange}
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={settings.email}
              onChange={handleChange}
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
