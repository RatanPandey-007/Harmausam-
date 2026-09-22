import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  StationLocation, 
  WeatherVariable, 
  ForecastSourceId, 
  BlendedForecastResult 
} from '../../core/types';
import { ExplorerDisplayMode } from './ForecastControls';
import { WeatherFieldRenderer } from './map/WeatherFieldRenderer';
import { WindStreamlineEngine } from './map/WindStreamlineEngine';
import { MapTelemetryOverlay } from './map/MapTelemetryOverlay';
import { MapLegendOverlay } from './map/MapLegendOverlay';
import { MapControlsOverlay } from './map/MapControlsOverlay';
import { MapHoverTooltip, HoverTooltipData } from './map/MapHoverTooltip';

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
  isDemonstrationData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const weatherCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const singleMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const windEngineRef = useRef<WindStreamlineEngine | null>(null);

  const [hoverData, setHoverData] = useState<HoverTooltipData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Sync canvas dimensions with map viewport
  const resizeCanvas = useCallback(() => {
    if (!mapContainerRef.current || !weatherCanvasRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      weatherCanvasRef.current.width = rect.width;
      weatherCanvasRef.current.height = rect.height;
    }
  }, []);

  // Redraw the active meteorological field onto the canvas
  const redrawWeatherField = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = weatherCanvasRef.current;
    if (!map || !canvas) return;

    if (selectedVariable === 'wind_speed_10m') {
      // Start or update wind vector particles
      if (!windEngineRef.current) {
        windEngineRef.current = new WindStreamlineEngine(canvas, map, station, currentResult);
      } else {
        windEngineRef.current.updateParameters(station, currentResult, leadTimeHours);
      }
      windEngineRef.current.start();
    } else {
      // Stop wind engine if active
      if (windEngineRef.current) {
        windEngineRef.current.stop();
      }
      // Render continuous 2D meteorological field or pressure isobars
      WeatherFieldRenderer.renderField(
        canvas,
        map,
        station,
        selectedVariable,
        displayMode,
        selectedSource,
        leadTimeHours,
        currentResult
      );
    }
  }, [station, selectedVariable, displayMode, selectedSource, leadTimeHours, currentResult]);

  // Initialize Leaflet Map with Zero-Watermark Base Map
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

      // Primary: CartoDB Dark No-Labels (subtle coastlines, no city labels, no watermarks)
      // Fallback: Esri World Dark Gray Canvas
      const primaryUrl = (import.meta as any).env?.VITE_MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
      const fallbackUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

      const tileLayer = L.tileLayer(primaryUrl, {
        subdomains: 'abcd',
        maxZoom: 18,
      });

      tileLayer.on('tileerror', () => {
        // Fallback cleanly without alerting the user
        if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(fallbackUrl);
        }
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Event listeners for canvas synchronization
      const handleMapChange = () => {
        resizeCanvas();
        redrawWeatherField();
      };

      map.on('move', handleMapChange);
      map.on('zoom', handleMapChange);
      map.on('resize', handleMapChange);

      // Initial sizing
      setTimeout(() => {
        map.invalidateSize();
        resizeCanvas();
        redrawWeatherField();
      }, 50);
    }

    return () => {
      if (windEngineRef.current) {
        windEngineRef.current.stop();
        windEngineRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center smoothly when active station changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([station.latitude, station.longitude], 4.5, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [station.id]);

  // Handle lead time transition animation
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      redrawWeatherField();
    }, 150);
    return () => clearTimeout(timer);
  }, [leadTimeHours]);

  // Redraw field when variable, mode, source, or results update
  useEffect(() => {
    redrawWeatherField();
  }, [station.id, selectedVariable, displayMode, selectedSource, currentResult, redrawWeatherField]);

  // Update the ONE Elegant Selected Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (singleMarkerRef.current) {
      singleMarkerRef.current.remove();
      singleMarkerRef.current = null;
    }

    const val = displayMode === 'SINGLE'
      ? currentResult.individualForecasts[selectedSource]
      : displayMode === 'DISAGREEMENT'
      ? currentResult.modelSpread
      : currentResult.adaptiveBlendedForecast;

    const unit = selectedVariable === 'temperature_2m' 
      ? '°C' 
      : selectedVariable === 'precipitation' 
      ? 'mm' 
      : selectedVariable === 'wind_speed_10m' 
      ? 'm/s' 
      : selectedVariable === 'relative_humidity_2m' 
      ? '%' 
      : 'hPa';

    const displayStr = displayMode === 'DISAGREEMENT' 
      ? `σ ${val.toFixed(2)}` 
      : `${val.toFixed(1)}${unit}`;

    // Single Refined Reticle Marker (NASA/Tesla minimalist aesthetics)
    const markerHtml = `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); cursor:default;">
        <!-- Animated Radar Ping Reticle -->
        <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
          <span style="position:absolute; inset:0; border-radius:50%; border:1px solid #38BDF8; opacity:0.8; animation:ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="position:absolute; width:12px; height:12px; border-radius:50%; border:1.5px solid #FFFFFF; background:#08090C;"></span>
          <span style="width:4px; height:4px; border-radius:50%; background:#38BDF8;"></span>
        </div>

        <!-- Single Dark Glass Reticle Badge -->
        <div style="
          margin-top: 6px;
          background: rgba(8, 9, 12, 0.90);
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          color: #FFFFFF;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          display: flex;
          align-items: baseline;
          gap: 5px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0,0,0,0.7);
        ">
          <span style="font-weight: 700; letter-spacing: 0.05em; font-size: 10px; color: #E2E8F0; text-transform: uppercase;">
            ${station.name.split(' (')[0]}
          </span>
          <span style="font-family: monospace; font-weight: 700; color: #38BDF8;">
            ${displayStr}
          </span>
        </div>
      </div>
    `;

    const singleIcon = L.divIcon({
      className: 'single-station-reticle',
      html: markerHtml,
      iconSize: [0, 0],
    });

    const marker = L.marker([station.latitude, station.longitude], { icon: singleIcon });
    marker.addTo(map);
    singleMarkerRef.current = marker;
  }, [station, selectedVariable, displayMode, selectedSource, currentResult]);

  // Handle map mouse move for interactive hover tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const map = mapInstanceRef.current;
    if (!map || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const latLng = map.containerPointToLatLng([x, y]);
    const fieldInfo = WeatherFieldRenderer.evaluateFieldAtLatLng(
      latLng.lat,
      latLng.lng,
      station,
      selectedVariable,
      displayMode,
      selectedSource,
      leadTimeHours,
      currentResult
    );

    const varLabels: Record<WeatherVariable, string> = {
      temperature_2m: 'Temperature',
      precipitation: 'Precipitation',
      wind_speed_10m: 'Wind Speed',
      relative_humidity_2m: 'Relative Humidity',
      surface_pressure: 'Surface Pressure',
    };

    setHoverData({
      x,
      y,
      lat: latLng.lat,
      lng: latLng.lng,
      valueFormatted: fieldInfo.formatted,
      unit: fieldInfo.unit,
      variableLabel: varLabels[selectedVariable],
      sourceLabel: fieldInfo.sourceLabel,
      leadTimeHours,
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div 
      className="relative w-full h-[600px] lg:h-[720px] rounded border border-white/10 bg-[#08090C] overflow-hidden select-none group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Underlying Base Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 cursor-crosshair"
      />

      {/* 2. Meteorological Weather Field Canvas Overlay */}
      <canvas
        ref={weatherCanvasRef}
        className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-70' : 'opacity-100'
        }`}
      />

      {/* 3. Scientific Telemetry Overlay (Top-Left) */}
      <MapTelemetryOverlay
        station={station}
        selectedVariable={selectedVariable}
        displayMode={displayMode}
        selectedSource={selectedSource}
        leadTimeHours={leadTimeHours}
        currentResult={currentResult}
        isDemonstrationData={isDemonstrationData}
      />

      {/* 4. Dynamic Scientific Legend (Bottom-Left) */}
      <MapLegendOverlay
        selectedVariable={selectedVariable}
        displayMode={displayMode}
        leadTimeHours={leadTimeHours}
      />

      {/* 5. Minimalist Vertical Map Controls (Top-Right) */}
      <MapControlsOverlay
        onZoomIn={() => mapInstanceRef.current?.zoomIn()}
        onZoomOut={() => mapInstanceRef.current?.zoomOut()}
        onRecenter={() => {
          mapInstanceRef.current?.flyTo([station.latitude, station.longitude], 4.5, {
            duration: 1.0,
          });
        }}
      />

      {/* 6. Interactive Hover Inspection Tooltip */}
      <MapHoverTooltip data={hoverData} />

    </div>
  );
};
