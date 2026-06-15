// src/app/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
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
  AlertCircle,
  Filter,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';

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
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

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
    setMounted(true);
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  // Extract unique locations for the filter
  const locations = useMemo(() => {
    const locs = Array.from(new Set(metrics.map(m => m.location)));
    return ['All', ...locs.sort()];
  }, [metrics]);

  // Filter metrics based on selection
  const filteredMetrics = useMemo(() => {
    if (selectedLocation === 'All') return metrics;
    return metrics.filter(m => m.location === selectedLocation);
  }, [metrics, selectedLocation]);

  const latestMetric = filteredMetrics.length > 0 ? filteredMetrics[filteredMetrics.length - 1] : null;
  const previousMetric = filteredMetrics.length > 1 ? filteredMetrics[filteredMetrics.length - 2] : null;
  
  const trend = latestMetric && previousMetric 
    ? latestMetric.vessel_count - previousMetric.vessel_count 
    : 0;

  const chartData = filteredMetrics.map(m => ({
    time: new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
    count: m.vessel_count
  }));

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0a0b] text-gray-900 dark:text-[#d1d1d1] font-mono selection:bg-orange-500/30 transition-colors duration-300">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.4)]">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-gray-900 dark:text-white uppercase">Orbital Freight Intel</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Stream
            </div>
            
            <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />

            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-gray-500 dark:text-white/40" />
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent text-[10px] uppercase tracking-widest font-bold text-gray-700 dark:text-white/80 focus:outline-none cursor-pointer hover:text-orange-600 dark:hover:text-white transition-colors"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc} className="bg-white dark:bg-[#121214] text-gray-900 dark:text-white">{loc}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-white/40"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button onClick={fetchMetrics} className="hover:text-orange-600 dark:hover:text-white transition-colors cursor-pointer text-gray-500 dark:text-white/40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12 border-l-2 border-orange-600 pl-6">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
            {selectedLocation === 'All' ? 'Global Maritime Intelligence' : `${selectedLocation} Sector Analysis`}
          </h1>
          <p className="text-gray-500 dark:text-white/40 max-w-2xl leading-relaxed">
            SAR-based vessel detection across {selectedLocation === 'All' ? 'Egypt\'s primary logistical nodes' : `the ${selectedLocation} maritime zone`}. 
            Data refined via 10m resolution radar backscatter analysis.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/50 p-8 rounded-lg flex items-center gap-4 text-red-700 dark:text-red-200">
            <AlertCircle className="w-6 h-6" />
            <p>System Failure: {error}. Verify database connectivity.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Metric Card */}
            <div className="lg:col-span-1 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-lg p-8 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ship className="w-32 h-32 text-gray-900 dark:text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/40 mb-6 uppercase text-[10px] tracking-widest font-bold">
                  <Activity className="w-3 h-3 text-orange-500" />
                  Sector Density
                </div>
                
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-7xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                    {loading ? '---' : latestMetric?.vessel_count || 0}
                  </span>
                  <span className="text-gray-400 dark:text-white/20 text-xl font-bold uppercase">Vessels</span>
                </div>

                {trend !== 0 && (
                  <div className={`text-xs font-bold uppercase flex items-center gap-1 ${trend > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {trend > 0 ? '▲' : '▼'} {Math.abs(trend)} from previous pass
                  </div>
                )}

                <div className="mt-12 space-y-4 pt-12 border-t border-gray-100 dark:border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-white/40 uppercase tracking-widest">Active Zone</span>
                    <span className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      {latestMetric?.location || 'Awaiting Data'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-white/40 uppercase tracking-widest">Orbital Revisit</span>
                    <span className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-orange-500" />
                      {latestMetric ? new Date(latestMetric.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualization Card */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-lg p-8 shadow-sm dark:shadow-none transition-colors duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/40 uppercase text-[10px] tracking-widest font-bold">
                  <Activity className="w-3 h-3 text-orange-500" />
                  {selectedLocation} Passage Trend
                </div>
                <div className="text-[10px] text-gray-400 dark:text-white/20 uppercase tracking-widest font-bold">
                  Telemetry ID: SAR-S1-IW
                </div>
              </div>

              <div className="h-[300px] w-full">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white/10 italic">
                    Syncing Orbital Data...
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
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#ffffff05' : '#00000005'} vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke={theme === 'dark' ? '#ffffff20' : '#00000020'} 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#ffffff20' : '#00000020'} 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#121214' : '#ffffff', 
                          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          fontSize: '12px',
                          color: theme === 'dark' ? '#fff' : '#000',
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
            <div className="lg:col-span-3 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
              <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                <div className="text-gray-500 dark:text-white/40 uppercase text-[10px] tracking-widest font-bold">
                  Sector Telemetry Feed
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 dark:text-white/20 uppercase tracking-tighter">
                      <th className="px-6 py-4 font-bold">Log ID</th>
                      <th className="px-6 py-4 font-bold">Target Node</th>
                      <th className="px-6 py-4 font-bold">Timestamp (UTC)</th>
                      <th className="px-6 py-4 font-bold text-right">Units Detected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.02]">
                    {filteredMetrics.slice().reverse().map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 font-mono text-gray-400 dark:text-white/40">#{m.id.toString().padStart(4, '0')}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white/80 font-bold">{m.location}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-white/40">{new Date(m.timestamp).toUTCString()}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="bg-orange-600/10 text-orange-600 dark:text-orange-500 px-2 py-1 rounded font-bold border border-orange-600/20">
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
      <footer className="mt-24 border-t border-gray-200 dark:border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] text-gray-400 dark:text-white/20 uppercase tracking-[0.3em]">
          <div>Status: Multi-Node Scaling Active</div>
          <div className="flex gap-8 tracking-widest text-gray-500 dark:text-white/40 lowercase italic">
            <span>monitoring_alexandria_node...</span>
            <span>monitoring_port_said_node...</span>
            <span>monitoring_damietta_node...</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
