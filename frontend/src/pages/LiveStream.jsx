import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Activity } from 'lucide-react';

export default function LiveStream() {
    const [events, setEvents] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ total: 0, flagged: 0 });

    const API_URL = "http://localhost:8000/ingest";

    const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"];
    const devices = ["Windows", "Mac", "iOS", "Android"];

    const generateRandomIP = () => `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    const generateDatacenterIP = () => `104.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`; // mock datacenter IP

    const USER_POOL_SIZE = 200;
    const userPool = useRef([]);

    useEffect(() => {
        // Initialize pool of users
        const pool = [];
        for(let i=0; i<USER_POOL_SIZE; i++) {
            pool.push({
                id: "usr_" + uuidv4().substring(0, 8),
                isSharedBehavior: Math.random() > 0.65, // Increased to 35% shared accounts (was 15%)
                baseCity: cities[Math.floor(Math.random() * cities.length)],
                baseDevice: devices[Math.floor(Math.random() * devices.length)],
                baseIp: generateRandomIP(),
                baseFp: "fp_" + uuidv4().substring(0, 12),
            });
        }
        userPool.current = pool;
    }, []);

    const userTimestamps = useRef({});

    const sendEvent = async () => {
        if (userPool.current.length === 0) return;

        // Pick a random user
        const randomUser = userPool.current[Math.floor(Math.random() * userPool.current.length)];
        const isShared = randomUser.isSharedBehavior;
        const userId = randomUser.id;
        
        let eventTime;
        if (!userTimestamps.current[userId]) {
            eventTime = new Date();
        } else {
            // Shared accounts log in 5-30 mins later (fast travel). Normal users 2-24 hours later.
            const minsToAdd = isShared ? (Math.floor(Math.random() * 25) + 5) : (Math.floor(Math.random() * (24*60 - 120)) + 120);
            eventTime = new Date(userTimestamps.current[userId].getTime() + minsToAdd * 60000);
        }
        userTimestamps.current[userId] = eventTime;

        // Generate properties based on behavior type
        const isAnomaly = isShared && Math.random() > 0.1; // Increased to 90% chance to exhibit shared behavior (was 70%)
        const useVpn = isAnomaly && Math.random() > 0.5; // 50% chance of anomaly using a VPN

        const event = {
            user_id: userId,
            event_id: uuidv4(),
            timestamp: eventTime.toISOString(),
            event_type: "login",
            ip_address: useVpn ? generateDatacenterIP() : (isAnomaly ? generateRandomIP() : randomUser.baseIp),
            city: isAnomaly ? cities[Math.floor(Math.random() * cities.length)] : randomUser.baseCity,
            device: isAnomaly ? devices[Math.floor(Math.random() * devices.length)] : randomUser.baseDevice,
            device_fingerprint: isAnomaly ? "fp_" + uuidv4().substring(0, 12) : randomUser.baseFp
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event)
            });
            const result = await response.json();
            
            const newEvent = { ...event, result };
            
            setEvents(prev => [newEvent, ...prev].slice(0, 100));
            setStats(prev => ({
                total: prev.total + 1,
                flagged: prev.flagged + (result.is_flagged_shared ? 1 : 0)
            }));
        } catch (err) {
            console.error("Failed to send event", err);
        }
    };

    useEffect(() => {
        let interval;
        if (isSimulating) {
            interval = setInterval(sendEvent, 1200); // slightly slower to read the text
        }
        return () => clearInterval(interval);
    }, [isSimulating]);

    return (
        <div className="space-y-6">
            
            <div className="flex justify-end mb-4">
              <button 
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-700 flex items-center gap-2"
              >
                  <Activity size={16} />
                  {showAnalytics ? 'Hide Analytics Dashboard' : 'View Analytics Dashboard'}
              </button>
          </div>

          <AnimatePresence>
              {showAnalytics && (
                  <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                  >
                      <AdvancedAnalytics events={events} />
                  </motion.div>
              )}
          </AnimatePresence>

          <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-semibold text-zinc-100">Live Inference Stream</h2>
                    <p className="text-zinc-400 text-sm mt-1">Simulating high-volume Amazon Prime traffic.</p>
                </div>
                <div className="flex items-center space-x-8">
                    <div className="text-right">
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Processed</div>
                        <div className="text-2xl font-mono text-zinc-100">{stats.total}</div>
                    </div>
                    <div className="text-right border-l border-zinc-800 pl-8">
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Anomalies</div>
                        <div className="text-2xl font-mono text-red-500">{stats.flagged}</div>
                    </div>
                    <button 
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`ml-4 flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${isSimulating ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'}`}
                    >
                        {isSimulating ? <><Square size={18} /><span>Stop Feed</span></> : <><Play size={18} /><span>Start Feed</span></>}
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-950/50">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-3">User ID</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Device & IP</div>
                    <div className="col-span-3">Risk Assessment</div>
                </div>
                <div className="divide-y divide-zinc-800/50 h-[600px] overflow-y-auto">
                    <AnimatePresence>
                        {events.map((ev) => (
                            <motion.div 
                                key={ev.event_id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col transition-colors ${ev.result?.is_flagged_shared ? 'bg-red-950/20 border-l-2 border-red-500' : 'hover:bg-zinc-800/30 border-l-2 border-transparent'}`}
                            >
                                <div className="grid grid-cols-12 gap-4 p-4 items-center">
                                    <div className="col-span-2 text-sm text-zinc-400 font-mono">
                                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        <div className="text-xs text-zinc-600">{new Date(ev.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <div className="col-span-3 font-mono text-sm truncate text-zinc-300">
                                        {ev.user_id}
                                    </div>
                                    <div className="col-span-2 text-sm text-zinc-200">
                                        {ev.city}
                                    </div>
                                    <div className="col-span-2 text-sm text-zinc-300">
                                        {ev.device} <br/>
                                        <span className="text-xs text-zinc-500 font-mono">{ev.ip_address}</span>
                                    </div>
                                    <div className="col-span-3 flex flex-col justify-center">
                                        <div className="flex items-center justify-between mb-1">
                                            {ev.result?.is_flagged_shared ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                                                    Shared
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                                    Normal
                                                </span>
                                            )}
                                            <span className={`text-xs font-mono font-bold ${ev.result?.is_flagged_shared ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {ev.result?.risk_score}/100
                                            </span>
                                        </div>
                                        <div className="w-full bg-zinc-900 rounded-full h-1.5 mb-1.5 overflow-hidden">
                                            <div className={`h-1.5 rounded-full ${ev.result?.is_flagged_shared ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${ev.result?.risk_score || 0}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                            <span>Math: {ev.result?.math_score || 0}</span>
                                            <span>ML: {ev.result?.ml_score || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                {ev.result?.is_vpn && (
                                    <div className="px-4 pb-2 -mt-1 ml-4 border-l-2 border-orange-500/50 pl-4">
                                        <div className="text-xs text-orange-300/80 bg-orange-950/30 inline-block px-3 py-1.5 rounded-lg border border-orange-900/50">
                                            🛡️ <strong>VPN / Proxy Detected:</strong> IP {ev.ip_address} belongs to a known Datacenter/VPN provider.
                                        </div>
                                    </div>
                                )}
                                {ev.result?.device_changed && (
                                    <div className="px-4 pb-2 -mt-1 ml-4 border-l-2 border-yellow-500/50 pl-4">
                                        <div className="text-xs text-yellow-300/80 bg-yellow-950/30 inline-block px-3 py-1.5 rounded-lg border border-yellow-900/50">
                                            💻 <strong>New Device Fingerprint:</strong> {ev.device_fingerprint} (previously {ev.result.prev_fingerprint})
                                        </div>
                                    </div>
                                )}
                                {ev.result?.impossible_travel && ev.result.impossible_travel.is_impossible && (
                                    <div className="px-4 pb-3 -mt-1 ml-4 border-l-2 border-red-500/50 pl-4">
                                        <div className="text-xs text-red-300/80 bg-red-950/30 inline-block px-3 py-1.5 rounded-lg border border-red-900/50">
                                            ⚠️ <strong>Impossible Travel Detected:</strong> {ev.result.impossible_travel.distance_hexes.toLocaleString()} hexes from {ev.result.impossible_travel.prev_city} to {ev.city} in just {ev.result.impossible_travel.time_diff_mins} mins 
                                            (Req. speed: {ev.result.impossible_travel.speed_hex_h.toLocaleString()} hexes/h)
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {events.length === 0 && (
                            <div className="p-16 text-center text-zinc-600 flex flex-col items-center justify-center h-full">
                                <Activity size={48} className="opacity-20 mb-4" />
                                <p>System standing by. Start the live feed to begin inference.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
