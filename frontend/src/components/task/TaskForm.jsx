import React, { useState } from 'react';
import { createTask, updateTask } from '../../api/tasks';

/**
 * TaskForm component for creating or editing a task.
 * Props:
 *   - initialData: optional object with existing task fields (for edit mode)
 *   - onCancel: function to call when the user cancels
 *   - onSubmit: function to call after successful save (receives saved task)
 *   - loading: boolean indicating a pending request
 */
export default function TaskForm({ initialData = {}, onCancel, onSubmit, loading }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [priority, setPriority] = useState(initialData.priority || 'medium');
  const [status, setStatus] = useState(initialData.status || 'todo');
  const [dueDate, setDueDate] = useState(initialData.due_date ? initialData.due_date.split('T')[0] : '');
  const [assigneeId, setAssigneeId] = useState(initialData.assignee?.id || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      description,
      priority,
      status,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
    };
    try {
      let result;
      if (initialData.id) {
        result = await updateTask(initialData.id, payload);
      } else {
        result = await createTask(payload);
      }
      onSubmit && onSubmit(result.data);
    } catch (err) {
      // Errors are handled by the parent component via props
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-[#1a1a1a] border border-[#333] text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md bg-[#1a1a1a] border border-[#333] text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 block w-full rounded-md bg-[#1a1a1a] border border-[#333] text-gray-100 focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-md bg-[#1a1a1a] border border-[#333] text-gray-100 focus:outline-none"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-md bg-[#1a1a1a] border border-[#333] text-gray-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Assignee ID</label>
          <input
            type="number"
            min="1"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="mt-1 block w-full rounded-md bg-[#1a1a1a] border border-[#333] text-gray-100 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
        >
          {initialData.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
