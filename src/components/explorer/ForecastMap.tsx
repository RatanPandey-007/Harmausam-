import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { 
  StationLocation, 
  WeatherVariable, 
  ForecastSourceId, 
  BlendedForecastResult 
} from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';
import { ExplorerDisplayMode } from './ForecastControls';
import { WeatherFieldRenderer } from './map/WeatherFieldRenderer';
import { WindStreamlineEngine } from './map/WindStreamlineEngine';
import { MapTelemetryOverlay } from './map/MapTelemetryOverlay';
import { MapLegendOverlay } from './map/MapLegendOverlay';
import { MapControlsOverlay } from './map/MapControlsOverlay';
import { MapHoverTooltip, HoverTooltipData } from './map/MapHoverTooltip';
import { MapStatusOverlay, ForecastOverlayStatus } from './map/MapStatusOverlay';
import { 
  resolveMapStyle, 
  getFallbackMapStyle,
  getMapProviderConfig, 
  MapStyleType, 
  getMapAttribution 
} from './map/mapProviders';

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
  isPipelineLoading?: boolean;
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
  isPipelineLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const weatherCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const activeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const windEngineRef = useRef<WindStreamlineEngine | null>(null);

  const [activeStyle, setActiveStyle] = useState<MapStyleType>('standard');
  const [hoverData, setHoverData] = useState<HoverTooltipData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [overlayStatus, setOverlayStatus] = useState<ForecastOverlayStatus>('LOADING');
  const [overlaySubMessage, setOverlaySubMessage] = useState<string | null>(null);
  const [baseMapError, setBaseMapError] = useState<boolean>(false);
  const [providerConfig] = useState(() => getMapProviderConfig());

  // Synchronize weather canvas resolution with MapLibre viewport
  const resizeCanvas = useCallback(() => {
    if (!mapContainerRef.current || !weatherCanvasRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      weatherCanvasRef.current.width = rect.width;
      weatherCanvasRef.current.height = rect.height;
    }
  }, []);

  // Compute station forecast value for the markers
  const getStationValue = useCallback((st: StationLocation): { val: number; unit: string } => {
    const unit = selectedVariable === 'temperature_2m' 
      ? '°C' 
      : selectedVariable === 'precipitation' 
      ? 'mm' 
      : selectedVariable === 'wind_speed_10m' 
      ? 'm/s' 
      : selectedVariable === 'relative_humidity_2m' 
      ? '%' 
      : 'hPa';

    if (st.id === station.id) {
      const val = displayMode === 'SINGLE'
        ? (currentResult?.individualForecasts?.[selectedSource] ?? currentResult?.adaptiveBlendedForecast ?? 0)
        : displayMode === 'DISAGREEMENT'
        ? (currentResult?.modelSpread ?? 0)
        : (currentResult?.adaptiveBlendedForecast ?? 0);
      return { val, unit };
    }

    if (selectedVariable === 'temperature_2m') {
      const base = st.climatology.tempMean;
      const diurnal = Math.sin((leadTimeHours / 24) * Math.PI * 2) * 3.5;
      return { val: base + diurnal, unit };
    } else if (selectedVariable === 'precipitation') {
      const val = st.id === 'VIDP' ? 4.2 : st.id === 'RJTT' ? 14.5 : 0.8;
      return { val, unit };
    } else if (selectedVariable === 'wind_speed_10m') {
      return { val: st.climatology.windMeanMs * 1.2, unit };
    } else if (selectedVariable === 'relative_humidity_2m') {
      const val = st.id === 'VIDP' ? 68 : st.id === 'EGLL' ? 78 : 55;
      return { val, unit };
    } else {
      const val = st.id === 'VIDP' ? 1010 : st.id === 'EGLL' ? 1018 : 1014;
      return { val, unit };
    }
  }, [station.id, selectedVariable, displayMode, selectedSource, currentResult, leadTimeHours]);

  // Execute drawing of meteorological canvas layer
  const renderCanvasLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = weatherCanvasRef.current;
    if (!map || !canvas) return;

    if (selectedVariable === 'wind_speed_10m') {
      if (!windEngineRef.current) {
        windEngineRef.current = new WindStreamlineEngine(canvas, map, station, currentResult);
      } else {
        windEngineRef.current.updateParameters(station, currentResult, leadTimeHours);
      }
      windEngineRef.current.start();
    } else {
      if (windEngineRef.current) {
        windEngineRef.current.stop();
      }
      WeatherFieldRenderer.renderField(
        canvas,
        map,
        station,
        selectedVariable,
        displayMode,
        selectedSource,
        leadTimeHours,
        currentResult,
        isDemonstrationData
      );
    }
  }, [station, selectedVariable, displayMode, selectedSource, leadTimeHours, currentResult, isDemonstrationData]);

  // STEP 4: Independent Forecast Overlay Loading & Validation Lifecycle (try/catch/finally + timeout)
  useEffect(() => {
    let isCancelled = false;
    let timeoutId: any = null;

    if (isPipelineLoading) {
      setOverlayStatus('LOADING');
      setOverlaySubMessage(null);
      return;
    }

    setOverlayStatus('LOADING');
    setOverlaySubMessage(null);

    // STEP 3: Request timeout (12s) - forecast overlay must never hang forever
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setOverlayStatus('UNAVAILABLE');
        setOverlaySubMessage('Forecast data could not be loaded for this location/time.');
        const canvas = weatherCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (windEngineRef.current) windEngineRef.current.stop();
      }
    }, 12000);

    const executeOverlayUpdate = async () => {
      try {
        // STEP 5: Real Forecast Data Validation
        if (!currentResult) {
          if (!isCancelled) {
            setOverlayStatus('INSUFFICIENT_DATA');
            setOverlaySubMessage('No forecast data available for this station.');
          }
          return;
        }

        if (!currentResult.individualForecasts || Object.keys(currentResult.individualForecasts).length === 0) {
          if (!isCancelled) {
            setOverlayStatus('INSUFFICIENT_DATA');
            setOverlaySubMessage('NWP model outputs missing in forecast record.');
          }
          return;
        }

        if (displayMode === 'SINGLE') {
          const val = currentResult.individualForecasts[selectedSource];
          if (val === undefined || isNaN(val)) {
            if (!isCancelled) {
              setOverlayStatus('INSUFFICIENT_DATA');
              setOverlaySubMessage(`${selectedSource} model data unavailable for this parameter.`);
            }
            return;
          }
        } else if (displayMode === 'DISAGREEMENT') {
          if (currentResult.modelSpread === undefined || isNaN(currentResult.modelSpread)) {
            if (!isCancelled) {
              setOverlayStatus('INSUFFICIENT_DATA');
              setOverlaySubMessage('Multi-model divergence metrics unavailable.');
            }
            return;
          }
        } else {
          // BLENDED or COMPARISON
          if (currentResult.adaptiveBlendedForecast === undefined || isNaN(currentResult.adaptiveBlendedForecast)) {
            if (!isCancelled) {
              setOverlayStatus('INSUFFICIENT_DATA');
              setOverlaySubMessage('Adaptive consensus forecast not computed.');
            }
            return;
          }
        }

        // Render Canvas Layer
        resizeCanvas();
        renderCanvasLayer();

        if (!isCancelled) {
          setOverlayStatus('SUCCESS');
          setOverlaySubMessage(null);
        }
      } catch (err: any) {
        console.error('Forecast map overlay error:', err);
        if (!isCancelled) {
          setOverlayStatus('UNAVAILABLE');
          setOverlaySubMessage('Forecast data could not be loaded for this location/time.');
          const canvas = weatherCanvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          if (windEngineRef.current) windEngineRef.current.stop();
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    executeOverlayUpdate();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    station,
    selectedVariable,
    displayMode,
    selectedSource,
    leadTimeHours,
    currentResult,
    isDemonstrationData,
    isPipelineLoading,
    resizeCanvas,
    renderCanvasLayer
  ]);

  // STEP 4 & 6: Initialize MapLibre GL Basemap (MapTiler + Fallback, independent of overlay)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    setBaseMapError(false);

    const initialStyle = resolveMapStyle('standard');

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [station.longitude, station.latitude],
        zoom: 2.8,
        minZoom: 1.5,
        maxZoom: 14,
        attributionControl: false,
      });
    } catch {
      // In case of immediate initialization error, try fallback style
      try {
        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: getFallbackMapStyle('standard'),
          center: [station.longitude, station.latitude],
          zoom: 2.8,
          minZoom: 1.5,
          maxZoom: 14,
          attributionControl: false,
        });
      } catch {
        setBaseMapError(true);
        return;
      }
    }

    // Add minimal compliant attribution in bottom-right corner
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: getMapAttribution('standard'),
      }),
      'bottom-right'
    );

    let basemapReady = false;
    const onBasemapReady = () => {
      if (basemapReady) return;
      basemapReady = true;
      setBaseMapError(false);
      resizeCanvas();
      renderCanvasLayer();

      // Smooth camera glide to regional focus on load
      setTimeout(() => {
        if (!mapInstanceRef.current) return;
        map.flyTo({
          center: [station.longitude, station.latitude],
          zoom: 4.8,
          speed: 0.85,
          curve: 1.25,
          essential: true,
        });
      }, 350);
    };

    map.once('load', onBasemapReady);
    map.once('style.load', onBasemapReady);
    map.once('idle', onBasemapReady);

    // Gracefully catch and handle style loading errors without blocking the user
    let hasAttemptedFallback = false;
    map.on('error', (e) => {
      if (!basemapReady && !hasAttemptedFallback) {
        hasAttemptedFallback = true;
        console.warn('[ForecastMap] Style loading issue encountered, applying operational fallback style.');
        try {
          map.setStyle(getFallbackMapStyle(activeStyle));
          map.once('style.load', onBasemapReady);
          map.once('idle', onBasemapReady);
        } catch {
          setBaseMapError(true);
        }
      }
    });

    // Basemap safety timer: ensures ready state within 4 seconds even if network hangs
    const safetyTimer = setTimeout(() => {
      if (!basemapReady) {
        onBasemapReady();
      }
    }, 4000);

    const handleCameraChange = () => {
      resizeCanvas();
      renderCanvasLayer();
    };

    map.on('move', handleCameraChange);
    map.on('zoom', handleCameraChange);
    map.on('resize', handleCameraChange);

    mapInstanceRef.current = map;

    return () => {
      clearTimeout(safetyTimer);
      if (windEngineRef.current) {
        windEngineRef.current.stop();
        windEngineRef.current = null;
      }
      activeMarkersRef.current.forEach((m) => m.remove());
      activeMarkersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update basemap style when user changes style (Standard / Satellite / Terrain)
  const handleChangeStyle = useCallback((newStyle: MapStyleType) => {
    setActiveStyle(newStyle);
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const styleSpec = resolveMapStyle(newStyle);
      map.setStyle(styleSpec);

      map.once('style.load', () => {
        resizeCanvas();
        renderCanvasLayer();
      });
    } catch {
      map.setStyle(getFallbackMapStyle(newStyle));
      map.once('style.load', () => {
        resizeCanvas();
        renderCanvasLayer();
      });
    }
  }, [renderCanvasLayer, resizeCanvas]);

  // Smooth camera glide when active station changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo({
      center: [station.longitude, station.latitude],
      zoom: 4.8,
      speed: 1.1,
      curve: 1.2,
      essential: true,
    });
  }, [station.id, station.latitude, station.longitude]);

  // Lead time change transition
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      renderCanvasLayer();
    }, 120);
    return () => clearTimeout(timer);
  }, [leadTimeHours, renderCanvasLayer]);

  // Manage Station Markers on Map (interactive and fully functional at all times)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    activeMarkersRef.current.forEach((m) => m.remove());
    activeMarkersRef.current = [];

    // 1. Render Selected Station Marker
    const selectedEl = document.createElement('div');
    selectedEl.className = 'forecast-station-selected';
    selectedEl.style.display = 'flex';
    selectedEl.style.flexDirection = 'column';
    selectedEl.style.alignItems = 'center';
    selectedEl.style.transform = 'translate(-50%, -50%)';
    selectedEl.style.cursor = 'default';
    selectedEl.style.pointerEvents = 'auto';

    const { val: selVal, unit: selUnit } = getStationValue(station);
    const selValFormatted = displayMode === 'DISAGREEMENT'
      ? `σ ${selVal.toFixed(2)}`
      : `${selVal.toFixed(1)}${selUnit}`;
    const shortCity = station.name.split(' (')[0].toUpperCase();

    const modeBadge = displayMode === 'SINGLE'
      ? selectedSource
      : displayMode === 'DISAGREEMENT'
      ? 'SPREAD'
      : 'BLEND';

    selectedEl.innerHTML = `
      <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
        <span style="position:absolute; width:24px; height:24px; border-radius:50%; background:rgba(56,189,248,0.25); animation:pulse 2s infinite;"></span>
        <span style="position:absolute; width:13px; height:13px; border-radius:50%; border:2px solid #38BDF8; background:#0E1015; box-shadow:0 0 10px rgba(56,189,248,0.5);"></span>
        <span style="width:5px; height:5px; border-radius:50%; background:#38BDF8;"></span>
      </div>
      <div style="
        margin-top: 4px;
        background: rgba(14, 16, 21, 0.95);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: #F8FAFC;
        padding: 3px 8px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        display: flex;
        align-items: baseline;
        gap: 6px;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
      ">
        <span style="font-weight: 700; letter-spacing: 0.05em; font-size: 9.5px; color: #94A3B8; text-transform: uppercase;">
          ${shortCity}
        </span>
        <span style="font-family: monospace; font-weight: 700; font-size: 11.5px; color: #38BDF8;">
          ${selValFormatted}
        </span>
        <span style="font-size: 8.5px; color: #64748B; font-mono; font-weight: 600;">
          ${modeBadge}
        </span>
      </div>
    `;

    const selectedMarker = new maplibregl.Marker({ element: selectedEl })
      .setLngLat([station.longitude, station.latitude])
      .addTo(map);

    activeMarkersRef.current.push(selectedMarker);

    // 2. Multi-Model Comparison Badges (when Comparison mode is active)
    if (displayMode === 'COMPARISON') {
      const sourceOffsets: { id: ForecastSourceId; name: string; dLon: number; dLat: number }[] = [
        { id: 'ECMWF', name: 'ECMWF', dLon: -1.8, dLat: 1.1 },
        { id: 'GFS', name: 'GFS', dLon: 1.8, dLat: 1.1 },
        { id: 'ICON', name: 'ICON', dLon: -1.8, dLat: -1.1 },
        { id: 'GRAPHCAST', name: 'AI', dLon: 1.8, dLat: -1.1 },
      ];

      sourceOffsets.forEach((src) => {
        const srcVal = currentResult?.individualForecasts?.[src.id] ?? currentResult?.adaptiveBlendedForecast ?? 0;
        const srcUnit = selectedVariable === 'temperature_2m' 
          ? '°C' 
          : selectedVariable === 'precipitation' 
          ? 'mm' 
          : selectedVariable === 'wind_speed_10m' 
          ? 'm/s' 
          : selectedVariable === 'relative_humidity_2m' 
          ? '%' 
          : 'hPa';

        const cmpEl = document.createElement('div');
        cmpEl.className = `forecast-source-badge-${src.id}`;
        cmpEl.style.transform = 'translate(-50%, -50%)';
        cmpEl.style.pointerEvents = 'auto';
        cmpEl.style.cursor = 'default';

        cmpEl.innerHTML = `
          <div style="
            background: rgba(14, 16, 21, 0.94);
            border: 1px solid rgba(71, 85, 105, 0.6);
            padding: 2.5px 7px;
            border-radius: 5px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 10px;
            display: flex;
            align-items: baseline;
            gap: 5px;
            white-space: nowrap;
            box-shadow: 0 3px 8px rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
          ">
            <span style="font-weight: 700; font-size: 9px; color: #94A3B8;">
              ${src.name}
            </span>
            <span style="font-family: monospace; font-weight: 700; font-size: 10.5px; color: #F8FAFC;">
              ${srcVal.toFixed(1)}${srcUnit}
            </span>
          </div>
        `;

        const cmpMarker = new maplibregl.Marker({ element: cmpEl })
          .setLngLat([station.longitude + src.dLon, station.latitude + src.dLat])
          .addTo(map);

        activeMarkersRef.current.push(cmpMarker);
      });
    }

    // 3. Render Network Stations as clickable points for quick navigation
    GLOBAL_STATIONS.forEach((st) => {
      if (st.id === station.id) return;

      const { val: netVal, unit: netUnit } = getStationValue(st);
      const netValFormatted = `${netVal.toFixed(1)}${netUnit}`;
      const netCity = st.name.split(' (')[0].toUpperCase();

      const netEl = document.createElement('div');
      netEl.className = `forecast-station-network-${st.id}`;
      netEl.style.display = 'flex';
      netEl.style.flexDirection = 'column';
      netEl.style.alignItems = 'center';
      netEl.style.transform = 'translate(-50%, -50%)';
      netEl.style.cursor = 'pointer';
      netEl.style.pointerEvents = 'auto';

      netEl.innerHTML = `
        <div style="width:7px; height:7px; border-radius:50%; background:#38BDF8; border:1px solid #FFFFFF; box-shadow:0 0 6px rgba(56,189,248,0.7);"></div>
        <div style="
          margin-top: 3px;
          background: rgba(14, 16, 21, 0.90);
          border: 1px solid rgba(71, 85, 105, 0.5);
          color: #CBD5E1;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 9.5px;
          display: flex;
          align-items: baseline;
          gap: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        ">
          <span style="font-weight: 600; font-size: 8.5px; color: #94A3B8;">
            ${netCity}
          </span>
          <span style="font-family: monospace; font-weight: 600; font-size: 9.5px; color: #F1F5F9;">
            ${netValFormatted}
          </span>
        </div>
      `;

      netEl.addEventListener('click', () => {
        setStation(st);
      });

      const netMarker = new maplibregl.Marker({ element: netEl })
        .setLngLat([st.longitude, st.latitude])
        .addTo(map);

      activeMarkersRef.current.push(netMarker);
    });
  }, [station, selectedVariable, displayMode, selectedSource, currentResult, getStationValue, setStation]);

  // Interactive Hover Inspection Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const map = mapInstanceRef.current;
    if (!map || !mapContainerRef.current) return;
    if (!currentResult || overlayStatus !== 'SUCCESS') {
      setHoverData(null);
      return;
    }

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lngLat = map.unproject([x, y]);
    const fieldInfo = WeatherFieldRenderer.evaluateFieldAtLatLng(
      lngLat.lat,
      lngLat.lng,
      station,
      selectedVariable,
      displayMode,
      selectedSource,
      leadTimeHours,
      currentResult,
      isDemonstrationData
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
      lat: lngLat.lat,
      lng: lngLat.lng,
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
      className="relative w-full h-[540px] sm:h-[620px] lg:h-[700px] rounded-2xl border border-slate-800 bg-[#08090C] overflow-hidden select-none shadow-2xl group transition-all"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Underlying High-Quality Vector Basemap (MapTiler MapLibre GL / Operational Fallback) */}
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

      {/* 3. STEP 8: Small Non-Blocking Operational Status Indicator */}
      <MapStatusOverlay
        status={overlayStatus}
        subMessage={overlaySubMessage}
      />

      {/* 4. Rare Basemap Error Warning (Non-blocking, kept minimal) */}
      {baseMapError && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center space-x-2 bg-[#0E1015]/95 border border-amber-500/30 text-amber-200 px-3.5 py-1.5 rounded-lg shadow-xl font-mono text-xs pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1" />
            <span>Basemap temporarily unavailable — operating on coordinate grid</span>
          </div>
        </div>
      )}

      {/* 5. Minimalist Dark Telemetry Card (Top-Left) */}
      <MapTelemetryOverlay
        station={station}
        selectedVariable={selectedVariable}
        displayMode={displayMode}
        selectedSource={selectedSource}
        leadTimeHours={leadTimeHours}
        currentResult={currentResult}
        isDemonstrationData={isDemonstrationData}
        hasMapTilerKey={providerConfig.hasApiKey}
        isOverlayAvailable={overlayStatus === 'SUCCESS'}
      />

      {/* 6. Minimalist Weather Legend (Bottom-Left) */}
      <MapLegendOverlay
        selectedVariable={selectedVariable}
        displayMode={displayMode}
        leadTimeHours={leadTimeHours}
      />

      {/* 7. Minimalist Dark Map Controls & Basemap Switcher (Top-Right) */}
      <MapControlsOverlay
        onZoomIn={() => mapInstanceRef.current?.zoomIn()}
        onZoomOut={() => mapInstanceRef.current?.zoomOut()}
        onRecenter={() => {
          mapInstanceRef.current?.flyTo({
            center: [station.longitude, station.latitude],
            zoom: 4.8,
            speed: 1.0,
            essential: true,
          });
        }}
        activeStyle={activeStyle}
        onChangeStyle={handleChangeStyle}
      />

      {/* 8. Interactive Precision Hover Inspection Tooltip */}
      <MapHoverTooltip data={hoverData} />

    </div>
  );
};
