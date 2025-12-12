import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DeveloperMetric } from '../types';

interface WorkDistributionChartProps {
  data: DeveloperMetric[];
}

export const WorkDistributionChart: React.FC<WorkDistributionChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-96">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Work Distribution</h3>
      <div className="h-full w-full pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100}
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={false}
            />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="featuresCompleted" name="Features" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="bugsFixed" name="Bugs" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="techDebtTickets" name="Tech Debt" stackId="a" fill="#64748b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};