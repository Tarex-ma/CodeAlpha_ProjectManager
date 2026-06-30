import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMyTasks } from '../hooks/useMyTasks';
import TaskCard from '../components/task/taskCard';
import TaskDetailModal from '../components/task/TaskDetailModal';
import {
  CheckSquare,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Grid,
  List,
  Folder,
  Inbox,
  FilterX
} from 'lucide-react';

export default function MyTasksPage() {
  const { user } = useAuth();
  const {
    tasks,
    loading,
    error,
    stats,
    projects,
    search,
    setSearch,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    changeStatus,
    markCompleted,
    refetch,
  } = useMyTasks();

  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    document.title = 'My Tasks | Project Manager';
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-10 h-10 border-4 border-[#2196f3] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[14px] text-[#555]">Loading your tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-12 h-12 bg-[#e53935]/10 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-[#e53935]" />
        </div>
        <p className="text-[15px] font-medium text-white mb-1">Failed to load tasks</p>
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

  const currentUserForModal = user ? {
    id: user.id,
    name: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
    avatar: null
  } : null;

  return (
    <div className="w-full space-y-6 text-white pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight">
            My Tasks
          </h1>
          <p className="text-[13px] text-[#555] mt-1">
            Manage, organize, and track tasks assigned to you.
          </p>
        </div>
        
        {/* View mode switcher */}
        <div className="flex items-center bg-[#111] border border-[#1e1e1e] rounded-lg p-0.5 self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'list' ? 'bg-[#222] text-[#2196f3]' : 'text-[#555] hover:text-[#888]'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid' ? 'bg-[#222] text-[#2196f3]' : 'text-[#555] hover:text-[#888]'
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cards */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#222]">
          <div className="w-10 h-10 bg-[#2196f3]/10 text-[#2196f3] rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#555] font-medium uppercase tracking-wider">Assigned</p>
            <p className="text-xl font-semibold mt-0.5 text-white">{stats.total}</p>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#222]">
          <div className="w-10 h-10 bg-[#ffb74d]/10 text-[#ffb74d] rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#555] font-medium uppercase tracking-wider">Due Today</p>
            <p className="text-xl font-semibold mt-0.5 text-white">{stats.dueToday}</p>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#222]">
          <div className="w-10 h-10 bg-[#e53935]/10 text-[#e53935] rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#555] font-medium uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-semibold mt-0.5 text-white">{stats.overdue}</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#222]">
          <div className="w-10 h-10 bg-[#4caf50]/10 text-[#4caf50] rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#555] font-medium uppercase tracking-wider">Completed</p>
            <p className="text-xl font-semibold mt-0.5 text-white">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#555]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-[#222] focus:border-[#333] hover:border-[#2a2a2a] text-[13px] rounded-lg pl-9 pr-4 py-2 text-white placeholder-[#555] outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:ml-auto">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#555] uppercase tracking-wider hidden lg:inline">Status</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-[#161616] border border-[#222] text-[13px] text-[#aaa] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#333] transition-all"
            >
              <option value="">All Statuses</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#555] uppercase tracking-wider hidden lg:inline">Priority</span>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="bg-[#161616] border border-[#222] text-[13px] text-[#aaa] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#333] transition-all"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Project */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#555] uppercase tracking-wider hidden lg:inline">Project</span>
            <select
              value={filters.project}
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="bg-[#161616] border border-[#222] text-[13px] text-[#aaa] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#333] w-36 transition-all"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#555] uppercase tracking-wider hidden lg:inline">Due</span>
            <select
              value={filters.dueDate}
              onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
              className="bg-[#161616] border border-[#222] text-[13px] text-[#aaa] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#333] transition-all"
            >
              <option value="">Any Time</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="week">Next 7 Days</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 border-l border-[#222] pl-3 ml-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#555]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#161616] border border-[#222] text-[13px] text-[#aaa] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#333] transition-all"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="updated_at">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List / Grid */}
      {tasks.length === 0 ? (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl py-16 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-[#222] border border-[#2a2a2a] rounded-2xl flex items-center justify-center mb-4 text-[#555]">
            {search || filters.status || filters.priority || filters.project || filters.dueDate ? (
              <FilterX className="w-6 h-6" />
            ) : (
              <Inbox className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-[15px] font-medium text-white mb-1">
            {search || filters.status || filters.priority || filters.project || filters.dueDate
              ? 'No matching tasks'
              : 'All caught up!'}
          </h3>
          <p className="text-[13px] text-[#555] max-w-sm">
            {search || filters.status || filters.priority || filters.project || filters.dueDate
              ? 'Try modifying your filters or search keywords to find what you are looking for.'
              : 'There are currently no tasks assigned to you. Enjoy your clean inbox!'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
          : 'space-y-3'
        }>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={setSelectedTask}
              onEdit={setSelectedTask}
              onStatusChange={changeStatus}
              onComplete={markCompleted}
              onAddComment={setSelectedTask}
            />
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={refetch}
          onTaskDeleted={() => { setSelectedTask(null); refetch(); }}
          currentUser={currentUserForModal}
        />
      )}
    </div>
  );
}

