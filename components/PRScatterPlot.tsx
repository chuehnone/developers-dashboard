import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell
} from 'recharts';
import { PullRequest } from '../types';

interface PRScatterPlotProps {
  data: { size: number; time: number; pr: PullRequest }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl">
        <p className="font-semibold text-slate-100 text-sm mb-1">{data.pr.title}</p>
        <div className="flex items-center gap-2 mb-2">
           <img src={data.pr.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
           <p className="text-xs text-slate-400">{data.pr.author}</p>
        </div>
        <div className="space-y-1 text-xs">
          <p className="text-blue-400">Size: {data.size} lines</p>
          <p className="text-emerald-400">Time: {data.time} hours</p>
        </div>
      </div>
    );
  }
  return null;
};

export const PRScatterPlot: React.FC<PRScatterPlotProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-96">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">PR Size vs. Merge Time</h3>
        <p className="text-sm text-slate-400">Smaller PRs merge faster</p>
      </div>
      <div className="h-full w-full pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="size" 
              name="Lines Changed" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ value: 'Lines Changed', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="time" 
              name="Hours to Merge" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ value: 'Hours to Merge', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="PRs" data={data} fill="#10b981">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.time > 48 ? '#ef4444' : '#10b981'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};