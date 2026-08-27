import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const CITY_COORDS = {
  "Mumbai": { x: 72.8, y: 19.0 },
  "Delhi": { x: 77.2, y: 28.6 },
  "Bangalore": { x: 77.5, y: 12.9 },
  "Hyderabad": { x: 78.4, y: 17.3 },
  "Chennai": { x: 80.2, y: 13.0 },
  "Kolkata": { x: 88.3, y: 22.5 },
  "Pune": { x: 73.8, y: 18.5 },
  "Ahmedabad": { x: 72.5, y: 23.0 },
  "Jaipur": { x: 75.7, y: 26.9 },
  "Surat": { x: 72.8, y: 21.1 }
};

export default function AdvancedAnalytics({ events }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Memoize all calculations so they only update when events change
  const { volumeData, riskData, deviceData, radarData, geoData } = useMemo(() => {
    // Volume Data (mocked time series based on current events array order)
    const volume = [];
    let safeCount = 0;
    let flaggedCount = 0;
    
    // Risk Data
    let low = 0, med = 0, high = 0;
    
    // Device Data
    const devices = {};
    
    // Radar Data
    let mlFlag = 0, mathFlag = 0, proxyFlag = 0, safe = 0;
    
    // Geo Data
    const geo = [];

    // Process from oldest to newest for volume trend
    const reversedEvents = [...events].reverse();

    reversedEvents.forEach((ev, i) => {
      if (!ev.result) return;

      const isFlagged = ev.result.is_flagged_shared;
      const mlScore = ev.result.ml_score || 0;
      const mathScore = ev.result.math_score || 0;
      const device = ev.device || "Unknown";
      const isVpn = ev.result.is_vpn || false;
      const city = ev.city;

      // Volume
      if (isFlagged) flaggedCount++;
      else safeCount++;
      
      if (i % 5 === 0 || i === reversedEvents.length - 1) {
          volume.push({ time: i, safe: safeCount, flagged: flaggedCount });
      }

      // Risk
      const score = Math.max(mlScore, mathScore);
      if (score < 30) low++;
      else if (score < 70) med++;
      else high++;

      // Device
      devices[device] = (devices[device] || 0) + 1;

      // Radar
      if (!isFlagged) safe++;
      else {
          if (mlScore >= 50) mlFlag++;
          if (mathScore >= 50) mathFlag++;
          if (isVpn) proxyFlag++;
      }
      
      // Geo
      if (city && CITY_COORDS[city]) {
          const coords = CITY_COORDS[city];
          geo.push({
              x: coords.x + (Math.random() * 0.5 - 0.25), // add slight jitter for overlapping
              y: coords.y + (Math.random() * 0.5 - 0.25),
              z: isFlagged ? 100 : 20,
              fill: isFlagged ? '#EF4444' : '#10B981',
              city: city
          });
      }
    });

    return {
      volumeData: volume,
      riskData: [
        { name: 'Low Risk', value: low, fill: '#10B981' },
        { name: 'Med Risk', value: med, fill: '#F59E0B' },
        { name: 'High Risk', value: high, fill: '#EF4444' }
      ],
      deviceData: Object.keys(devices).map(k => ({ name: k, value: devices[k] })),
      radarData: [
        { subject: 'ML Model Flag', A: mlFlag, fullMark: Math.max(10, events.length) },
        { subject: 'Impossible Travel', A: mathFlag, fullMark: Math.max(10, events.length) },
        { subject: 'Proxy/VPN', A: proxyFlag, fullMark: Math.max(10, events.length) },
        { subject: 'Normal', A: safe, fullMark: Math.max(10, events.length) }
      ],
      geoData: geo
    };
  }, [events]);

  const renderTabContent = () => {
    if (events.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Waiting for events to generate analytics...
        </div>
      );
    }

    if (activeTab === 'overview') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 h-64">
            <h3 className="text-zinc-300 font-semibold mb-4 text-sm">Traffic Volume Trend</h3>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={volumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                <XAxis dataKey="time" hide />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #3F3F46' }} />
                <Area type="monotone" dataKey="safe" stroke="#10B981" fillOpacity={1} fill="url(#colorSafe)" />
                <Area type="monotone" dataKey="flagged" stroke="#EF4444" fillOpacity={1} fill="url(#colorFlagged)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 h-64">
            <h3 className="text-zinc-300 font-semibold mb-4 text-sm">Risk Score Distribution</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={riskData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip cursor={{fill: '#27272A'}} contentStyle={{ backgroundColor: '#18181B', border: '1px solid #3F3F46' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (activeTab === 'threats') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 h-64">
            <h3 className="text-zinc-300 font-semibold mb-4 text-sm">Device Fingerprint Breakdown</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #3F3F46' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 h-64">
            <h3 className="text-zinc-300 font-semibold mb-4 text-sm">Threat Vector Analysis</h3>
            <ResponsiveContainer width="100%" height="80%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#3F3F46" />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={10} />
                <Radar name="Flags" dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #3F3F46' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (activeTab === 'geo') {
      return (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 h-64">
            <h3 className="text-zinc-300 font-semibold mb-2 text-sm">Geographic Threat Map (India)</h3>
            <ResponsiveContainer width="100%" height="90%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis type="number" dataKey="x" name="Longitude" domain={[68, 98]} hide />
                <YAxis type="number" dataKey="y" name="Latitude" domain={[8, 38]} hide />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-white">
                          <p>{data.city}</p>
                          <p>{data.fill === '#EF4444' ? 'Flagged Activity' : 'Safe Activity'}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Events" data={geoData} fill="#8884d8">
                  {geoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl mb-6">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-950/50 p-2 gap-2">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          Traffic Overview
        </button>
        <button 
          onClick={() => setActiveTab('threats')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'threats' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          Threat Vectors
        </button>
        <button 
          onClick={() => setActiveTab('geo')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'geo' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          Geographic Map
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
