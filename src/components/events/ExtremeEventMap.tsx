import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { StationLocation, ExtremeEventAlert } from '../../core/types';
import { NetworkStationEventStatus } from '../../core/events/ExtremeEventEngine';
import { Maximize2, ZoomIn, ZoomOut, Compass, MapPin } from 'lucide-react';

interface ExtremeEventMapProps {
  selectedStation: StationLocation;
  onSelectStation: (st: StationLocation) => void;
  networkStatuses: NetworkStationEventStatus[];
  eventType: ExtremeEventAlert['eventType'];
  activeThreshold: number;
  unit: string;
  leadTimeHours: number;
}

export const ExtremeEventMap: React.FC<ExtremeEventMapProps> = ({
  selectedStation,
  onSelectStation,
  networkStatuses,
  eventType,
  activeThreshold,
  unit,
  leadTimeHours,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Resize canvas overlay
  const resizeCanvas = useCallback(() => {
    if (!mapContainerRef.current || !canvasRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    }
  }, []);

  // Draw meteorological hazard field contour onto canvas
  const drawHazardField = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render soft field anomalies around active stations
    for (const status of networkStatuses) {
      const pt = map.latLngToContainerPoint([status.station.latitude, status.station.longitude]);
      if (pt.x < -200 || pt.x > canvas.width + 200 || pt.y < -200 || pt.y > canvas.height + 200) continue;

      const isCold = eventType === 'Extreme Cold';
      const exceeds = isCold ? status.peakValue <= activeThreshold : status.peakValue >= activeThreshold;

      // Anomaly radius in pixels
      const radius = exceeds ? 140 : 80;
      const grad = ctx.createRadialGradient(pt.x, pt.y, 10, pt.x, pt.y, radius);

      if (eventType === 'Heatwave') {
        if (exceeds) {
          grad.addColorStop(0, 'rgba(244, 63, 94, 0.28)'); // Rose-500
          grad.addColorStop(0.5, 'rgba(251, 146, 60, 0.14)');
          grad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        } else {
          grad.addColorStop(0, 'rgba(251, 146, 60, 0.08)');
          grad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        }
      } else if (eventType === 'Heavy rainfall') {
        if (exceeds) {
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.32)'); // Sky-400
          grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        } else {
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        }
      } else if (eventType === 'High wind') {
        if (exceeds) {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.26)'); // Purple-500
          grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.12)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        } else {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.07)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        }
      } else {
        // Extreme Cold
        if (exceeds) {
          grad.addColorStop(0, 'rgba(99, 102, 241, 0.30)'); // Indigo-500
          grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
          grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        } else {
          grad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
          grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        }
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw faint concentric isobar/isotach boundary if exceeded
      if (exceeds) {
        ctx.strokeStyle = eventType === 'Heatwave' 
          ? 'rgba(244, 63, 94, 0.3)' 
          : eventType === 'Heavy rainfall' 
          ? 'rgba(56, 189, 248, 0.35)' 
          : eventType === 'High wind'
          ? 'rgba(168, 85, 247, 0.3)'
          : 'rgba(99, 102, 241, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [networkStatuses, eventType, activeThreshold]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedStation.latitude, selectedStation.longitude],
        zoom: 3.5,
        minZoom: 2,
        maxZoom: 9,
        zoomControl: false,
        attributionControl: false,
      });

      const primaryUrl = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
      const fallbackUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

      const tileLayer = L.tileLayer(primaryUrl, {
        subdomains: 'abcd',
        maxZoom: 18,
      });

      tileLayer.on('tileerror', () => {
        if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(fallbackUrl);
        }
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      const handleMapMove = () => {
        resizeCanvas();
        drawHazardField();
      };

      map.on('move', handleMapMove);
      map.on('zoom', handleMapMove);
      map.on('resize', handleMapMove);

      setTimeout(() => {
        map.invalidateSize();
        resizeCanvas();
        drawHazardField();
      }, 60);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center smoothly on selected station
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([selectedStation.latitude, selectedStation.longitude], {
        animate: true,
        duration: 1.0,
      });
    }
  }, [selectedStation.id]);

  // Redraw markers and field
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    drawHazardField();

    for (const status of networkStatuses) {
      const isSelected = status.station.id === selectedStation.id;
      const isCold = eventType === 'Extreme Cold';
      const exceeds = isCold ? status.peakValue <= activeThreshold : status.peakValue >= activeThreshold;

      // Color assignment
      let statusColor = '#64748B'; // Slate
      let statusPill = 'SUB-THRESHOLD';
      let pillBg = 'rgba(100, 116, 139, 0.2)';
      let pulseRing = '';

      if (status.status === 'DETECTED' || status.severityRisk === 'High Risk') {
        statusColor = '#F43F5E'; // Rose
        statusPill = 'DETECTED';
        pillBg = 'rgba(244, 63, 94, 0.2)';
        pulseRing = `
          <span style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1.5px solid #F43F5E;
            opacity: 0.8;
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></span>
        `;
      } else if (status.status === 'DEVELOPING' || status.severityRisk === 'Elevated Risk') {
        statusColor = '#F59E0B'; // Amber
        statusPill = 'DEVELOPING';
        pillBg = 'rgba(245, 158, 11, 0.2)';
      } else if (status.status === 'MONITOR' && exceeds) {
        statusColor = '#EAB308'; // Yellow
        statusPill = 'WATCH';
        pillBg = 'rgba(234, 179, 8, 0.2)';
      }

      const halo = isSelected 
        ? 'box-shadow: 0 0 0 2px #FFFFFF, 0 0 20px rgba(255,255,255,0.4); border-color: #FFFFFF;' 
        : `border-color: ${statusColor};`;

      const markerHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); cursor:pointer;">
          <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
            ${pulseRing}
            <span style="
              width: 14px; 
              height: 14px; 
              border-radius: 50%; 
              background: #08090C; 
              border: 2px solid ${statusColor};
              ${isSelected ? 'box-shadow: 0 0 0 2px #FFFFFF;' : ''}
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="width: 5px; height: 5px; border-radius: 50%; background: ${statusColor};"></span>
            </span>
          </div>

          <div style="
            margin-top: 6px;
            background: rgba(8, 9, 12, 0.94);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(8px);
            color: #FFFFFF;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            box-shadow: 0 4px 16px rgba(0,0,0,0.8);
            ${halo}
          ">
            <span style="font-weight: 700; font-size: 10px; color: ${isSelected ? '#FFFFFF' : '#94A3B8'}; text-transform: uppercase;">
              ${status.station.id}
            </span>
            <span style="font-family: monospace; font-weight: 700; color: ${statusColor};">
              ${status.peakValue.toFixed(1)}${unit}
            </span>
            <span style="
              font-size: 9px;
              font-family: monospace;
              text-transform: uppercase;
              padding: 1px 4px;
              border-radius: 2px;
              background: ${pillBg};
              color: ${statusColor};
              font-weight: 600;
            ">
              ${statusPill}
            </span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-extreme-event-marker',
        html: markerHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker([status.station.latitude, status.station.longitude], { icon });
      marker.on('click', () => {
        onSelectStation(status.station);
      });
      group.addLayer(marker);
    }
  }, [networkStatuses, selectedStation.id, eventType, activeThreshold, unit, drawHazardField, onSelectStation]);

  return (
    <div className="extreme-event-map-container relative w-full h-[420px] rounded-lg border border-white/10 overflow-hidden bg-[#0A0C10]">
      {/* Base Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Meteorological Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Top Left: Operational Telemetry Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 font-mono text-[10px]">
        <div className="px-2.5 py-1.5 rounded bg-black/80 backdrop-blur border border-white/15 text-slate-300 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold uppercase">{eventType} MAPPING</span>
          <span className="text-slate-500">|</span>
          <span>THRESHOLD: <strong className="text-white">{activeThreshold.toFixed(1)}{unit}</strong></span>
          <span className="text-slate-500">|</span>
          <span>+48H HORIZON</span>
        </div>

        <div className="hidden sm:flex px-2 py-1.5 rounded bg-black/80 backdrop-blur border border-white/10 text-slate-400">
          NODES: <strong className="text-white ml-1">{networkStatuses.length} WMO STATIONS</strong>
        </div>
      </div>

      {/* Top Right: Selected Station Telemetry */}
      <div className="absolute top-3 right-3 z-20 font-mono text-[10px]">
        <div className="px-2.5 py-1.5 rounded bg-black/80 backdrop-blur border border-white/15 text-slate-300 flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-white font-bold">{selectedStation.name}</span>
          <span className="text-slate-500">({selectedStation.latitude.toFixed(2)}°N, {selectedStation.longitude.toFixed(2)}°E)</span>
        </div>
      </div>

      {/* Bottom Left: Visual Severity Legend */}
      <div className="absolute bottom-3 left-3 z-20 font-mono text-[10px] px-3 py-2 rounded bg-black/85 backdrop-blur border border-white/15 text-slate-300 flex items-center space-x-4">
        <span className="text-slate-500 uppercase tracking-widest text-[9px]">SEVERITY STATUS:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-slate-300">DETECTED (HIGH)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-300">DEVELOPING</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-slate-300">WATCH</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-slate-400">SUB-THRESHOLD</span>
        </div>
      </div>

      {/* Bottom Right: Map Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col space-y-1">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-7 h-7 rounded bg-black/80 border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-7 h-7 rounded bg-black/80 border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([selectedStation.latitude, selectedStation.longitude], 4);
            }
          }}
          aria-label="Reset focus"
          title="Focus selected station"
          className="w-7 h-7 rounded bg-black/80 border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
