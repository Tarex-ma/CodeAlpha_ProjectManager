import React from 'react';
import { Eye, Pencil, Check, MessageSquare, Tag } from 'lucide-react';

/**
 * Reusable card component for displaying a task summary.
 * Props:
 *   - task: object with fields { id, title, status, due_date, assignees, project, priority, labels }
 *   - onOpen: function to open modal (optional)
 *   - onEdit: function to edit task (optional, permission based)
 *   - onStatusChange: function(status) to change status
 *   - onComplete: function() to mark as completed
 *   - onAddComment: function() to add comment
 */
export default function TaskCard({
  task,
  onOpen,
  onEdit,
  onStatusChange,
  onComplete,
  onAddComment,
}) {
  const statusStyles = {
    completed: { bg: 'bg-[#1a2a3a]', text: 'text-[#2196f3]', label: 'Completed' },
    in_progress: { bg: 'bg-[#1b3a2e]', text: 'text-[#4caf50]', label: 'In Progress' },
    overdue: { bg: 'bg-[#2a1a1a]', text: 'text-[#e53935]', label: 'Overdue' },
    todo: { bg: 'bg-[#1a1a2a]', text: 'text-[#ffb74d]', label: 'Todo' },
  };
  const style = statusStyles[task.status] ?? statusStyles.todo;

  const due = new Date(task.due_date);
  const dueLabel = isNaN(due) ? '' : due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const priorityColors = {
    urgent: 'bg-[#d32f2f] text-white',
    high: 'bg-[#f57c00] text-white',
    medium: 'bg-[#1976d2] text-white',
    low: 'bg-[#388e3c] text-white',
  };
  const priorityClass = priorityColors[task.priority] ?? 'bg-[#555] text-white';

  return (
    <div
      className="group bg-[#161616] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-xl p-4 transition-all duration-200 cursor-pointer"
      onClick={() => onOpen && onOpen(task)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white truncate">{task.title}</h3>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${style.bg} ${style.text}`}>{style.label}</span>
      </div>

      {/* Meta line */}
      <div className="flex flex-wrap gap-2 text-xs text-[#aaa] mb-2">
        {task.project && <span className="bg-[#222] px-2 py-0.5 rounded">{task.project.name}</span>}
        <span className={`px-2 py-0.5 rounded ${priorityClass}`}>{task.priority ?? 'N/A'}</span>
        {task.labels && task.labels.map(l => (
          <span key={l.id} className="flex items-center gap-1 px-2 py-0.5 bg-[#333] rounded text-[10px]">
            <Tag className="w-3 h-3" />{l.name}
          </span>
        ))}
        {task.due_date && <span>{dueLabel}</span>}
      </div>

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex -space-x-1.5 mb-2">
          {task.assignees.slice(0, 3).map(assignee => (
            <div
               key={assignee.id}
               className="w-5 h-5 rounded-full bg-[#2196f3] flex items-center justify-center text-[10px] text-white border border-[#161616]"
               title={assignee.full_name || assignee.email}
             >
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

      {/* Action icons */}
      <div className="flex space-x-3 text-[#888] mt-3 pt-2 border-t border-[#222]">
        <button onClick={e => { e.stopPropagation(); onOpen && onOpen(task); }} title="View details" className="hover:text-white transition-colors duration-150">
          <Eye className="w-4 h-4" />
        </button>
        {onEdit && (
          <button onClick={e => { e.stopPropagation(); onEdit(task); }} title="Edit task" className="hover:text-[#ffb74d] transition-colors duration-150">
            <Pencil className="w-4 h-4" />
          </button>
        )}
        {onStatusChange && (
          <button onClick={e => { e.stopPropagation(); onStatusChange(task.id, task.status === 'in_progress' ? 'done' : 'in_progress'); }} title="Toggle status" className="hover:text-[#4caf50] transition-colors duration-150">
            <Check className="w-4 h-4" />
          </button>
        )}
        {onComplete && (
          <button onClick={e => { e.stopPropagation(); onComplete(task.id); }} title="Mark completed" className="hover:text-[#2196f3] transition-colors duration-150">
            <Check className="w-4 h-4" />
          </button>
        )}
        {onAddComment && (
          <button onClick={e => { e.stopPropagation(); onAddComment(task); }} title="Add comment" className="hover:text-[#ffb74d] transition-colors duration-150">
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
