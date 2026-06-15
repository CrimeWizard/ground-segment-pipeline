'use client';

import { MapContainer, TileLayer, Marker, Popup, Rectangle, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';

interface MapNode {
  name: string;
  lat: number;
  lon: number;
  vesselCount: number;
  maxCapacity: number;
}

interface MapVisualizerProps {
  nodes: MapNode[];
  selectedLocation: string;
}

// Custom Tactical Blip Icon
const createTacticalIcon = (isCritical: boolean, isSelected: boolean) => {
  const color = isCritical ? '#ef4444' : '#ea580c';
  const size = isSelected ? 24 : 16;
  return L.divIcon({
    className: 'custom-tactical-icon',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; background: ${color}; border-radius: 50%; opacity: 0.3; animation: ping 2s infinite;"></div>
        <div style="position: relative; width: ${size/2}px; height: ${size/2}px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Deterministic Pseudo-Random Ship Generator
const generateVessels = (lat: number, lon: number, count: number, name: string) => {
  const vessels = [];
  const seed = name.length; // Use name as seed for consistent-ish placement
  for (let i = 0; i < count; i++) {
    // Distribute ships within the 0.03 degree bbox
    const offsetLat = (Math.sin(i * 12.3 + seed) * 0.012);
    const offsetLon = (Math.cos(i * 15.7 + seed) * 0.012) + (name === 'Ain Sokhna' ? 0.01 : 0);
    vessels.push({
      id: `${name}-v-${i}`,
      lat: lat + offsetLat,
      lon: lon + offsetLon
    });
  }
  return vessels;
};

export default function MapVisualizer({ nodes, selectedLocation }: MapVisualizerProps) {
  const { theme } = useTheme();
  const activeNode = nodes.find(n => n.name === selectedLocation);
  
  const defaultCenter: [number, number] = [30.8, 31.2];
  const defaultZoom = 7;
  const center: [number, number] = activeNode ? [activeNode.lat + (activeNode.name === 'Ain Sokhna' ? 0 : 0), activeNode.lon + (activeNode.name === 'Ain Sokhna' ? 0.01 : 0)] : defaultCenter;
  const zoom = activeNode ? 14 : defaultZoom; // Deep focus on the port

  const tileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="w-full h-[600px] rounded-xl border border-border-ui overflow-hidden shadow-2xl relative z-10 bg-surface group">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false} // Custom positioning below
      >
        <ZoomControl position="bottomleft" />
        <ChangeView center={center} zoom={zoom} />
        <TileLayer attribution='&copy; CARTO' url={tileUrl} />
        
        {nodes.map((node) => {
          const isCritical = node.vesselCount > node.maxCapacity;
          const isSelected = selectedLocation === node.name || selectedLocation === 'All';
          const showVessels = selectedLocation === node.name && node.vesselCount < 2000; // Only show individual dots when zoomed in/focused

          return (
            <div key={node.name}>
              {/* Regional Marker */}
              <Marker position={[node.lat, node.lon + (node.name === 'Ain Sokhna' ? 0.01 : 0)]} icon={createTacticalIcon(isCritical, isSelected)}>
                <Popup className="custom-popup">
                  <div className="font-mono text-[10px] p-2 bg-surface text-foreground rounded border border-border-ui shadow-xl min-w-[120px]">
                    <strong className="text-header uppercase tracking-widest">{node.name}</strong>
                    <div className="h-px bg-border-ui my-2" />
                    <div className="flex justify-between"><span>VESSELS</span><span className={isCritical ? 'text-red-500 font-bold' : 'text-orange-500 font-bold'}>{node.vesselCount}</span></div>
                    <div className="flex justify-between mt-1 opacity-60 text-[8px]"><span>CAPACITY</span><span>{node.maxCapacity}</span></div>
                  </div>
                </Popup>
              </Marker>
              
              {/* Port Boundary Box */}
              {isSelected && (
                <Rectangle 
                  bounds={[[node.lat - 0.015, node.lon - 0.015 + (node.name === 'Ain Sokhna' ? 0.01 : 0)], [node.lat + 0.015, node.lon + 0.015 + (node.name === 'Ain Sokhna' ? 0.01 : 0)]]}
                  pathOptions={{ color: isCritical ? '#ef4444' : '#ea580c', weight: 1, fillOpacity: 0.03, dashArray: '5, 5' }}
                />
              )}

              {/* Individual Vessel Targets (Visible only when focused) */}
              {showVessels && generateVessels(node.lat, node.lon, node.vesselCount, node.name).map(v => (
                <Circle 
                  key={v.id}
                  center={[v.lat, v.lon]}
                  radius={15} // Approx size of a ship
                  pathOptions={{ 
                    fillColor: isCritical ? '#ef4444' : '#ea580c', 
                    fillOpacity: 0.8, 
                    color: 'white', 
                    weight: 0.5 
                  }}
                />
              ))}
            </div>
          );
        })}
      </MapContainer>

      {/* Map HUD Overlay */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none space-y-2">
         <div className="bg-surface/90 backdrop-blur-md border border-border-ui px-3 py-2 rounded shadow-lg">
            <div className="text-[10px] font-black text-header uppercase tracking-tighter flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
              Tactical Sector: {activeNode ? activeNode.name.toUpperCase() : 'GLOBAL OVERVIEW'}
            </div>
         </div>
         {activeNode && (
           <div className="bg-black/80 text-white/60 px-2 py-1 rounded text-[8px] uppercase tracking-widest border border-white/5 inline-block">
              Visualizing {activeNode.vesselCount} Orbital Signatures
           </div>
         )}
      </div>

      <style jsx global>{`
        .leaflet-container { background: var(--background) !important; }
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-control-zoom { border: 1px solid var(--border-ui) !important; border-radius: 4px !important; overflow: hidden; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out { background-color: var(--surface) !important; color: var(--header) !important; border: none !important; font-family: monospace !important; }
        @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>
    </div>
  );
}
