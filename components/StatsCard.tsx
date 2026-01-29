
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ReactNode;
  colorClass: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, subLabel, icon, colorClass, trend }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
            trend === 'down' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend === 'down' ? 'Optimizado' : 'En Riesgo'}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</h3>
        <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
        {subLabel && <p className="text-[11px] text-slate-400 mt-2 font-medium">{subLabel}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
