
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
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { SprintMetric } from '../types';

interface JiraVelocityChartProps {
  data: SprintMetric[];
}

export const JiraVelocityChart: React.FC<JiraVelocityChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-96">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Velocity & Planning Accuracy</h3>
        <p className="text-sm text-slate-400">Committed vs. Completed points per sprint</p>
      </div>
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
              label={{ value: 'Points', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={false}
              unit="%"
              domain={[0, 120]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              cursor={{ fill: '#1e293b' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar 
              yAxisId="left"
              dataKey="committedPoints" 
              name="Committed" 
              fill="#475569" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
            />
            <Bar 
              yAxisId="left"
              dataKey="completedPoints" 
              name="Completed" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="sayDoRatio" 
              name="Say/Do Ratio" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
            />
            <ReferenceLine y={85} yAxisId="right" stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
