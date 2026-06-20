import React from 'react';
import TaskCard from '../components/task/TaskCard';

export default function MyTasksPage() {
  // Mock tasks – replace with API data later
  const tasks = [
    { id: 1, title: 'Design new logo', status: 'in_progress', due_date: '2026-07-01', assignees: [{ id: 1, first_name: 'Alice', email: 'alice@example.com' }] },
    { id: 2, title: 'Fix login bug', status: 'overdue', due_date: '2026-06-10', assignees: [{ id: 2, first_name: 'Bob', email: 'bob@example.com' }] },
    { id: 3, title: 'Publish blog post', status: 'completed', due_date: '2026-06-20', assignees: [{ id: 3, first_name: 'Carol', email: 'carol@example.com' }] },
  ];

  const [selectedTask, setSelectedTask] = React.useState(null);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">My Tasks</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Here you will find your tasks at a glance.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onOpen={setSelectedTask} />
        ))}
      </div>
      {/* Optional modal (placeholder) */}
      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md text-white">
            <h2 className="text-xl font-semibold mb-2">{selectedTask.title}</h2>
            <p>Details would appear here…</p>
            <button className="mt-4 px-3 py-1 bg-gray-600 rounded" onClick={() => setSelectedTask(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
