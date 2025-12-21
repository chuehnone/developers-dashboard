import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CopilotEditorDistribution } from '../types';

interface EditorDistributionChartProps {
  data: CopilotEditorDistribution[];
}

// Color palette for different editors
const EDITOR_COLORS: Record<string, string> = {
  'VS Code': '#3b82f6',
  'Visual Studio': '#8b5cf6',
  'JetBrains IDEs': '#f43f5e',
  'IntelliJ IDEA': '#f43f5e',
  'PyCharm': '#ec4899',
  'WebStorm': '#06b6d4',
  'Neovim': '#10b981',
  'Vim': '#22c55e',
  'Emacs': '#8b5cf6',
  'Sublime Text': '#f97316',
  'Atom': '#14b8a6',
  'Unknown': '#64748b',
};

const getEditorColor = (editor: string, index: number): string => {
  if (EDITOR_COLORS[editor]) {
    return EDITOR_COLORS[editor];
  }

  // Fallback colors if editor not in map
  const fallbackColors = [
    '#3b82f6', '#8b5cf6', '#f43f5e', '#10b981',
    '#f59e0b', '#06b6d4', '#ec4899', '#64748b'
  ];
  return fallbackColors[index % fallbackColors.length];
};

export const EditorDistributionChart: React.FC<EditorDistributionChartProps> = ({ data }) => {
  // Custom label to show percentage
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    if (percent < 0.05) return null; // Don't show label if less than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-96">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Editor Distribution</h3>
        <p className="text-sm text-slate-400">Which editors are developers using?</p>
      </div>
      <div className="h-full w-full pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              dataKey="count"
              nameKey="editor"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getEditorColor(entry.editor, index)}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                color: '#f1f5f9',
              }}
              itemStyle={{
                color: '#f1f5f9',
              }}
              formatter={(value: number, name: string, entry: any) => [
                `${value} users (${entry.payload.percentage}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
