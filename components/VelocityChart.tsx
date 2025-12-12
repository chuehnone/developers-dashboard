import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DeveloperMetric } from '../types';

interface VelocityChartProps {
  data: DeveloperMetric[];
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-96">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Velocity vs. Merge Volume</h3>
      <div className="h-full w-full pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              yAxisId="left" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={false}
              label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={false}
              label={{ value: 'PRs Merged', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar 
              yAxisId="left" 
              dataKey="velocity" 
              name="Story Points" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="prsMerged" 
              name="PRs Merged" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};