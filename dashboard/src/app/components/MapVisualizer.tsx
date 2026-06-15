'use client';

import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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

// Component to handle map view updates
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapVisualizer({ nodes, selectedLocation }: MapVisualizerProps) {
  const activeNode = nodes.find(n => n.name === selectedLocation);
  
  // Default view: Northern Egypt / Eastern Mediterranean
  const defaultCenter: [number, number] = [30.5, 31.5];
  const defaultZoom = 7;

  const center: [number, number] = activeNode ? [activeNode.lat, activeNode.lon] : defaultCenter;
  const zoom = activeNode ? 11 : defaultZoom;

  return (
    <div className="w-full h-[500px] rounded-xl border border-border-ui overflow-hidden shadow-2xl relative z-10">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {nodes.map((node) => {
          const isCritical = node.vesselCount > node.maxCapacity;
          const isSelected = selectedLocation === node.name || selectedLocation === 'All';
          
          // Define a rough BBox around the port for visualization (matches our 0.03 degree size)
          const bounds: [[number, number], [number, number]] = [
            [node.lat - 0.015, node.lon - 0.015],
            [node.lat + 0.015, node.lon + 0.015]
          ];

          return (
            <div key={node.name}>
              <Marker 
                position={[node.lat, node.lon]} 
                icon={icon}
                opacity={isSelected ? 1 : 0.5}
              >
                <Popup className="custom-popup">
                  <div className="font-mono text-xs p-1">
                    <strong className="text-orange-600 uppercase">{node.name}</strong>
                    <div className="mt-1 flex justify-between gap-4">
                      <span>VESSELS:</span>
                      <span className={isCritical ? 'text-red-500 font-bold' : 'text-orange-500'}>
                        {node.vesselCount}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
              
              {isSelected && (
                <Rectangle 
                  bounds={bounds}
                  pathOptions={{ 
                    color: isCritical ? '#ef4444' : '#ea580c', 
                    weight: 2, 
                    fillOpacity: 0.1,
                    dashArray: '5, 5'
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
          background: #0a0a0b !important;
        }
        .leaflet-popup-content-wrapper {
          background: #121214 !important;
          color: #d1d1d1 !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .leaflet-popup-tip {
          background: #121214 !important;
        }
      `}</style>
    </div>
  );
}
