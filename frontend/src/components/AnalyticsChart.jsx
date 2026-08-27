import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function AnalyticsChart({ data }) {
  // data should be an array of objects like { time: '10:00', safe: 5, flagged: 2 }
  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-64 mb-6 mt-6 shadow-xl">
      <h3 className="text-gray-300 font-semibold mb-4 text-lg">Traffic Threat Analysis (Real-Time Volume)</h3>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" allowDecimals={false} />
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
          <Area type="monotone" dataKey="safe" stroke="#10B981" fillOpacity={1} fill="url(#colorSafe)" name="Safe Logins" />
          <Area type="monotone" dataKey="flagged" stroke="#EF4444" fillOpacity={1} fill="url(#colorFlagged)" name="Shared/Flagged" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
