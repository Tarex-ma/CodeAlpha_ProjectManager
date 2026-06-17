// ── Priority ──────────────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#4caf50', bg: 'bg-[#1b3a2e]', text: 'text-[#4caf50]', border: 'border-[#4caf50]/30', dot: 'bg-[#4caf50]' },
  medium: { label: 'Medium', color: '#2196f3', bg: 'bg-[#1a2a3a]', text: 'text-[#2196f3]', border: 'border-[#2196f3]/30', dot: 'bg-[#2196f3]' },
  high:   { label: 'High',   color: '#ff9800', bg: 'bg-[#3a2a1a]', text: 'text-[#ff9800]', border: 'border-[#ff9800]/30', dot: 'bg-[#ff9800]' },
  urgent: { label: 'Urgent', color: '#e53935', bg: 'bg-[#3a1a1a]', text: 'text-[#e53935]', border: 'border-[#e53935]/30', dot: 'bg-[#e53935]' },
};

// ── Status ────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: '#666',    bg: 'bg-[#1e1e1e]', text: 'text-[#888]'    },
  in_progress: { label: 'In Progress', color: '#2196f3', bg: 'bg-[#1a2a3a]', text: 'text-[#2196f3]' },
  review:      { label: 'Review',      color: '#ff9800', bg: 'bg-[#3a2a1a]', text: 'text-[#ff9800]' },
  done:        { label: 'Done',        color: '#4caf50', bg: 'bg-[#1b3a2e]', text: 'text-[#4caf50]' },
};

// ── Labels ────────────────────────────────────────────────────────
export const LABEL_CONFIG = {
  frontend:      { color: '#2196f3', bg: 'bg-[#1a2a3a]' },
  backend:       { color: '#4caf50', bg: 'bg-[#1b3a2e]' },
  design:        { color: '#9c27b0', bg: 'bg-[#2a1a3a]' },
  devops:        { color: '#ff9800', bg: 'bg-[#3a2a1a]' },
  mobile:        { color: '#00bcd4', bg: 'bg-[#1a3a3a]' },
  security:      { color: '#e53935', bg: 'bg-[#3a1a1a]' },
  documentation: { color: '#607d8b', bg: 'bg-[#1e2a30]' },
  testing:       { color: '#795548', bg: 'bg-[#2a1e1a]' },
};

// ── Date helpers ──────────────────────────────────────────────────
export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
    ...opts,
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

export function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const diff = Math.round((new Date(dateStr) - new Date()) / 86_400_000);
  return diff >= 0 && diff <= 3;
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── Avatar helpers ────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#7c5cbf', '#2196f3', '#4caf50', '#ff9800',
  '#e91e63', '#00bcd4', '#f44336', '#607d8b',
];

export function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}