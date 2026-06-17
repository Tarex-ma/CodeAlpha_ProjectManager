// ── Priority config ───────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#4caf50', bg: 'bg-[#1b3a2e]', text: 'text-[#4caf50]', dot: 'bg-[#4caf50]' },
  medium: { label: 'Medium', color: '#2196f3', bg: 'bg-[#1a2a3a]', text: 'text-[#2196f3]', dot: 'bg-[#2196f3]' },
  high:   { label: 'High',   color: '#ff9800', bg: 'bg-[#3a2a1a]', text: 'text-[#ff9800]', dot: 'bg-[#ff9800]' },
  urgent: { label: 'Urgent', color: '#e53935', bg: 'bg-[#3a1a1a]', text: 'text-[#e53935]', dot: 'bg-[#e53935]' },
};

// ── Label config ──────────────────────────────────────────────────
export const LABEL_OPTIONS = [
  { key: 'frontend',      color: '#2196f3', bg: 'bg-[#1a2a3a]' },
  { key: 'backend',       color: '#4caf50', bg: 'bg-[#1b3a2e]' },
  { key: 'design',        color: '#9c27b0', bg: 'bg-[#2a1a3a]' },
  { key: 'devops',        color: '#ff9800', bg: 'bg-[#3a2a1a]' },
  { key: 'mobile',        color: '#00bcd4', bg: 'bg-[#1a3a3a]' },
  { key: 'security',      color: '#e53935', bg: 'bg-[#3a1a1a]' },
  { key: 'documentation', color: '#607d8b', bg: 'bg-[#1e2a30]' },
  { key: 'testing',       color: '#795548', bg: 'bg-[#2a1e1a]' },
];

// ── Column color palette ──────────────────────────────────────────
export const COLUMN_COLORS = [
  '#7c5cbf', '#2196f3', '#4caf50', '#ff9800',
  '#e91e63', '#00bcd4', '#f44336', '#607d8b',
];

// ── Date helpers ──────────────────────────────────────────────────
export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const d    = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86_400_000);
  if (diff === 0)  return { label: 'Today',     overdue: false, soon: true  };
  if (diff === 1)  return { label: 'Tomorrow',  overdue: false, soon: true  };
  if (diff < 0)    return { label: `${Math.abs(diff)}d ago`, overdue: true, soon: false };
  return {
    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: false,
    soon: diff <= 3,
  };
}

// ── Get label config by key ───────────────────────────────────────
export function getLabelConfig(key) {
  return LABEL_OPTIONS.find((l) => l.key === key) ?? { color: '#888', bg: 'bg-[#222]' };
}