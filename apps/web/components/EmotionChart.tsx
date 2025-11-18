'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DominantEmotion } from '@/lib/api';
import { getEmotionEmoji } from '@/lib/utils';

interface Props {
  emotions: DominantEmotion[];
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
];

export default function EmotionChart({ emotions }: Props) {
  const data = emotions.map((e) => ({
    name: e.emotion,
    value: e.count,
    percentage: e.percentage
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${getEmotionEmoji(name)} ${percentage.toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, props: any) => [
            `${props.payload.percentage.toFixed(1)}% (${value} mentions)`,
            props.payload.name
          ]}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
