import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { useCreateProject } from '../hooks/useCreateProject';

import StatsSection      from '../components/dashboard/StatsSection';
import ProjectsSection   from '../components/dashboard/ProjectsSection';
import RecentTasks       from '../components/dashboard/RecentTasks';
import ActivityFeed      from '../components/dashboard/ActivityFeed';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

/**
 * DashboardPage
 *
 * Top-level page rendered at "/".
 * Composes all dashboard sections and wires up data + modal state.
 */
export default function DashboardPage() {
  const { user } = useAuth();

  const {
    projects,
    recentTasks,
    stats,
    activity,
    loading,
    error,
    refetch,
    createProject,
    deleteProject,
  } = useDashboard();

  // Modal state lives in useCreateProject, passing createProject as onSubmit
  const modal = useCreateProject(createProject);

  const firstName = user?.first_name || user?.username || 'there';

  // ── Error state ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-12 h-12 bg-[#e53935]/10 rounded-xl flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-[15px] font-medium text-white mb-1">Failed to load dashboard</p>
        <p className="text-[13px] text-[#555] mb-5">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#333] text-[13px] text-[#aaa] hover:text-white rounded-lg transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto space-y-8">

        {/* ── Welcome header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-[13px] text-[#555] mt-1">
              Here's what's happening with your projects today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={refetch}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center bg-[#161616] border border-[#1e1e1e] hover:border-[#2a2a2a] text-[#555] hover:text-[#aaa] rounded-lg transition-all disabled:opacity-40"
              aria-label="Refresh dashboard"
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={loading ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>

            {/* New project (primary CTA) */}
            <button
              onClick={modal.openModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#2196f3] hover:bg-[#1976d2] active:scale-[0.98] text-white text-[13px] font-medium rounded-lg transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New project
            </button>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────── */}
        <StatsSection stats={stats} loading={loading} />

        {/* ── Projects grid ──────────────────────────────────── */}
        <ProjectsSection
          projects={projects}
          loading={loading}
          onOpenModal={modal.openModal}
          onDelete={deleteProject}
        />

        {/* ── Bottom row: tasks + activity ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <RecentTasks tasks={recentTasks} loading={loading} />
          <ActivityFeed activity={activity}  loading={loading} />
        </div>

      </div>

      {/* ── Create project modal ───────────────────────────── */}
      <CreateProjectModal
        open={modal.open}
        onClose={modal.closeModal}
        onSubmit={createProject}
      />
    </>
  );
}