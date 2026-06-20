import React, { useState } from 'react';
import useComments from '../../hooks/useComments';

export default function CommentSection({ taskId }) {
  const { comments, loading, error, addComment, removeComment } = useComments(taskId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    await addComment({ content: newComment });
    setNewComment('');
    setSubmitting(false);
  };

  if (loading && comments.length === 0) {
    return <div className="text-gray-400 text-sm py-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">Comments</h3>
      
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-[#161616] p-3 rounded-lg border border-[#1e1e1e]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-blue-400">
                  {c.author ? (c.author.full_name || c.author.email) : 'Unknown User'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-2">
        <textarea
          className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition resize-none"
          rows="3"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
