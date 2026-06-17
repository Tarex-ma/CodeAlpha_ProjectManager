import { useNavigate } from 'react-router-dom';
import { TaskRowSkeleton } from '../common/Skeleton';

const PRIORITY_STYLES = {
  high:   { dot: 'bg-[#e53935]', text: 'text-[#ef9a9a]', bg: 'bg-[#e53935]/10' },
  medium: { dot: 'bg-[#ff9800]', text: 'text-[#ffcc80]', bg: 'bg-[#ff9800]/10' },
  low:    { dot: 'bg-[#4caf50]', text: 'text-[#a5d6a7]', bg: 'bg-[#4caf50]/10' },
};

const STATUS_STYLES = {
  todo:        { label: 'To Do',       bg: 'bg-[#222]',          text: 'text-[#777]'    },
  in_progress: { label: 'In Progress', bg: 'bg-[#1a2a3a]',       text: 'text-[#2196f3]' },
  review:      { label: 'Review',      bg: 'bg-[#2a2a1a]',       text: 'text-[#ff9800]' },
  done:        { label: 'Done',        bg: 'bg-[#1b3a2e]',       text: 'text-[#4caf50]' },
};

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  const diff  = Math.round((d - today) / 86_400_000);
  if (diff === 0)  return 'Today';
  if (diff === 1)  return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * RecentTasks
 *
 * Props:
 *   tasks    – array of task objects
 *   loading  – boolean
 */
export default function RecentTasks({ tasks, loading }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <h2 className="text-[13px] font-semibold text-white">Recent Tasks</h2>
          {!loading && tasks.length > 0 && (
            <span className="px-1.5 py-0.5 bg-[#1e1e1e] rounded text-[10px] text-[#555]">
              {tasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/my-tasks')}
          className="text-[11px] text-[#2196f3] hover:text-[#42a5f5] transition-colors"
        >
          View all →
        </button>
      </div>

      {/* Task list */}
      <div className="px-5 py-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <TaskRowSkeleton key={i} />)
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-10 h-10 bg-[#1e1e1e] rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <p className="text-[13px] text-[#444]">No tasks yet</p>
            <p className="text-[11px] text-[#333] mt-1">Tasks assigned to you will appear here</p>
          </div>
        ) : (
          tasks.map((task) => {
            const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium;
            const status   = STATUS_STYLES[task.status]     ?? STATUS_STYLES.todo;
            const overdue  = isOverdue(task.due_date) && task.status !== 'done';

            return (
              <div
                key={task.id}
                onClick={() => navigate(`/projects/${task.project_id}?task=${task.id}`)}
                className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0 cursor-pointer group"
              >
                {/* Priority dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] truncate transition-colors ${overdue ? 'text-[#ef9a9a]' : 'text-[#ccc] group-hover:text-white'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.project_name && (
                      <span
                        className="text-[10px] truncate max-w-[120px]"
                        style={{ color: task.project_color ?? '#555' }}
                      >
                        {task.project_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={`text-[10px] flex items-center gap-1 ${overdue ? 'text-[#e53935]' : 'text-[#444]'}`}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}