import React, { useState } from 'react';
import useTeams from '../../hooks/useTeams';
import MemberActionsModal from './MemberActionsModal';

/**
 * Renders a table of team members with an action menu for each row.
 * The action menu provides a *Change Role* option that opens a modal.
 */
export default function MembersTable({ members }) {
  const { changeMemberRole, selectedTeam } = useTeams();
  const [modalMember, setModalMember] = useState(null);

  const openRoleModal = member => {
    setModalMember(member);
  };

  const closeModal = () => {
    setModalMember(null);
  };

  // Defensive rendering – ensure we have an array
  if (!Array.isArray(members) || members.length === 0) {
    return <p className="text-muted">No members found.</p>;
  }

  return (
    <>
      <table className="table w-full">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="p-2 text-left">Avatar</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Joined</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id} className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-2">
                <img
                  src={member.avatar || '/placeholder-avatar.png'}
                  alt={member.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </td>
              <td className="p-2 font-medium">{member.full_name}</td>
              <td className="p-2 text-sm text-gray-600 dark:text-gray-300">{member.email}</td>
              <td className="p-2">{member.role}</td>
              <td className="p-2">{member.status}</td>
              <td className="p-2 text-sm">{new Date(member.joined_at).toLocaleDateString()}</td>
              <td className="p-2 text-center">
                {/* Simple action menu – for now just Change Role */}
                <button
                  className="btn btn-sm btn-ghost"
                  title="Change role"
                  onClick={() => openRoleModal(member)}
                >
                  ⚙️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalMember && (
        <MemberActionsModal
          member={modalMember}
          onClose={closeModal}
          changeMemberRole={changeMemberRole}
        />
      )}
    </>
  );
}
