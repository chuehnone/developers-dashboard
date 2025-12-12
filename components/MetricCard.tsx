import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: number;
  trendLabel?: string;
  icon: LucideIcon;
  inverseTrend?: boolean; // If true, negative trend is good (e.g., cycle time)
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  trendLabel = "vs last period", 
  icon: Icon,
  inverseTrend = false
}) => {
  const isPositive = trend > 0;
  const isGood = inverseTrend ? !isPositive : isPositive;
  
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
          <Icon size={20} />
        </div>
      </div>
      
      <div className="flex items-center text-sm">
        <span className={`
          flex items-center font-medium mr-2
          ${isGood ? 'text-emerald-500' : 'text-rose-500'}
        `}>
          {isPositive ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-slate-500">{trendLabel}</span>
      </div>
    </div>
  );
};