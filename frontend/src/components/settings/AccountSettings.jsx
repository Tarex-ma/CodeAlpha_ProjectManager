// src/components/settings/AccountSettings.jsx
import React from 'react';

export default function AccountSettings() {
  return (
    <div className="p-6 bg-white bg-opacity-20 backdrop-blur-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
      <div className="space-y-4">
        <p className="text-gray-200">Account management and deletion options.</p>
        <button
          type="button"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
