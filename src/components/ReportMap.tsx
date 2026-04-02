import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const severityColors: Record<string, string> = {
  low: '#22c55e',
  high: '#ef4444',
};

function createSeverityIcon(severity: string) {
  const color = severityColors[severity] || '#22c55e';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

import { Report } from '@/hooks/useReports';

interface ReportMapProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (report: Report) => void;
  className?: string;
  userLocation?: [number, number];
  selectedReport?: Report | null;
  showHeatmap?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  routePoints?: [number, number][]; // coordinates to draw a polyline path
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function ReportMap({ reports, center = [20.5937, 78.9629], zoom = 5, onMarkerClick, className = '', userLocation, selectedReport, showHeatmap = false, onMapClick, routePoints }: ReportMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={`h-full w-full rounded-lg ${className}`} style={{ minHeight: '300px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <MapEvents onClick={onMapClick} />

      {/* Draw route lines if any */}
      {routePoints && routePoints.length > 1 && (
        <Polyline positions={routePoints} pathOptions={{ color: '#ef4444', weight: 4, dashArray: '5, 10', lineCap: 'round' }} />
      )}

      {reports.map((report) =>
        showHeatmap ? (
          <CircleMarker
            key={`heat-${report.id}`}
            center={[report.latitude, report.longitude]}
            radius={report.severity === 'high' ? 20 : 8}
            pathOptions={{ color: 'transparent', fillColor: '#ef4444', fillOpacity: 0.3 }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold capitalize">{report.severity} severity hotspot</p>
                <p className="text-xs mt-1">Density mapped by severity</p>
              </div>
            </Popup>
          </CircleMarker>
        ) : (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createSeverityIcon(report.severity)}
            eventHandlers={{ click: () => onMarkerClick?.(report) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold capitalize">{report.severity} severity</p>
                <p className="text-xs mt-1">{report.description}</p>
                {report.photo_url && (
                  <img src={report.photo_url} alt="Waste Proof" className="w-full h-32 object-cover rounded mt-2 border border-border" />
                )}
                <p className="text-xs mt-1 opacity-60">Status: {report.status}</p>
              </div>
            </Popup>
          </Marker>
        )
      )}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={L.divIcon({
            className: 'user-marker',
            html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.8);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Popup>Your Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
