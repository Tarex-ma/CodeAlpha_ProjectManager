import React from 'react';

/**
 * Reusable card component for displaying a task summary.
 * Props:
 *   - task: object with fields { id, title, status, due_date, assignees }
 *   - onOpen: function to open modal (optional)
 */
export default function TaskCard({ task, onOpen }) {
  const statusStyles = {
    completed: { bg: 'bg-[#1a2a3a]', text: 'text-[#2196f3]', label: 'Completed' },
    in_progress: { bg: 'bg-[#1b3a2e]', text: 'text-[#4caf50]', label: 'In Progress' },
    overdue: { bg: 'bg-[#2a1a1a]', text: 'text-[#e53935]', label: 'Overdue' },
  };
  const style = statusStyles[task.status] ?? statusStyles.in_progress;

  const due = new Date(task.due_date);
  const dueLabel = isNaN(due) ? '' : due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div
      className="group bg-[#161616] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-xl p-4 transition-all duration-200 cursor-pointer"
      onClick={() => onOpen && onOpen(task)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white truncate">{task.title}</h3>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${style.bg} ${style.text}`}> {style.label} </span>
      </div>
      <div className="flex justify-between items-center text-xs text-[#555] dark:text-[#aaa]">
        {task.due_date && <span>{dueLabel}</span>}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((assignee) => (
              <div key={assignee.id} className="w-5 h-5 rounded-full bg-[#2196f3] flex items-center justify-center text-[10px] text-white border border-[#161616]" title={assignee.full_name || assignee.email}>
                {assignee.first_name?.[0]?.toUpperCase() ?? assignee.email?.[0]?.toUpperCase()}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-[#333] flex items-center justify-center text-[10px] text-white border border-[#161616]" title={`${task.assignees.length - 3} more`}>
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
