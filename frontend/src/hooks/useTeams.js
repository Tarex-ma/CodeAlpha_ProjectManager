import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'sonner';

export default function useTeams() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all user's teams
  const fetchTeams = useCallback(async (selectId = null) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get('/teams/');
      setTeams(data.results || []);
      if ((data.results || []).length > 0) {
        // If a selectId is specified, try to find it, otherwise default to first team
        const nextTeam = selectId ? (data.results || []).find(t => t.id === selectId) || (data.results || [])[0] : (data.results || [])[0];
        setSelectedTeam(nextTeam);
      } else {
        setSelectedTeam(null);
      }
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to load teams.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch details of selected team (members, projects, invitations, activities)
  const fetchTeamDetails = useCallback(async (teamId) => {
    if (!teamId) return;
    setLoadingDetails(true);
    try {
      const [mRes, iRes, pRes, aRes] = await Promise.all([
        axiosInstance.get(`/teams/${teamId}/members/`),
        axiosInstance.get(`/teams/${teamId}/invitations/`),
        axiosInstance.get(`/teams/${teamId}/projects/`),
        axiosInstance.get(`/teams/${teamId}/activities/`),
      ]);
      setMembers(mRes.data);
      setInvitations(iRes.data);
      setProjects(pRes.data);
      setActivities(aRes.data);
    } catch (err) {
      toast.error('Failed to load team details.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Automatically fetch details when selectedTeam changes
  useEffect(() => {
    if (selectedTeam?.id) {
      fetchTeamDetails(selectedTeam.id);
    } else {
      setMembers([]);
      setInvitations([]);
      setProjects([]);
      setActivities([]);
    }
  }, [selectedTeam?.id, fetchTeamDetails]);

  // Initial load
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Create team
  const createTeam = async (name, description, logoFile = null) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const { data } = await axiosInstance.post('/teams/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Team created successfully!');
      await fetchTeams(data.id);
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to create team.');
      throw err;
    }
  };

  // Update team
  const updateTeam = async (teamId, name, description, logoFile = null) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const { data } = await axiosInstance.patch(`/teams/${teamId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Team settings updated!');
      // Update local team state
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...data } : t));
      setSelectedTeam(prev => prev?.id === teamId ? { ...prev, ...data } : prev);
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to update team.');
      throw err;
    }
  };

  // Delete team
  const deleteTeam = async (teamId) => {
    try {
      await axiosInstance.delete(`/teams/${teamId}/`);
      toast.success('Team deleted.');
      await fetchTeams();
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to delete team.');
      throw err;
    }
  };

  // Invite member
  const inviteMember = async (email, role) => {
    if (!selectedTeam) return;
    try {
      const { data } = await axiosInstance.post(`/teams/${selectedTeam.id}/invite/`, { email, role });
      toast.success(`Invitation sent to ${email}!`);
      // Refresh invitations list & activities
      fetchTeamDetails(selectedTeam.id);
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to send invitation.');
      throw err;
    }
  };

  // Resend invitation
  const resendInvitation = async (invitationId) => {
    if (!selectedTeam) return;
    try {
      await axiosInstance.post(`/teams/${selectedTeam.id}/resend-invitation/`, { invitation_id: invitationId });
      toast.success('Invitation resent!');
      fetchTeamDetails(selectedTeam.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to resend invitation.');
    }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId) => {
    if (!selectedTeam) return;
    try {
      await axiosInstance.post(`/teams/${selectedTeam.id}/cancel-invitation/`, { invitation_id: invitationId });
      toast.success('Invitation cancelled.');
      fetchTeamDetails(selectedTeam.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to cancel invitation.');
    }
  };

  // Change role
  const changeMemberRole = async (memberId, role) => {
    if (!selectedTeam) return;
    try {
      await axiosInstance.post(`/teams/${selectedTeam.id}/change-role/`, { member_id: memberId, role });
      toast.success('Member role updated.');
      fetchTeamDetails(selectedTeam.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to update member role.');
    }
  };

  // Remove member
  const removeMember = async (memberId) => {
    if (!selectedTeam) return;
    try {
      await axiosInstance.post(`/teams/${selectedTeam.id}/remove-member/`, { member_id: memberId });
      toast.success('Member removed from team.');
      fetchTeamDetails(selectedTeam.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to remove member.');
    }
  };

  // Accept invitation
  const acceptInvitation = async (token) => {
    try {
      const { data } = await axiosInstance.post('/teams/accept-invitation/', { token });
      toast.success('Successfully joined the team!');
      await fetchTeams(data.team_id);
      return data;
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to join team.');
      throw err;
    }
  };

  return {
    teams,
    selectedTeam,
    setSelectedTeam,
    members,
    invitations,
    projects,
    activities,
    loading,
    loadingDetails,
    error,
    refetchTeams: fetchTeams,
    refetchDetails: () => selectedTeam && fetchTeamDetails(selectedTeam.id),
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    resendInvitation,
    cancelInvitation,
    changeMemberRole,
    removeMember,
    acceptInvitation,
  };
}
