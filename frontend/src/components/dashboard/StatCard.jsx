/**
 * StatCard
 *
 * Props:
 *   label   – string label
 *   value   – main metric value
 *   delta   – change string e.g. "+12%"
 *   sub     – subtitle / description
 *   trend   – "up" | "down" | "neutral"
 *   icon    – JSX icon element
 *   accent  – tailwind bg color class for the icon bubble
 */
export default function StatCard({ label, value, delta, sub, trend = 'up', icon, accent = 'bg-[#2196f3]/10' }) {
  const trendColor = trend === 'up' ? 'text-[#4caf50]' : trend === 'down' ? 'text-[#e53935]' : 'text-[#888]';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="group bg-[#161616] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-xl p-5 transition-all duration-200 relative overflow-hidden">
      {/* Subtle hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={`w-8 h-8 ${accent} rounded-lg flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-[26px] font-semibold text-white tracking-tight leading-none mb-1.5">
        {value}
      </p>

      <div className="flex items-center gap-2">
        {delta && (
          <span className={`text-[11px] font-medium ${trendColor}`}>
            {trendArrow} {delta}
          </span>
        )}
        {sub && (
          <span className="text-[11px] text-[#444]">{sub}</span>
        )}
      </div>
    </div>
  );
}