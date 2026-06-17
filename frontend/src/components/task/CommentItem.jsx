import { useRef, useEffect } from 'react';
import UserAvatar from '../common/UserAvatar';
import { timeAgo } from '../../utils/taskDetailUtils';

/**
 * CommentItem
 *
 * Props:
 *   comment         – comment object { id, body, author_name, author_avatar, created_at, updated_at }
 *   isEditing       – boolean
 *   editText        – string
 *   setEditText     – (v) => void
 *   saving          – boolean
 *   onStartEdit     – (comment) => void
 *   onCancelEdit    – () => void
 *   onSave          – (id) => void
 *   onDelete        – (id) => void
 *   currentUserId   – to show edit/delete only for own comments
 */
export default function CommentItem({
  comment,
  isEditing,
  editText,
  setEditText,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  currentUserId,
}) {
  const textareaRef = useRef(null);

  const isOwn = !currentUserId || comment.author_id === currentUserId;
  const edited = comment.updated_at && comment.updated_at !== comment.created_at;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editText.length, editText.length);
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave(comment.id);
    if (e.key === 'Escape') onCancelEdit();
  };

  const handleInput = (e) => {
    setEditText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div className="flex items-start gap-3 group">
      {/* Avatar */}
      <UserAvatar
        name={comment.author_name ?? 'User'}
        avatar={comment.author_avatar}
        size="sm"
        color={comment.author_color}
        className="flex-shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        {/* Author + time */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[12px] font-semibold text-white">
            {comment.author_name ?? 'Unknown'}
          </span>
          <span className="text-[10px] text-[#444]">
            {timeAgo(comment.created_at)}
          </span>
          {edited && (
            <span className="text-[10px] text-[#333] italic">edited</span>
          )}
        </div>

        {/* Body or edit textarea */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={2}
              className="w-full bg-[#1a1a1a] border border-[#2196f3]/40 rounded-lg px-3 py-2.5 text-[13px] text-white outline-none resize-none leading-relaxed"
              placeholder="Edit comment…"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSave(comment.id)}
                disabled={saving || !editText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2196f3] hover:bg-[#1976d2] text-white text-[11px] font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Save'
                }
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1.5 text-[11px] text-[#666] hover:text-white bg-transparent hover:bg-[#1e1e1e] rounded-lg transition-all"
              >
                Cancel
              </button>
              <span className="text-[10px] text-[#333] ml-1">⌘↵ to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#1e1e1e] rounded-xl px-3.5 py-3 relative">
            <p className="text-[13px] text-[#bbb] leading-relaxed whitespace-pre-wrap break-words">
              {comment.body}
            </p>

            {/* Actions (own comments only) */}
            {isOwn && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onStartEdit(comment)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#555] hover:text-[#aaa] hover:bg-[#222] rounded-md transition-all"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#555] hover:text-[#e53935] hover:bg-[#2a1a1a] rounded-md transition-all"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}