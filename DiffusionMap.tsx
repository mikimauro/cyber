import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import type { DiffusionPoint } from '@/types';
import 'leaflet/dist/leaflet.css';

interface DiffusionMapProps {
  diffusionPoints: DiffusionPoint[];
}

// Componente per centrare la mappa
function MapCenter({ points }: { points: DiffusionPoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = points.map(p => p.coordinates);
      // @ts-ignore
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);
  
  return null;
}

export function DiffusionMap({ diffusionPoints }: DiffusionMapProps) {
  const [selectedPoint, setSelectedPoint] = useState<DiffusionPoint | null>(null);

  if (!diffusionPoints || diffusionPoints.length === 0) {
    return (
      <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">Nessun dato di diffusione disponibile</p>
      </div>
    );
  }

  // Prepara le linee di connessione
  const connections: Array<[number, number][]> = [];
  diffusionPoints.forEach(point => {
    point.connections.forEach(connId => {
      const connectedPoint = diffusionPoints.find(p => p.id === connId);
      if (connectedPoint) {
        connections.push([point.coordinates, connectedPoint.coordinates]);
      }
    });
  });

  // Trova il punto con data più antica (paziente zero sulla mappa)
  const oldestPoint = diffusionPoints.reduce((prev, curr) => 
    curr.firstAppearance < prev.firstAppearance ? curr : prev
  );

  return (
    <div className="relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        className="h-96 rounded-xl"
        style={{ background: '#f0f0f0' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenter points={diffusionPoints} />

        {/* Linee di connessione */}
        {connections.map((connection, idx) => (
          <Polyline
            key={idx}
            positions={connection}
            color="#6366f1"
            weight={2}
            opacity={0.5}
            dashArray="5, 5"
          />
        ))}

        {/* Punti di diffusione */}
        {diffusionPoints.map((point) => {
          const isPatientZero = point.id === oldestPoint.id;
          const intensity = point.intensity;
          
          return (
            <CircleMarker
              key={point.id}
              center={point.coordinates}
              radius={isPatientZero ? 15 : 8 + intensity * 10}
              fillColor={isPatientZero ? '#ef4444' : intensity > 0.7 ? '#f97316' : '#3b82f6'}
              color={isPatientZero ? '#dc2626' : intensity > 0.7 ? '#ea580c' : '#2563eb'}
              weight={isPatientZero ? 3 : 2}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => setSelectedPoint(point)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    {isPatientZero && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        PAZIENTE ZERO
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold">{point.city}, {point.country}</h4>
                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p><span className="text-gray-400">Piattaforma:</span> {point.platform}</p>
                    <p><span className="text-gray-400">Data:</span> {point.firstAppearance.toLocaleDateString('it-IT')}</p>
                    <p><span className="text-gray-400">Condivisioni:</span> {point.shares.toLocaleString()}</p>
                    <p><span className="text-gray-400">Intensità:</span> {(point.intensity * 100).toFixed(0)}%</p>
                  </div>
                  {point.url && (
                    <a 
                      href={point.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline mt-2 block"
                    >
                      Vedi contenuto →
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg text-xs">
        <div className="font-medium mb-2">Legenda</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-600"></div>
            <span>Paziente Zero</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Alta intensità</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Diffusione normale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-indigo-500 border-dashed"></div>
            <span>Connessione</span>
          </div>
        </div>
      </div>

      {/* Info selezione */}
      {selectedPoint && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{selectedPoint.city}</h4>
            <button 
              onClick={() => setSelectedPoint(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="text-sm space-y-1 text-gray-600">
            <p>Paese: {selectedPoint.country}</p>
            <p>Piattaforma: {selectedPoint.platform}</p>
            <p>Data: {selectedPoint.firstAppearance.toLocaleDateString('it-IT')}</p>
            <p>Condivisioni: {selectedPoint.shares.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
