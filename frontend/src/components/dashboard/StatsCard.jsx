import React from 'react';
import { BadgeCheck, Folder, CheckSquare, Calendar } from 'lucide-react';

/**
 * StatsCard – displays a single dashboard statistic.
 * Props:
 *   icon: React component from lucide-react
 *   label: string – description of the metric
 *   value: number or string – the metric value
 */
export default function StatsCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center space-x-3 rounded-lg bg-[#111] p-4 shadow-md hover:shadow-lg transition-shadow">
      <Icon className="w-6 h-6 text-[#2196f3]" />
      <div>
        <p className="text-sm text-[#aaa]">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
