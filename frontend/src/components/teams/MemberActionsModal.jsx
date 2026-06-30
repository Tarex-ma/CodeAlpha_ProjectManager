import React, { useState } from 'react';
import ReactDOM from 'react-dom';

// Simple reusable modal component for member actions (e.g., change role)
// Props:
// - member: the member object (contains id, role, etc.)
// - onClose: function to close the modal
// - changeMemberRole: function from useTeams hook to update role on the server
export default function MemberActionsModal({ member, onClose, changeMemberRole }) {
  const [newRole, setNewRole] = useState(member?.role || 'member');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member) return;
    try {
      await changeMemberRole(member.id, newRole);
    } catch (err) {
      console.error('Failed to change role', err);
    }
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b border-[#1e1e1e]">
          <h2 className="text-base font-bold text-white">Member Actions</h2>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-[#aaa] mb-1">Current Role</label>
            <p className="text-white">{member?.role}</p>
          </div>
          <div>
            <label className="block text-sm text-[#aaa] mb-1" htmlFor="newRole">New Role</label>
            <select
              id="newRole"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full bg-[#161616] border border-[#222] focus:border-[#333] text-white rounded-lg p-2"
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#2a2a2a] text-sm text-[#888] rounded-lg hover:bg-[#1a1a1a] transition-all">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-[#2196f3] text-sm font-medium text-white rounded-lg hover:bg-[#1976d2] transition-all">Save</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
