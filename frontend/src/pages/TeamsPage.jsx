import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useTeams from '../hooks/useTeams';
import MembersTable from '../components/teams/MembersTable';
import {
  Users,
  Plus,
  Search,
  Mail,
  Trash2,
  Settings,
  Folder,
  Calendar,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  UserPlus,
  FileText,
  X,
  Image,
  Inbox,
  AlertTriangle,
  Send,
  Lock,
  UserCheck
} from 'lucide-react';

export default function TeamsPage() {
  const { user: currentUser } = useAuth();
  const {
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
    refetchTeams,
    refetchDetails,
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    resendInvitation,
    cancelInvitation,
    changeMemberRole,
    removeMember,
    acceptInvitation,
  } = useTeams();

  const [searchParams, setSearchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');

  // Search & Filter state for Members
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const [memberSortBy, setMemberSortBy] = useState('name'); // 'name' | 'joined_at'

  // Tab selection
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members' | 'invitations' | 'projects' | 'activity' | 'settings'

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(!!invitationToken);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState(null);
  
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [editTeamLogo, setEditTeamLogo] = useState(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Check if current user is the owner of selectedTeam
  const isOwner = selectedTeam?.owner === currentUser?.id;
  const userMemberRole = members.find(m => m.user === currentUser?.id)?.role ?? (isOwner ? 'owner' : 'client');

  // Reset forms on selectedTeam change
  useEffect(() => {
    if (selectedTeam) {
      setEditTeamName(selectedTeam.name);
      setEditTeamDesc(selectedTeam.description);
      setEditTeamLogo(null);
    }
  }, [selectedTeam]);

  // Set document title
  useEffect(() => {
    document.title = 'Teams Management | Project Manager';
  }, []);

  // Accept token flow
  const handleAcceptInvite = async () => {
    if (!invitationToken) return;
    try {
      await acceptInvitation(invitationToken);
      setIsAcceptModalOpen(false);
      // Remove token query param
      setSearchParams({});
    } catch (err) {
      // toast shown in hook
    }
  };

  // Create team handler
  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await createTeam(newTeamName, newTeamDesc, newTeamLogo);
      setIsCreateModalOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      setNewTeamLogo(null);
    } catch (err) {}
  };

  // Update team handler
  const handleUpdateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!editTeamName.trim()) return;
    try {
      await updateTeam(selectedTeam.id, editTeamName, editTeamDesc, editTeamLogo);
    } catch (err) {}
  };

  // Invite handler
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember(inviteEmail, inviteRole);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {}
  };

  // Filtered members list
  const filteredMembers = React.useMemo(() => {
    let list = [...members];
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      list = list.filter(m => 
        m.user_full_name?.toLowerCase().includes(q) || 
        m.user_email?.toLowerCase().includes(q)
      );
    }
    if (memberRoleFilter) {
      list = list.filter(m => m.role === memberRoleFilter);
    }
    list.sort((a, b) => {
      if (memberSortBy === 'joined_at') {
        return new Date(a.joined_at) - new Date(b.joined_at);
      }
      return (a.user_full_name ?? '').localeCompare(b.user_full_name ?? '');
    });
    return list;
  }, [members, memberSearch, memberRoleFilter, memberSortBy]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-10 h-10 border-4 border-[#2196f3] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[14px] text-[#555]">Loading your teams...</p>
      </div>
    );
  }

  return (
    <div className="w-full text-white pb-10 space-y-6">
      
      {/* Accept Invitation Modal */}
      {isAcceptModalOpen && invitationToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsAcceptModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#141414] border border-[#1e1e1e] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <UserCheck className="w-8 h-8" />
              <h2 className="text-xl font-bold">Team Invitation</h2>
            </div>
            <p className="text-sm text-[#aaa] mb-6">
              You have been invited to join a team. Click accept to view the workspace and start collaborating with your team members.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setIsAcceptModalOpen(false); setSearchParams({}); }}
                className="px-4 py-2 border border-[#2a2a2a] hover:bg-[#1a1a1a] text-sm text-[#888] rounded-lg transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvite}
                className="px-5 py-2 bg-[#2196f3] hover:bg-[#1976d2] text-sm font-medium text-white rounded-lg transition-all"
              >
                Accept Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Teams list on left, Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Teams List Selector */}
        <div className="lg:col-span-1 bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 space-y-4 h-fit">
          <div className="flex justify-between items-center pb-2 border-b border-[#1e1e1e]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#555]">Your Teams</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 text-white hover:text-[#2196f3] bg-[#222] border border-[#333] hover:border-[#2196f3] rounded transition-all"
              title="Create new team"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-8 text-[#555] space-y-2">
              <Inbox className="w-8 h-8 mx-auto" />
              <p className="text-xs">No teams joined yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTeam(t); setActiveTab('overview'); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    selectedTeam?.id === t.id
                      ? 'bg-[#2196f3]/10 border-[#2196f3] text-white'
                      : 'bg-transparent border-[#1e1e1e] hover:border-[#333] text-[#aaa] hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 bg-[#222] rounded-lg border border-[#333] overflow-hidden flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">
                    {t.logo_url ? (
                      <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      t.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{t.name}</p>
                    <p className="text-[10px] text-[#555] truncate">{t.total_members} members</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Selected Team Detail Dashboard */}
        <div className="lg:col-span-3 space-y-6">
          
          {!selectedTeam ? (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl py-24 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[#222] border border-[#2a2a2a] rounded-2xl flex items-center justify-center mb-4 text-[#555]">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No Team Selected</h3>
              <p className="text-sm text-[#555] max-w-sm mb-6">
                Please select a team from the left sidebar or create a new team to manage members, invitations, projects, and activities.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#2196f3] hover:bg-[#1976d2] text-sm font-medium text-white rounded-lg transition-all"
              >
                Create new team
              </button>
            </div>
          ) : (
            <>
              {/* Team Overview Card Header */}
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-16 h-16 bg-[#222] border border-[#333] rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold text-white overflow-hidden shadow-lg shadow-black/40">
                  {selectedTeam.logo_url ? (
                    <img src={selectedTeam.logo_url} alt={selectedTeam.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedTeam.name[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-semibold text-white tracking-tight">{selectedTeam.name}</h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                      isOwner ? 'bg-[#ffb74d]/10 border-[#ffb74d]/30 text-[#ffb74d]' : 'bg-[#2196f3]/10 border-[#2196f3]/30 text-[#2196f3]'
                    }`}>
                      {userMemberRole.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#555] max-w-xl">{selectedTeam.description || 'No team description.'}</p>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-[#1e1e1e] overflow-x-auto gap-4 scrollbar-none">
                {[
                  { id: 'overview', label: 'Overview', icon: Users },
                  { id: 'members', label: 'Members', icon: Users },
                  { id: 'invitations', label: 'Invitations', icon: Mail },
                  { id: 'projects', label: 'Projects', icon: Folder },
                  { id: 'activity', label: 'Activity', icon: Activity },
                  { id: 'settings', label: 'Settings', icon: Settings, ownerOnly: true },
                ].map(tab => {
                  if (tab.ownerOnly && !isOwner) return null;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all flex-shrink-0 ${
                        activeTab === tab.id
                          ? 'border-[#2196f3] text-[#2196f3]'
                          : 'border-transparent text-[#555] hover:text-[#888]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tabs Content */}
              <div className="space-y-6">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Total Members', value: selectedTeam.total_members, color: 'bg-[#2196f3]/10 text-[#2196f3]' },
                        { label: 'Active Members', value: selectedTeam.active_members, color: 'bg-[#4caf50]/10 text-[#4caf50]' },
                        { label: 'Pending Invites', value: selectedTeam.pending_invitations, color: 'bg-[#ffb74d]/10 text-[#ffb74d]' },
                        { label: 'Projects', value: selectedTeam.total_projects, color: 'bg-[#9c27b0]/10 text-[#9c27b0]' },
                        { label: 'Total Tasks', value: selectedTeam.total_tasks, color: 'bg-[#e53935]/10 text-[#e53935]' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 transition-all hover:border-[#222]">
                          <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">{stat.label}</p>
                          <p className="text-xl font-bold mt-1 text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Team Details info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#555]">Details</h3>
                        <div className="space-y-3 text-xs text-[#aaa]">
                          <div className="flex justify-between py-1.5 border-b border-[#1e1e1e]">
                            <span>Owner</span>
                            <span className="text-white font-medium">{selectedTeam.owner_details?.full_name ?? selectedTeam.owner_details?.email}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-[#1e1e1e]">
                            <span>Owner Email</span>
                            <span className="text-white font-medium">{selectedTeam.owner_details?.email}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span>Created At</span>
                            <span className="text-white font-medium">
                              {new Date(selectedTeam.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick projects overview */}
                      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#555]">Recent Activity</h3>
                        {activities.length === 0 ? (
                          <p className="text-xs text-[#555] py-4 text-center">No recent activities.</p>
                        ) : (
                          <div className="space-y-3">
                            {activities.slice(0, 4).map(act => (
                              <div key={act.id} className="flex gap-3 text-xs">
                                <div className="w-1.5 h-1.5 bg-[#2196f3] rounded-full mt-1.5 flex-shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="text-[#aaa]"><span className="text-white font-medium">{act.actor_name || act.actor_email}</span> {act.description}</p>
                                  <p className="text-[10px] text-[#555]">{new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* MEMBERS TAB */}
                {activeTab === 'members' && (
                  <MembersTable members={members} />
                )}

                {/* INVITATIONS TAB */}
                {activeTab === 'invitations' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#555]">Pending Invitations</h3>
                      {isOwner && (
                        <button
                          onClick={() => setIsInviteModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2196f3] hover:bg-[#1976d2] text-xs font-semibold rounded-lg text-white transition-all shadow-md shadow-black/20"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite Member
                        </button>
                      )}
                    </div>

                    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#1e1e1e] text-[#555] font-semibold bg-[#161616]">
                              <th className="p-4">Email</th>
                              <th className="p-4">Role</th>
                              <th className="p-4">Invited By</th>
                              <th className="p-4">Expires</th>
                              <th className="p-4">Status</th>
                              {isOwner && <th className="p-4 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e1e1e]">
                            {invitations.map(inv => (
                              <tr key={inv.id} className="hover:bg-[#161616] transition-colors">
                                <td className="p-4 text-white font-medium">{inv.email}</td>
                                <td className="p-4 capitalize text-[#aaa]">{inv.role}</td>
                                <td className="p-4 text-[#aaa]">{inv.invited_by_name}</td>
                                <td className="p-4 text-[#aaa]">
                                  {new Date(inv.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    inv.status === 'pending' ? 'bg-[#ffb74d]/10 text-[#ffb74d]' : 'bg-[#555]/10 text-[#555]'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                {isOwner && (
                                  <td className="p-4 text-right flex justify-end gap-2">
                                    {inv.status === 'pending' && (
                                      <button
                                        onClick={() => resendInvitation(inv.id)}
                                        className="px-2 py-1 text-[10px] font-semibold text-white bg-[#222] border border-[#333] hover:border-[#555] rounded-md transition-all"
                                      >
                                        Resend
                                      </button>
                                    )}
                                    <button
                                      onClick={() => cancelInvitation(inv.id)}
                                      className="p-1 hover:text-white text-[#555] hover:bg-[#e53935]/10 rounded-md border border-transparent hover:border-[#e53935]/20 transition-all"
                                      title="Cancel invitation"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {invitations.length === 0 && (
                        <p className="text-center text-xs text-[#555] py-8">No pending invitations.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* PROJECTS TAB */}
                {activeTab === 'projects' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(proj => (
                      <div key={proj.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 space-y-4 hover:border-[#222] transition-all">
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl" role="img" aria-label="project-icon">{proj.icon || '📁'}</span>
                            <h4 className="font-semibold text-sm truncate text-white">{proj.title}</h4>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            proj.status === 'active' ? 'bg-[#4caf50]/10 border-[#4caf50]/30 text-[#4caf50]' : 'bg-[#555]/10 border-[#333] text-[#aaa]'
                          }`}>
                            {proj.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#555] truncate">{proj.description || 'No description.'}</p>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-[#555]">
                            <span>Progress</span>
                            <span className="text-white font-medium">{proj.progress}%</span>
                          </div>
                          <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#2196f3] h-full rounded-full transition-all duration-300" style={{ width: `${proj.progress}%` }} />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-[#1a1a1a] text-[10px] text-[#555]">
                          <span>{proj.total_tasks} tasks ({proj.completed_tasks} completed)</span>
                          <span>{proj.members_count} members</span>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="col-span-2 text-center py-16 text-[#555] bg-[#111] border border-[#1e1e1e] rounded-xl space-y-2">
                        <Folder className="w-8 h-8 mx-auto" />
                        <p className="text-xs">No projects associated with this team yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === 'activity' && (
                  <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#555]">Timeline</h3>
                    {activities.length === 0 ? (
                      <p className="text-xs text-[#555] py-8 text-center">No activities recorded.</p>
                    ) : (
                      <div className="relative pl-6 border-l border-[#222] space-y-6">
                        {activities.map(act => (
                          <div key={act.id} className="relative text-xs">
                            {/* Dot */}
                            <div className="absolute -left-[30px] top-1.5 w-2 h-2 bg-[#2196f3] border-2 border-[#111] rounded-full shadow" />
                            <div className="space-y-1">
                              <p className="text-white font-medium">
                                {act.actor_name || act.actor_email || 'System'}{' '}
                                <span className="text-[#aaa] font-normal">{act.description}</span>
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#555]">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(act.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && isOwner && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Edit Form */}
                    <div className="md:col-span-2 bg-[#111] border border-[#1e1e1e] rounded-xl p-5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#555]">Update Team Profile</h3>
                      <form onSubmit={handleUpdateTeamSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Team Name</label>
                          <input
                            type="text"
                            value={editTeamName}
                            onChange={e => setEditTeamName(e.target.value)}
                            className="w-full bg-[#161616] border border-[#222] focus:border-[#333] text-[13px] rounded-lg px-3.5 py-2 text-white outline-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Team Description</label>
                          <textarea
                            value={editTeamDesc}
                            onChange={e => setEditTeamDesc(e.target.value)}
                            rows={3}
                            className="w-full bg-[#161616] border border-[#222] focus:border-[#333] text-[13px] rounded-lg px-3.5 py-2 text-white outline-none resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Team Logo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setEditTeamLogo(e.target.files[0])}
                            className="w-full text-xs text-[#aaa] file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[#333] file:text-xs file:font-semibold file:bg-[#222] file:text-white hover:file:bg-[#2a2a2a] file:cursor-pointer"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#2196f3] hover:bg-[#1976d2] text-xs font-semibold rounded-lg text-white transition-all shadow-md shadow-black/20"
                        >
                          Save Changes
                        </button>
                      </form>
                    </div>

                    {/* Danger zone */}
                    <div className="md:col-span-1 bg-[#111] border border-[#1e1e1e] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Danger Zone
                        </h3>
                        <p className="text-[11px] text-[#555]">
                          Deleting the team is permanent and deletes all team metadata. Associating projects will persist but will no longer be linked to this team.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${selectedTeam.name}?`)) {
                            deleteTeam(selectedTeam.id);
                          }
                        }}
                        className="w-full py-2 bg-transparent border border-red-900/30 hover:border-red-600 text-xs font-semibold rounded-lg text-red-500 hover:bg-red-600/10 transition-all"
                      >
                        Delete Team
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}

        </div>
      </div>

      {/* CREATE TEAM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#141414] border border-[#1e1e1e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e1e1e] pb-3">
              <h2 className="text-base font-bold text-white">Create New Team</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#555] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="w-full bg-[#161616] border border-[#222] focus:border-[#333] text-[13px] rounded-lg px-3.5 py-2 text-white outline-none"
                  placeholder="e.g. Acme Marketing"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Team Description</label>
                <textarea
                  value={newTeamDesc}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#161616] border border-[#222] focus:border-[#333] text-[13px] rounded-lg px-3.5 py-2 text-white outline-none resize-none"
                  placeholder="Describe your team workspace..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Team Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setNewTeamLogo(e.target.files[0])}
                  className="w-full text-xs text-[#aaa] file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[#333] file:text-xs file:font-semibold file:bg-[#222] file:text-white hover:file:bg-[#2a2a2a] file:cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#2a2a2a] hover:bg-[#1a1a1a] text-xs font-semibold text-[#888] rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2196f3] hover:bg-[#1976d2] text-xs font-semibold text-white rounded-lg transition-all shadow-md shadow-black/20"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#141414] border border-[#1e1e1e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e1e1e] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2196f3]" />
                Invite Member
              </h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-[#555] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-[#161616] border border-[#222] focus:border-[#333] text-[13px] rounded-lg px-3.5 py-2 text-white outline-none"
                  placeholder="e.g. member@company.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full bg-[#161616] border border-[#222] focus:border-[#333] text-[13px] rounded-lg px-3.5 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="member">Member</option>
                  <option value="client">Client</option>
                </select>
                <p className="text-[10px] text-[#555] mt-1">
                  {inviteRole === 'member' 
                    ? 'Members have full read/write permissions on tasks and projects.' 
                    : 'Clients have read-only visibility into projects and tasks.'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border border-[#2a2a2a] hover:bg-[#1a1a1a] text-xs font-semibold text-[#888] rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2196f3] hover:bg-[#1976d2] text-xs font-semibold text-white rounded-lg transition-all shadow-md shadow-black/20 animate-pulse-none"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
