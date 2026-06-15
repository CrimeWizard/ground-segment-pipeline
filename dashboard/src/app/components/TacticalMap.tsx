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
  const maxLat = 32.0;

  const project = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 1; i < 10; i++) {
      lines.push(<line key={`v-${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" className="stroke-current opacity-[0.03]" />);
      lines.push(<line key={`h-${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} className="stroke-current opacity-[0.03]" />);
    }
    return lines;
  }, []);

  return (
    <div className="relative w-full h-[500px] bg-white dark:bg-[#0a0a0b] rounded-xl border border-border-ui overflow-hidden shadow-2xl transition-all duration-500">
      {/* Dynamic Background Noise/Texture */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
      
      {/* Coordinate Grid */}
      <svg className="absolute inset-0 w-full h-full text-foreground pointer-events-none">
        {gridLines}
      </svg>

      {/* Realistic Tactical Coastline SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Egypt North Coast & Delta & Red Sea Coastline */}
        <path
          d="
            M 0,35 
            L 15,36 
            L 22,34 
            L 28,32 
            C 35,28 45,20 55,25 
            L 62,35 
            L 64,45 
            L 64,100 
            L 0,100 Z
          "
          fill="url(#landGradient)"
          className="text-gray-900 dark:text-gray-400 transition-colors duration-500"
        />
        
        {/* Suez Canal Path */}
        <path
          d="M 63,35 L 63.5,60"
          stroke="#ea580c"
          strokeWidth="0.3"
          strokeDasharray="1,1"
          className="opacity-40"
        />
      </svg>

      {/* Scanning Radar Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100%] left-0 w-full h-[200%] bg-gradient-to-b from-transparent via-orange-500/5 to-transparent animate-[scan_8s_linear_infinite]" />
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
            {/* Range Rings */}
            <div className={`absolute inset-0 rounded-full border border-current opacity-10 scale-[3] transition-transform duration-1000 ${isSelected ? 'scale-[5]' : ''}`} />
            
            <button
              onClick={() => onSelectNode(node.name)}
              className="relative flex flex-col items-center group cursor-pointer focus:outline-none"
            >
              {/* Radar Ping Animation */}
              <div className={`absolute inset-0 rounded-full animate-ping ${isCritical ? 'bg-red-500/40' : 'bg-orange-500/20'}`} style={{ width: '40px', height: '40px', margin: '-14px' }} />
              
              {/* Central Data Point */}
              <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 shadow-lg ${
                isSelected ? 'scale-150 border-white rotate-45' : 'border-transparent'
              } ${isCritical ? 'bg-red-600' : 'bg-orange-600'}`} />

              {/* Data Tag */}
              <div className={`mt-4 flex flex-col items-center transition-all duration-300 ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2'}`}>
                <div className="bg-header text-background px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 whitespace-nowrap">
                   <div className={`w-1 h-1 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                   {node.name} // {node.vesselCount} UNITS
                </div>
                <div className="w-px h-2 bg-orange-600/50" />
              </div>
            </button>
          </div>
        );
      })}

      {/* HUD Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none">
        <div className="text-[10px] font-black text-header flex items-center gap-2 uppercase tracking-tighter">
          <div className="w-1.5 h-1.5 bg-orange-600" />
          Tactical Command Center
        </div>
        <div className="text-[8px] text-muted-ui uppercase tracking-widest opacity-60 font-bold">
          Signal: CDSE-S1 // Area: EGY-MED-RED
        </div>
      </div>

      {/* Map Legend (HUD Style) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 p-4 bg-background/80 backdrop-blur-sm border border-border-ui rounded-md shadow-xl pointer-events-none">
        <div className="text-[7px] font-bold text-muted-ui uppercase tracking-[0.2em] mb-1">Telemetry Legend</div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-600" />
          <span className="text-[8px] uppercase font-bold text-header">Nominal Zone</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[8px] uppercase font-bold text-header">Congested Node</span>
        </div>
        <div className="mt-2 pt-2 border-t border-border-ui flex justify-between items-center gap-4">
           <span className="text-[7px] text-muted-ui font-black uppercase tracking-tighter">Lat: 31.2N</span>
           <span className="text-[7px] text-muted-ui font-black uppercase tracking-tighter">Lon: 32.3E</span>
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

export default TacticalMap;
