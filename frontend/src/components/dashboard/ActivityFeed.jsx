import { ActivitySkeleton } from '../common/Skeleton';

const ACTION_CONFIG = {
  created_project: { color: '#4caf50', icon: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )},
  completed_task: { color: '#2196f3', icon: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )},
  commented: { color: '#ff9800', icon: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )},
  assigned_task: { color: '#9c27b0', icon: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  moved_task: { color: '#00bcd4', icon: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 9 2 12 5 15"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  )},
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * ActivityFeed
 *
 * Props:
 *   activity – array of activity objects
 *   loading  – boolean
 */
export default function ActivityFeed({ activity, loading }) {
  return (
    <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1e1e1e]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <h2 className="text-[13px] font-semibold text-white">Activity</h2>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <ActivitySkeleton />
        ) : (Array.isArray(activity) ? activity : []).length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[#444]">No recent activity</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[13px] top-4 bottom-4 w-px bg-[#1e1e1e]" aria-hidden="true" />

            <div className="space-y-4">
              {(Array.isArray(activity) ? activity : []).map((item, idx) => {
                const cfg = ACTION_CONFIG[item.action] ?? ACTION_CONFIG.completed_task;
                return (
                  <div key={item.id ?? idx} className="flex items-start gap-3 relative">
                    {/* Action icon bubble */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}33`, color: cfg.color }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[12px] text-[#aaa] leading-relaxed">
                        <span className="text-white font-medium">
                          {item.user?.name ?? item.user?.username ?? 'Someone'}
                        </span>{' '}
                        {item.message ?? item.description}
                      </p>
                      {item.project_name && (
                        <p className="text-[10px] mt-0.5" style={{ color: item.project_color ?? '#555' }}>
                          {item.project_name}
                        </p>
                      )}
                      <p className="text-[10px] text-[#444] mt-1">
                        {item.created_at ? timeAgo(item.created_at) : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}