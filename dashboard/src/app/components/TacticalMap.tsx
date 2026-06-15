'use client';

import React, { useMemo } from 'react';

interface MapNode {
  name: string;
  lat: number;
  lon: number;
  vesselCount: number;
  maxCapacity: number;
}

interface TacticalMapProps {
  nodes: MapNode[];
  onSelectNode: (name: string) => void;
  selectedLocation: string;
}

const TacticalMap: React.FC<TacticalMapProps> = ({ nodes, onSelectNode, selectedLocation }) => {
  // Map bounds for Egypt (Narrowed to North Coast and Gulf of Suez)
  const minLon = 28.5;
  const maxLon = 34.5;
  const minLat = 29.0;
  const maxLat = 32.5;

  const project = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative w-full h-[500px] bg-white dark:bg-[#0a0a0b] rounded-xl border border-border-ui overflow-hidden shadow-2xl transition-all duration-500">
      {/* Tactical Grid Layer */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             color: 'rgba(234, 88, 12, 0.2)' 
           }} 
      />
      
      {/* Geographical Layer (SVG Coastline) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Simplified but high-accuracy Egypt Coastline */}
        <path
          d="
            M 0,40 
            L 15,38 
            L 25,35 
            C 30,30 35,15 45,15 
            C 55,15 60,30 65,35 
            L 65,55 
            L 60,65 
            L 60,100 
            L 0,100 Z
          "
          className="fill-gray-100 dark:fill-white/5 stroke-border-ui stroke-[0.1] transition-colors duration-500"
        />

        {/* The Suez Canal & Gulf of Suez Channel */}
        <path
          d="M 64,35 L 64,55 L 67,65 L 70,80"
          className="fill-none stroke-orange-600/30 stroke-[0.2] stroke-dasharray-[1,1]"
        />
      </svg>

      {/* Radar Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100%] left-0 w-full h-[200%] bg-gradient-to-b from-transparent via-orange-500/[0.03] to-transparent animate-[scan_6s_linear_infinite]" />
      </div>

      {/* Interactive Port Nodes */}
      {nodes.map((node) => {
        const { x, y } = project(node.lat, node.lon);
        const isSelected = selectedLocation === node.name || selectedLocation === 'All';
        const isCritical = node.vesselCount > node.maxCapacity;
        
        return (
          <div
            key={node.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
            style={{ left: x, top: y }}
          >
            {/* The Node Button */}
            <button
              onClick={() => onSelectNode(node.name)}
              className="relative flex flex-col items-center group cursor-pointer focus:outline-none"
            >
              {/* Dynamic Range Rings (Fixed Circular Aspect Ratio) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`aspect-square rounded-full border border-orange-500/20 transition-all duration-1000 ${
                  isSelected ? 'w-48 opacity-20' : 'w-24 opacity-5'
                }`} />
                <div className={`absolute aspect-square rounded-full border border-orange-500/10 transition-all duration-1000 ${
                  isSelected ? 'w-32 opacity-30' : 'w-16 opacity-10'
                }`} />
              </div>

              {/* Radar Ping Animation */}
              <div className={`absolute aspect-square rounded-full animate-ping ${isCritical ? 'bg-red-500/40' : 'bg-orange-500/30'}`} style={{ width: '20px' }} />
              
              {/* Central Signal Point */}
              <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 shadow-[0_0_10px_rgba(234,88,12,0.4)] ${
                isSelected ? 'scale-125 border-white bg-orange-500' : 'border-transparent bg-orange-600'
              } ${isCritical ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : ''}`} />

              {/* Advanced Data Tag */}
              <div className={`mt-4 flex flex-col items-center transition-all duration-300 ${
                isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2'
              }`}>
                <div className="bg-[#121214] text-white px-2 py-1 rounded-sm text-[8px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 border border-white/10">
                   <div className={`w-1 h-1 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                   {node.name} // <span className={isCritical ? 'text-red-500' : 'text-orange-500'}>{node.vesselCount} UNITS</span>
                </div>
              </div>
            </button>
          </div>
        );
      })}

      {/* HUD Info Overlays */}
      <div className="absolute top-8 left-8 space-y-1 pointer-events-none">
        <div className="text-[10px] font-black text-header uppercase tracking-tighter flex items-center gap-2">
          <Activity className="w-3 h-3 text-orange-600" />
          Tactical Command Center
        </div>
        <div className="text-[8px] text-muted-ui uppercase tracking-[0.3em] font-bold opacity-50">
          Node_Status: {selectedLocation.toUpperCase()} // ACTIVE
        </div>
      </div>

      {/* Coordinate HUD */}
      <div className="absolute bottom-8 right-8 p-4 bg-background/90 backdrop-blur-md border border-border-ui rounded shadow-2xl pointer-events-none min-w-[140px]">
        <div className="text-[7px] font-black text-muted-ui uppercase tracking-widest mb-3 pb-2 border-b border-border-ui flex justify-between">
           <span>Signal Lock</span>
           <span className="text-orange-600">Verified</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
             <span className="text-[8px] text-muted-ui uppercase font-bold">Traffic</span>
             <span className="text-[10px] text-header font-black tracking-tighter">NOMINAL</span>
          </div>
          <div className="flex justify-between items-center gap-4">
             <span className="text-[8px] text-muted-ui uppercase font-bold">Delta</span>
             <span className="text-[10px] text-orange-500 font-black tracking-tighter">+4.2%</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          from { transform: translateY(-50%); }
          to { transform: translateY(50%); }
        }
      `}</style>
    </div>
  );
};

// Internal Activity Icon mock for the component
const Activity = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default TacticalMap;
