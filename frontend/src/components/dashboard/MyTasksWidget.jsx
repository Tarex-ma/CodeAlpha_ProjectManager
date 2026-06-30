import React from 'react';
import { Link } from 'react-router-dom';

function getPriorityColor(priority) {
  switch (priority) {
    case 'urgent': return 'text-red-500 bg-red-500/10';
    case 'high': return 'text-orange-500 bg-orange-500/10';
    case 'medium': return 'text-blue-500 bg-blue-500/10';
    case 'low': return 'text-gray-400 bg-gray-500/10';
    default: return 'text-gray-400 bg-gray-500/10';
  }
}

export default function MyTasksWidget({ tasks, loading }) {
  return (
    <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1e1e1e]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <h2 className="text-[13px] font-semibold text-white">My Assigned Tasks</h2>
      </div>

      <div className="px-5 py-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-[#222] rounded w-full"></div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[#444]">No tasks assigned to you right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#333] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-4 h-4 rounded-full border-2 border-[#444] flex-shrink-0" />
                    <div className="min-w-0">
                      <Link to={`/projects/${task.project}/board`} className="text-[13px] font-medium text-[#ececec] hover:text-white truncate block">
                        {task.title}
                      </Link>
                      <p className="text-[11px] text-[#777] mt-0.5 truncate">
                        {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {isOverdue && <span className="text-[10px] text-red-500 font-medium">Overdue</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
