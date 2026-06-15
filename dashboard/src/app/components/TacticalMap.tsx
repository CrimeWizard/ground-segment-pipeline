'use client';

import React from 'react';

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
  // Map bounds (Approx Egypt North Coast)
  const minLon = 28.5;
  const maxLon = 34.5;
  const minLat = 28.5;
  const maxLat = 32.5;

  const project = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative w-full h-[400px] bg-[#0a0a0b] dark:bg-black/40 rounded-lg border border-border-ui overflow-hidden group">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #ea580c 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      {/* Tactical SVG Map (Simplified Egypt Coastline) */}
      <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 0,50 L 20,48 L 40,52 L 60,50 L 80,45 L 100,42 L 100,100 L 0,100 Z"
          fill="currentColor"
          className="text-gray-400 dark:text-gray-800"
        />
        {/* Suez Canal Indicator */}
        <line x1="63" y1="50" x2="63" y2="75" stroke="#ea580c" strokeWidth="0.5" strokeDasharray="1,1" />
      </svg>

      {/* Interactive Nodes */}
      {nodes.map((node) => {
        const { x, y } = project(node.lat, node.lon);
        const isSelected = selectedLocation === node.name || selectedLocation === 'All';
        const isCritical = node.vesselCount > node.maxCapacity;
        
        // Pulse size based on vessel count (normalized)
        const pulseSize = Math.max(12, Math.min(40, (node.vesselCount / 1200) * 40));

        return (
          <button
            key={node.name}
            onClick={() => onSelectNode(node.name)}
            className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-20 group/node"
            style={{ left: x, top: y }}
          >
            {/* Animated Pulse */}
            <div 
              className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`}
              style={{ width: pulseSize * 2, height: pulseSize * 2, marginLeft: -pulseSize/2, marginTop: -pulseSize/2 }}
            />
            
            {/* Core Node */}
            <div 
              className={`relative rounded-full border-2 transition-all duration-300 ${
                isSelected ? 'scale-125 border-white shadow-[0_0_15px_rgba(234,88,12,0.6)]' : 'border-transparent'
              } ${isCritical ? 'bg-red-600' : 'bg-orange-600'}`}
              style={{ width: 12, height: 12 }}
            />

            {/* Label */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all duration-300 ${
              isSelected ? 'bg-orange-600 text-white opacity-100' : 'bg-black/50 text-white/40 opacity-0 group-hover/node:opacity-100'
            }`}>
              {node.name} | {node.vesselCount}
            </div>
          </button>
        );
      })}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
          <div className="w-2 h-2 rounded-full bg-orange-600" />
          Nominal Traffic
        </div>
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Critical Density
        </div>
      </div>

      <div className="absolute top-4 right-4 text-[10px] font-bold text-orange-600/50 uppercase tracking-[0.2em] pointer-events-none">
        Tactical Signal Area: 28.5N - 34.5E
      </div>
    </div>
  );
};

export default TacticalMap;
