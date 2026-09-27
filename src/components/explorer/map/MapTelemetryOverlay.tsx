import React, { useState } from 'react';
import { StationLocation, WeatherVariable, ForecastSourceId, BlendedForecastResult } from '../../../core/types';
import { ExplorerDisplayMode } from '../ForecastControls';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MapTelemetryOverlayProps {
  station: StationLocation;
  selectedVariable: WeatherVariable;
  displayMode: ExplorerDisplayMode;
  selectedSource: ForecastSourceId;
  leadTimeHours: number;
  currentResult: BlendedForecastResult;
  isDemonstrationData: boolean;
  hasMapTilerKey: boolean;
  isOverlayAvailable?: boolean;
}

export const MapTelemetryOverlay: React.FC<MapTelemetryOverlayProps> = ({
  station,
  selectedVariable,
  displayMode,
  selectedSource,
  leadTimeHours,
  currentResult,
  isDemonstrationData,
  hasMapTilerKey,
  isOverlayAvailable = true,
}) => {
  const [isCollapsedMobile, setIsCollapsedMobile] = useState<boolean>(false);

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

  const shortCity = station.name.split(' (')[0];

  return (
    <div className="absolute top-3 left-3 z-20 pointer-events-auto">
      <div className="bg-[#0E1015]/95 text-slate-200 border border-slate-800/90 shadow-2xl backdrop-blur-md rounded-xl p-3 sm:p-4 text-xs w-[240px] sm:w-[275px] transition-all">
        
        {/* Status Header: Clean Operational Badges */}
        <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{hasMapTilerKey ? 'MAPTILER BASEMAP' : 'OPERATIONAL BASEMAP'}</span>
            </span>

            {!isOverlayAvailable && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                OVERLAY UNAVAILABLE
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsedMobile(!isCollapsedMobile)}
            className="sm:hidden text-slate-400 hover:text-white p-0.5"
            aria-label="Toggle card details"
          >
            {isCollapsedMobile ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Primary Header: Location & Prominent Readout */}
        <div className="mt-3 flex items-start justify-between">
          <div>
            <div className="text-[9px] font-mono tracking-wider text-slate-500 uppercase font-semibold">
              STATION
            </div>
            <div className="text-base font-bold text-white leading-tight font-sans">
              {shortCity}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              {station.latitude.toFixed(2)}°N · {station.longitude.toFixed(2)}°E
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {displayMode === 'DISAGREEMENT' ? `σ ${val.toFixed(2)}` : `${val.toFixed(1)}${unit}`}
            </div>
            <div className="text-[9px] font-mono uppercase text-cyan-400 mt-0.5">
              {displayMode === 'SINGLE' ? `${selectedSource} IFS` : displayMode === 'DISAGREEMENT' ? 'MODEL SPREAD' : 'ADAPTIVE BLEND'}
            </div>
          </div>
        </div>

        {/* Scientific Telemetry Deck */}
        <div className={`${isCollapsedMobile ? 'hidden' : 'block'} sm:block mt-3 pt-2.5 border-t border-slate-800/80 space-y-2 font-mono text-[11px]`}>
          
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">HORIZON</span>
            <span className="font-semibold text-slate-200">+{leadTimeHours}h Outlook</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">REGIME</span>
            <span className="font-medium text-slate-200">{currentResult.context.detectedRegime}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">MODEL SPREAD</span>
            <span className="font-semibold text-cyan-400">{currentResult.modelSpread.toFixed(2)}{unit}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
