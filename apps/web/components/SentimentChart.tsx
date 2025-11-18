'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ClimateSnapshot } from '@/lib/api';
import { getSentimentColor } from '@/lib/utils';

interface Props {
  snapshots: ClimateSnapshot[];
}

export default function SentimentChart({ snapshots }: Props) {
  // Reverse to show oldest first
  const data = [...snapshots].reverse().map((snapshot) => ({
    date: new Date(snapshot.windowEnd).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    sentiment: snapshot.aggregateSentiment,
    fullDate: snapshot.windowEnd
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          domain={[-1, 1]}
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px'
          }}
          formatter={(value: number) => [value.toFixed(3), 'Sentiment']}
        />
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
