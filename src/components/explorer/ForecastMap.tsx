import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Layers, 
  Compass, 
  MapPin, 
  Navigation2,
  Maximize2
} from 'lucide-react';
import { 
  StationLocation, 
  WeatherVariable, 
  ForecastSourceId, 
  BlendedForecastResult 
} from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';
import { ExplorerDisplayMode } from './ForecastControls';

interface ForecastMapProps {
  station: StationLocation;
  setStation: (st: StationLocation) => void;
  selectedVariable: WeatherVariable;
  displayMode: ExplorerDisplayMode;
  selectedSource: ForecastSourceId;
  leadTimeHours: number;
  currentResult: BlendedForecastResult;
  timeSeriesTrajectory: BlendedForecastResult[];
  isDemonstrationData: boolean;
}

export const ForecastMap: React.FC<ForecastMapProps> = ({
  station,
  setStation,
  selectedVariable,
  displayMode,
  selectedSource,
  leadTimeHours,
  currentResult,
  timeSeriesTrajectory,
  isDemonstrationData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [hoveredStation, setHoveredStation] = useState<StationLocation | null>(null);

  // Compute thermal scale color
  const getThermalColor = (temp: number) => {
    if (temp <= 0) return '#38BDF8'; // Frozen cyan
    if (temp <= 12) return '#60A5FA'; // Cold blue
    if (temp <= 22) return '#2DD4BF'; // Mild teal
    if (temp <= 30) return '#F59E0B'; // Warm amber
    if (temp <= 38) return '#F97316'; // Hot orange
    return '#EF4444'; // Extreme crimson
  };

  // Compute precipitation color
  const getPrecipColor = (precip: number) => {
    if (precip <= 0.2) return 'rgba(255,255,255,0.4)';
    if (precip <= 3.0) return '#38BDF8';
    if (precip <= 10.0) return '#2563EB';
    if (precip <= 25.0) return '#1D4ED8';
    return '#7C3AED'; // Severe downpour
  };

  // Compute wind speed color
  const getWindColor = (speed: number) => {
    if (speed < 5) return '#94A3B8';
    if (speed < 12) return '#38BDF8';
    if (speed < 18) return '#F59E0B';
    return '#EF4444'; // Gale force
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [station.latitude, station.longitude],
        zoom: 4,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when station changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([station.latitude, station.longitude], 4.5, {
        duration: 1.2,
      });
    }
  }, [station.id]);

  // Render and update markers whenever station, variable, lead time, or mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    GLOBAL_STATIONS.forEach((st) => {
      const isSelected = st.id === station.id;

      // Extract value for station
      let displayVal = currentResult.adaptiveBlendedForecast;
      let unit = '°C';
      let markerColor = '#FFFFFF';
      let sublabel = '';
      let windAngle = 45;

      if (selectedVariable === 'temperature_2m') {
        const base = st.climatology.tempMean;
        displayVal = isSelected ? (displayMode === 'SINGLE' ? currentResult.individualForecasts[selectedSource] : currentResult.adaptiveBlendedForecast) : base;
        unit = '°C';
        markerColor = getThermalColor(displayVal);
        sublabel = `${displayVal.toFixed(1)}°C`;
      } else if (selectedVariable === 'precipitation') {
        displayVal = isSelected ? (displayMode === 'SINGLE' ? currentResult.individualForecasts[selectedSource] : currentResult.adaptiveBlendedForecast) : (st.id === 'VIDP' ? 14.5 : 1.2);
        unit = 'mm';
        markerColor = getPrecipColor(displayVal);
        sublabel = `${displayVal.toFixed(1)} mm`;
      } else if (selectedVariable === 'wind_speed_10m') {
        displayVal = isSelected ? (displayMode === 'SINGLE' ? currentResult.individualForecasts[selectedSource] : currentResult.adaptiveBlendedForecast) : st.climatology.windMeanMs;
        unit = 'm/s';
        markerColor = getWindColor(displayVal);
        sublabel = `${displayVal.toFixed(1)} m/s`;
        windAngle = (st.latitude * 7) % 360;
      } else if (selectedVariable === 'relative_humidity_2m') {
        displayVal = isSelected ? (displayMode === 'SINGLE' ? currentResult.individualForecasts[selectedSource] : currentResult.adaptiveBlendedForecast) : 65;
        unit = '%';
        markerColor = '#38BDF8';
        sublabel = `${Math.round(displayVal)}%`;
      } else {
        displayVal = isSelected ? (displayMode === 'SINGLE' ? currentResult.individualForecasts[selectedSource] : currentResult.adaptiveBlendedForecast) : 1013;
        unit = 'hPa';
        markerColor = '#E2E8F0';
        sublabel = `${Math.round(displayVal)} hPa`;
      }

      // Build custom HTML marker (NASA/Tesla minimalist styling)
      const markerHtml = `
        <div class="station-pin-container ${isSelected ? 'selected' : ''}" style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
          <div style="
            display: flex; 
            align-items: center; 
            gap: 4px;
            background: #08090C; 
            border: 1px solid ${isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.2)'}; 
            color: #FFFFFF; 
            padding: 3px 7px; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 11px;
            font-weight: ${isSelected ? 'bold' : 'normal'};
            box-shadow: ${isSelected ? '0 0 12px rgba(255,255,255,0.4)' : '0 2px 4px rgba(0,0,0,0.5)'};
            transition: all 0.2s;
          ">
            <span style="width:6px; height:6px; border-radius:50%; background-color:${markerColor}; display:inline-block;"></span>
            ${selectedVariable === 'wind_speed_10m' ? `
              <span style="display:inline-block; transform:rotate(${windAngle}deg); font-size:10px;">↑</span>
            ` : ''}
            <span>${sublabel}</span>
          </div>
          <span style="
            margin-top: 2px; 
            font-family: sans-serif; 
            font-size: 10px; 
            color: ${isSelected ? '#FFFFFF' : '#94A3B8'}; 
            background: rgba(8,9,12,0.85); 
            padding: 1px 4px; 
            border-radius: 2px;
            font-weight: ${isSelected ? '600' : '400'};
          ">${st.name.split(' (')[0]}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-station-pin',
        html: markerHtml,
        iconSize: [110, 42],
        iconAnchor: [55, 21],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: customIcon });

      marker.on('click', () => {
        setStation(st);
      });

      marker.on('mouseover', () => {
        setHoveredStation(st);
      });

      marker.on('mouseout', () => {
        setHoveredStation(null);
      });

      markersGroup.addLayer(marker);
    });
  }, [station.id, selectedVariable, displayMode, selectedSource, leadTimeHours, currentResult]);

  const activeHover = hoveredStation || station;

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] rounded border border-white/10 bg-[#08090C] overflow-hidden">
      
      {/* 1. Leaflet Map Viewport Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Top-Left Telemetry HUD Readout (NASA Console style) */}
      <div className="absolute top-4 left-4 z-10 p-4 rounded bg-[#08090C]/90 border border-white/10 backdrop-blur-md text-xs font-mono text-slate-300 space-y-1.5 pointer-events-none max-w-xs shadow-xl">
        <div className="flex items-center justify-between text-[10px] tracking-widest text-slate-400 uppercase">
          <span>STATION TELEMETRY</span>
          <span className="text-white font-bold">{isDemonstrationData ? 'BENCHMARK' : 'LIVE'}</span>
        </div>

        <div className="text-sm font-bold text-white font-sans">{activeHover.name}</div>
        <div className="text-slate-400 text-[11px]">
          {activeHover.country} • {activeHover.latitude.toFixed(2)}°N, {activeHover.longitude.toFixed(2)}°E • Elev {activeHover.elevationMeters}m
        </div>

        <div className="hairline-t pt-2 space-y-1 text-[11px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Target Lead:</span>
            <span className="text-white font-bold">+{leadTimeHours} Hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Weather Regime:</span>
            <span className="text-white">{currentResult.context.detectedRegime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Model Spread (σ):</span>
            <span className="text-white">{currentResult.modelSpread.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 3. Scientific Legend Overlay (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 p-3 rounded bg-[#08090C]/90 border border-white/10 backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-1.5 shadow-xl">
        <div className="text-[9px] tracking-widest text-slate-400 uppercase">
          {selectedVariable === 'temperature_2m' && 'TEMPERATURE SCALE (°C)'}
          {selectedVariable === 'precipitation' && 'PRECIPITATION SCALE (mm/3h)'}
          {selectedVariable === 'wind_speed_10m' && 'WIND SPEED SCALE (m/s)'}
          {selectedVariable === 'relative_humidity_2m' && 'RELATIVE HUMIDITY (%)'}
          {selectedVariable === 'surface_pressure' && 'SURFACE PRESSURE (hPa)'}
        </div>

        {selectedVariable === 'temperature_2m' && (
          <div className="space-y-1">
            <div className="w-48 h-2 rounded bg-gradient-to-r from-sky-400 via-teal-400 via-amber-400 to-rose-500" />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>-10°C</span>
              <span>10°C</span>
              <span>25°C</span>
              <span>40°C+</span>
            </div>
          </div>
        )}

        {selectedVariable === 'precipitation' && (
          <div className="space-y-1">
            <div className="w-48 h-2 rounded bg-gradient-to-r from-white/20 via-sky-400 via-blue-600 to-purple-600" />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>0 mm</span>
              <span>5 mm</span>
              <span>15 mm</span>
              <span>30 mm+</span>
            </div>
          </div>
        )}

        {selectedVariable === 'wind_speed_10m' && (
          <div className="space-y-1">
            <div className="w-48 h-2 rounded bg-gradient-to-r from-slate-400 via-sky-400 via-amber-400 to-rose-500" />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>0 m/s (Calm)</span>
              <span>12 m/s (Breeze)</span>
              <span>18 m/s+ (Gale)</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Map Zoom & Reset Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-8 h-8 rounded bg-[#08090C]/90 border border-white/10 hover:border-white/30 text-white flex items-center justify-center transition-colors shadow"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-8 h-8 rounded bg-[#08090C]/90 border border-white/10 hover:border-white/30 text-white flex items-center justify-center transition-colors shadow"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.flyTo([station.latitude, station.longitude], 4.5)}
          className="w-8 h-8 rounded bg-[#08090C]/90 border border-white/10 hover:border-white/30 text-white flex items-center justify-center transition-colors shadow"
          title="Recenter on active station"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
