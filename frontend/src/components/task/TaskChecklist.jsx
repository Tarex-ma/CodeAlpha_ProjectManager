import { useRef } from 'react';

/**
 * TaskChecklist
 *
 * Props:
 *   checklist       – [{ id, title, done }]
 *   doneCount       – number
 *   pct             – 0-100
 *   newCheckItem    – string
 *   setNewCheckItem – (v) => void
 *   addingCheck     – boolean
 *   onAdd           – async () => void
 *   onToggle        – async (id, done) => void
 *   onDelete        – async (id) => void
 *   readOnly        – boolean
 */
export default function TaskChecklist({
  checklist,
  doneCount,
  pct,
  newCheckItem,
  setNewCheckItem,
  addingCheck,
  onAdd,
  onToggle,
  onDelete,
  readOnly = false,
}) {
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onAdd(); }
    if (e.key === 'Escape') { setNewCheckItem(''); inputRef.current?.blur(); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <span className="text-[12px] font-semibold text-[#888] uppercase tracking-wider">Checklist</span>
          <span className="text-[10px] text-[#444]">{doneCount}/{checklist.length}</span>
        </div>
        <span className="text-[11px] font-medium text-[#555]">{pct}%</span>
      </div>

      {/* Progress bar */}
      {checklist.length > 0 && (
        <div className="h-1 bg-[#1a1a1a] rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:      `${pct}%`,
              background: pct === 100 ? '#4caf50' : '#2196f3',
              boxShadow:  pct === 100 ? '0 0 6px #4caf5066' : '0 0 6px #2196f366',
            }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1 mb-3">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 group py-1.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            {/* Checkbox */}
            <button
              onClick={() => !readOnly && onToggle(item.id, !item.done)}
              disabled={readOnly}
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                item.done
                  ? 'bg-[#4caf50] border-[#4caf50]'
                  : 'border-[#2a2a2a] hover:border-[#4caf50]/50'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.done && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>

            {/* Label */}
            <span className={`flex-1 text-[12px] leading-relaxed transition-all ${item.done ? 'line-through text-[#444]' : 'text-[#bbb]'}`}>
              {item.title}
            </span>

            {/* Delete */}
            {!readOnly && (
              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[#444] hover:text-[#e53935] transition-all rounded"
                aria-label="Delete checklist item"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add item input */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#1a1a1a] border border-[#222] focus-within:border-[#2196f3]/40 rounded-lg px-3 py-2 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <input
              ref={inputRef}
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an item…"
              className="flex-1 bg-transparent text-[12px] text-white placeholder:text-[#333] outline-none"
            />
          </div>
          {newCheckItem.trim() && (
            <button
              onClick={onAdd}
              disabled={addingCheck}
              className="px-3 py-2 bg-[#2196f3] hover:bg-[#1976d2] text-white text-[11px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {addingCheck
                ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Add'
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}