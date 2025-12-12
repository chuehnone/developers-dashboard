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
import { CycleTimeDaily } from '../types';

interface CycleTimeChartProps {
  data: CycleTimeDaily[];
}

export const CycleTimeChart: React.FC<CycleTimeChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-96">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Cycle Time Breakdown</h3>
        <p className="text-sm text-slate-400">Where is time being spent per day?</p>
      </div>
      <div className="h-full w-full pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={false}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              cursor={{ fill: '#1e293b' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="codingTime" name="Coding" stackId="a" fill="#3b82f6" />
            <Bar dataKey="pickupTime" name="Pickup (Wait)" stackId="a" fill="#f59e0b" />
            <Bar dataKey="reviewTime" name="Review" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
