// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Ship, 
  Activity, 
  Calendar, 
  MapPin, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface PortMetric {
  id: number;
  timestamp: string;
  location: string;
  vessel_count: number;
}

export default function Home() {
  const [metrics, setMetrics] = useState<PortMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data: PortMetric[] = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telemetry offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const previousMetric = metrics.length > 1 ? metrics[metrics.length - 2] : null;
  
  const trend = latestMetric && previousMetric 
    ? latestMetric.vessel_count - previousMetric.vessel_count 
    : 0;

  const chartData = metrics.map(m => ({
    time: new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    count: m.vessel_count
  }));

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-[#d1d1d1] font-mono selection:bg-orange-500/30">
      {/* Top Navigation Bar */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.4)]">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-white uppercase">Orbital Freight Intel</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/40">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Stream
            </div>
            <button onClick={fetchMetrics} className="hover:text-white transition-colors cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12 border-l-2 border-orange-600 pl-6">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">Maritime Traffic Intelligence</h1>
          <p className="text-white/40 max-w-2xl leading-relaxed">
            Real-time vessel detection via Sentinel-1 Synthetic Aperture Radar (SAR). Monitoring logistics bottlenecks across key economic zones.
          </p>
        </div>

        {error ? (
          <div className="bg-red-950/20 border border-red-500/50 p-8 rounded-lg flex items-center gap-4 text-red-200">
            <AlertCircle className="w-6 h-6" />
            <p>System Failure: {error}. Verify database connectivity and .env configuration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Metric Card */}
            <div className="lg:col-span-1 bg-[#121214] border border-white/5 rounded-lg p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ship className="w-32 h-32" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-white/40 mb-6 uppercase text-[10px] tracking-widest font-bold">
                  <Activity className="w-3 h-3 text-orange-500" />
                  Current Congestion
                </div>
                
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-7xl font-black text-white tabular-nums tracking-tighter">
                    {loading ? '---' : latestMetric?.vessel_count || 0}
                  </span>
                  <span className="text-white/20 text-xl font-bold uppercase">Vessels</span>
                </div>

                {trend !== 0 && (
                  <div className={`text-xs font-bold uppercase flex items-center gap-1 ${trend > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                    {trend > 0 ? '▲' : '▼'} {Math.abs(trend)} from last pass
                  </div>
                )}

                <div className="mt-12 space-y-4 pt-12 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 uppercase tracking-widest">Location</span>
                    <span className="text-white font-bold flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      {latestMetric?.location || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 uppercase tracking-widest">Last Scan</span>
                    <span className="text-white font-bold flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-orange-500" />
                      {latestMetric ? new Date(latestMetric.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualization Card */}
            <div className="lg:col-span-2 bg-[#121214] border border-white/5 rounded-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-white/40 uppercase text-[10px] tracking-widest font-bold">
                  <Activity className="w-3 h-3 text-orange-500" />
                  30-Day Trend Analysis
                </div>
                <div className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                  Resolution: 10M / Pass
                </div>
              </div>

              <div className="h-[300px] w-full">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center text-white/10 italic">
                    Acquiring Signal...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#121214', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontSize: '12px',
                          color: '#fff',
                          borderRadius: '4px'
                        }}
                        itemStyle={{ color: '#ea580c' }}
                        cursor={{ stroke: '#ea580c', strokeWidth: 1 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#ea580c" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Data Feed Table */}
            <div className="lg:col-span-3 bg-[#121214] border border-white/5 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="text-white/40 uppercase text-[10px] tracking-widest font-bold">
                  Raw Telemetry Logs
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-white/20 uppercase tracking-tighter">
                      <th className="px-6 py-4 font-bold">Scan ID</th>
                      <th className="px-6 py-4 font-bold">Coordinates / Area</th>
                      <th className="px-6 py-4 font-bold">Timestamp (UTC)</th>
                      <th className="px-6 py-4 font-bold text-right">Detected Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {metrics.slice().reverse().map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 font-mono text-white/40">#{m.id.toString().padStart(4, '0')}</td>
                        <td className="px-6 py-4 text-white/80 font-bold">{m.location}</td>
                        <td className="px-6 py-4 text-white/40">{new Date(m.timestamp).toUTCString()}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="bg-orange-600/10 text-orange-500 px-2 py-1 rounded font-bold border border-orange-500/20">
                            {m.vessel_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer Decoration */}
      <footer className="mt-24 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
            System Status: Nominal // Data Integrity Verified
          </div>
          <div className="flex gap-8 text-[10px] text-white/40 uppercase tracking-widest">
            <span className="hover:text-white cursor-pointer transition-colors underline decoration-orange-500 underline-offset-4">Privacy Protocol</span>
            <span className="hover:text-white cursor-pointer transition-colors underline decoration-orange-500 underline-offset-4">API Documentation</span>
            <span className="hover:text-white cursor-pointer transition-colors underline decoration-orange-500 underline-offset-4">Signal Source: CDSE</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
