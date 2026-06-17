import { useRef, useEffect } from 'react';
import CommentItem from './CommentItem';
import UserAvatar  from '../common/UserAvatar';

/**
 * CommentsSection
 *
 * Props:
 *   comments        – array of comment objects
 *   loading         – boolean
 *   commentText     – string (compose box value)
 *   setCommentText  – (v) => void
 *   submitting      – boolean
 *   onSubmit        – async () => void
 *   editingCmtId    – id | null
 *   editingCmtText  – string
 *   setEditingCmtText – (v) => void
 *   savingCmt       – boolean
 *   onStartEdit     – (comment) => void
 *   onCancelEdit    – () => void
 *   onSaveEdit      – (id) => void
 *   onDelete        – (id) => void
 *   currentUser     – { id, name, avatar }
 */
export default function CommentsSection({
  comments,
  loading,
  commentText,
  setCommentText,
  submitting,
  onSubmit,
  editingCmtId,
  editingCmtText,
  setEditingCmtText,
  savingCmt,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  currentUser,
}) {
  const composeRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit();
  };

  const handleInput = (e) => {
    setCommentText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  // Reset compose height when text is cleared
  useEffect(() => {
    if (!commentText && composeRef.current) {
      composeRef.current.style.height = 'auto';
    }
  }, [commentText]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span className="text-[12px] font-semibold text-[#888] uppercase tracking-wider">Comments</span>
        {!loading && comments.length > 0 && (
          <span className="px-1.5 py-0.5 bg-[#1e1e1e] rounded text-[10px] text-[#444]">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className="space-y-4 mb-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 bg-[#1e1e1e] rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="w-24 h-2.5 bg-[#1e1e1e] rounded mb-2" />
                <div className="bg-[#1a1a1a] rounded-xl px-3.5 py-3">
                  <div className="w-full h-2.5 bg-[#1e1e1e] rounded mb-1.5" />
                  <div className="w-3/4 h-2.5 bg-[#1e1e1e] rounded" />
                </div>
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-[#111] border border-dashed border-[#1a1a1a] rounded-xl">
            <div className="w-9 h-9 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p className="text-[12px] text-[#444]">No comments yet</p>
            <p className="text-[11px] text-[#333] mt-0.5">Be the first to add one</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isEditing={editingCmtId === comment.id}
              editText={editingCmtText}
              setEditText={setEditingCmtText}
              saving={savingCmt}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSave={onSaveEdit}
              onDelete={onDelete}
              currentUserId={currentUser?.id}
            />
          ))
        )}
      </div>

      {/* ── Compose box ──────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <UserAvatar
          name={currentUser?.name ?? 'You'}
          avatar={currentUser?.avatar}
          size="sm"
          className="flex-shrink-0 mt-1"
        />
        <div className="flex-1">
          <div className="bg-[#1a1a1a] border border-[#222] focus-within:border-[#2196f3]/40 rounded-xl px-3.5 py-3 transition-colors">
            <textarea
              ref={composeRef}
              value={commentText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment…"
              rows={1}
              className="w-full bg-transparent text-[13px] text-white placeholder:text-[#333] outline-none resize-none leading-relaxed"
              style={{ minHeight: '24px' }}
            />
          </div>

          {commentText.trim() && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-[#333]">⌘↵ to post</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCommentText('')}
                  className="px-3 py-1.5 text-[11px] text-[#555] hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={submitting || !commentText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2196f3] hover:bg-[#1976d2] text-white text-[11px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}