'use client';

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#a3e635', '#34d399', '#2dd4bf', '#fbbf24', '#fb7185', '#38bdf8'];

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(6,24,17,.95)', border: '1px solid rgba(163,230,53,.35)',
    borderRadius: 12, color: '#eafff4', fontSize: 13,
  },
};

export function MonthlyBarChart({ data, dataKey = 'total', xKey = 'label', color = '#34d399' }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(52,211,153,.1)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#8fb8a6', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8fb8a6', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(16,185,129,.08)' }} />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} maxBarSize={42} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyLineChart({ data, dataKey = 'total', xKey = 'label' }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(52,211,153,.1)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#8fb8a6', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8fb8a6', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Line type="monotone" dataKey={dataKey} stroke="#a3e635" strokeWidth={2.5}
          dot={{ fill: '#a3e635', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ResultPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}
          paddingAngle={4} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8fb8a6' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
