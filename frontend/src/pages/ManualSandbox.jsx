import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, RefreshCw, Send, Fingerprint } from 'lucide-react';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function ManualSandbox() {
    const API_URL = "http://localhost:8000/ingest";
    const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"];
    const devices = ["Windows", "Mac", "iOS", "Android"];

    const [userId, setUserId] = useState("manual-user-1234");
    const [city, setCity] = useState("Mumbai");
    const [device, setDevice] = useState("Windows");
    const [ipAddress, setIpAddress] = useState("192.168.1.50");
    const [realFingerprint, setRealFingerprint] = useState("Loading...");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize an agent at application startup.
        fpPromise.load().then(fp => fp.get()).then(result => {
            // This is the visitor identifier:
            setRealFingerprint(result.visitorId);
        });
    }, []);

    const generateRandomIP = () => {
        setIpAddress(`${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`);
    };

    const submitEvent = async (e) => {
        e.preventDefault();
        setLoading(true);

        const event = {
            user_id: userId,
            event_id: uuidv4(),
            timestamp: new Date().toISOString(),
            event_type: "login",
            ip_address: ipAddress,
            city: city,
            device: device,
            device_fingerprint: realFingerprint,
            is_manual: true
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event)
            });
            const result = await response.json();
            
            setEvents(prev => [{ ...event, result }, ...prev]);
        } catch (err) {
            console.error("Failed", err);
        } finally {
            setLoading(false);
        }
    };

    const isFlagged = events.length > 0 && events[0].result.is_flagged_shared;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Input Form */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-100 mb-6">Manual ML Trigger Sandbox</h2>
                    
                    <form onSubmit={submitEvent} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">User ID (Target)</label>
                            <input 
                                type="text" 
                                value={userId}
                                onChange={e => setUserId(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Location</label>
                                <select 
                                    value={city} 
                                    onChange={e => setCity(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500 transition-all"
                                >
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Device</label>
                                <select 
                                    value={device} 
                                    onChange={e => setDevice(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500 transition-all"
                                >
                                    {devices.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Simulated IP Address</label>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    value={ipAddress}
                                    onChange={e => setIpAddress(e.target.value)}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono text-sm"
                                />
                                <button 
                                    type="button"
                                    onClick={generateRandomIP}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center justify-center"
                                    title="Generate Random IP"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                            <span>Submit Event for Inference</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Right: Results / History */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* Status Card */}
                <div className={`p-6 rounded-2xl border transition-all ${events.length === 0 ? 'bg-zinc-900 border-zinc-800' : isFlagged ? 'bg-red-950/20 border-red-500/30' : 'bg-emerald-950/10 border-emerald-500/20'}`}>
                    <div className="flex items-center space-x-4">
                        <div className={`p-4 rounded-xl ${events.length === 0 ? 'bg-zinc-800 text-zinc-500' : isFlagged ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {events.length === 0 ? <ShieldCheck size={32} /> : isFlagged ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-100">
                                {events.length === 0 ? "Awaiting Events" : isFlagged ? "Account Compromised" : "Account Secure"}
                            </h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                {events.length === 0 ? "Submit an event to test the model." : isFlagged ? "Model detected suspicious sharing behavior." : "Behavior matches normal user patterns."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 font-semibold text-zinc-100">
                        Session History ({events.length})
                    </div>
                    <div className="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
                        <AnimatePresence>
                            {events.map((ev) => (
                                <motion.div 
                                    key={ev.event_id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className={`p-4 flex flex-col justify-between text-sm ${ev.result?.is_flagged_shared ? 'bg-red-950/10' : ''}`}
                                >
                                    <div className="flex justify-between mb-2">
                                        <div>
                                            <div className="font-medium text-zinc-200">{ev.city} <span className="text-zinc-500 mx-2">•</span> {ev.device}</div>
                                            <div className="text-zinc-500 font-mono text-xs mt-1">{ev.ip_address}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${ev.result?.is_flagged_shared ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {ev.result?.is_flagged_shared ? "FLAGGED" : "NORMAL"}
                                            </div>
                                            <div className="text-zinc-500 text-xs mt-1">
                                                {new Date(ev.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    {ev.result?.risk_score !== undefined && (
                                        <div className="mt-2 pt-2 border-t border-zinc-800/50">
                                            <div className="flex justify-between items-center text-xs mb-1 font-mono">
                                                <span className="text-zinc-400">Risk Score</span>
                                                <span className={`font-bold ${ev.result.is_flagged_shared ? 'text-red-400' : 'text-emerald-400'}`}>{ev.result.risk_score}/100</span>
                                            </div>
                                            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-1.5 rounded-full ${ev.result.is_flagged_shared ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${ev.result.risk_score}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                                                <span>Math: {ev.result.math_score}</span>
                                                <span>ML: {ev.result.ml_score}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {events.length === 0 && (
                                <div className="p-8 text-center text-zinc-500 text-sm">
                                    No events submitted in this session.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
