import StatCard from './StatCard';
import { StatCardsSkeleton } from '../common/Skeleton';

// Icons
const FolderIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const TrendingIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

/**
 * StatsSection
 *
 * Props:
 *   stats   – stats object from getDashboardStats()
 *   loading – boolean
 *
 * Expected stats shape:
 * {
 *   total_projects:  number,
 *   projects_delta:  string,   // e.g. "+12%"
 *   total_tasks:     number,
 *   tasks_delta:     string,
 *   in_progress:     number,
 *   completion_rate: number,   // 0-100
 *   rate_delta:      string,
 * }
 */
export default function StatsSection({ stats, loading }) {
  if (loading) return <StatCardsSkeleton />;

  // Fallback values so the UI never crashes with null stats
  const s = stats ?? {};

  const cards = [
    {
      label:  'Total Projects',
      value:  s.total_projects  ?? 0,
      delta:  s.projects_delta  ?? null,
      sub:    s.active_projects != null ? `${s.active_projects} active` : 'projects',
      trend:  'up',
      icon:   <FolderIcon />,
      accent: 'bg-[#2196f3]/10',
    },
    {
      label:  'Total Tasks',
      value:  s.total_tasks     ?? 0,
      delta:  s.tasks_delta     ?? null,
      sub:    s.completed_tasks != null ? `${s.completed_tasks} completed` : 'tasks',
      trend:  'up',
      icon:   <CheckIcon />,
      accent: 'bg-[#4caf50]/10',
    },
    {
      label:  'In Progress',
      value:  s.in_progress     ?? 0,
      delta:  null,
      sub:    'tasks being worked on',
      trend:  'neutral',
      icon:   <ClockIcon />,
      accent: 'bg-[#ff9800]/10',
    },
    {
      label:  'Completion Rate',
      value:  `${s.completion_rate ?? 0}%`,
      delta:  s.rate_delta      ?? null,
      sub:    'this month',
      trend:  (s.completion_rate ?? 0) >= 50 ? 'up' : 'down',
      icon:   <TrendingIcon />,
      accent: 'bg-[#9c27b0]/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}