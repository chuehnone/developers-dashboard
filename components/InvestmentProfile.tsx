
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface InvestmentProfileProps {
  data: { name: string; value: number; color: string }[];
}

export const InvestmentProfile: React.FC<InvestmentProfileProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-96 flex flex-col">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-slate-100">Investment Profile</h3>
        <p className="text-sm text-slate-400">Where are we spending our effort?</p>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
