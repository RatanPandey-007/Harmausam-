import React from 'react';
import { StationLocation, WeatherVariable, ForecastSourceId, BlendedForecastResult } from '../../../core/types';
import { ExplorerDisplayMode } from '../ForecastControls';

interface MapTelemetryOverlayProps {
  station: StationLocation;
  selectedVariable: WeatherVariable;
  displayMode: ExplorerDisplayMode;
  selectedSource: ForecastSourceId;
  leadTimeHours: number;
  currentResult: BlendedForecastResult;
  isDemonstrationData: boolean;
}

export const MapTelemetryOverlay: React.FC<MapTelemetryOverlayProps> = ({
  station,
  selectedVariable,
  displayMode,
  selectedSource,
  leadTimeHours,
  currentResult,
  isDemonstrationData,
}) => {
  // Value at station based on mode
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

  const sourceName = displayMode === 'SINGLE'
    ? `${selectedSource} 9km NWP`
    : displayMode === 'DISAGREEMENT'
    ? 'Multi-Model Spread (σ)'
    : 'Adaptive Bayesian Blend';

  return (
    <div className="absolute top-4 left-4 z-20 p-4 rounded bg-[#08090C]/85 border border-white/10 backdrop-blur-md text-slate-300 font-sans pointer-events-none max-w-[260px] shadow-2xl transition-all">
      {/* Header status */}
      <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-slate-400 uppercase">
        <span className="truncate">{station.region.split(' (')[0]}</span>
        <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 border border-white/10 text-slate-300 font-bold">
          {isDemonstrationData ? 'DEMO DATA' : 'LIVE STREAM'}
        </span>
      </div>

      {/* Main Station Name & Big Value */}
      <div className="mt-2">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">
          {station.name.split(' (')[0]}
        </div>
        <div className="flex items-baseline space-x-1.5 mt-0.5">
          <span className="text-3xl font-bold tracking-tight text-white font-sans">
            {displayMode === 'DISAGREEMENT' ? `σ ${val.toFixed(2)}` : val.toFixed(1)}
          </span>
          {displayMode !== 'DISAGREEMENT' && (
            <span className="text-sm font-mono text-slate-400">{unit}</span>
          )}
        </div>
      </div>

      {/* Meteorological Metadata Rows */}
      <div className="mt-3 pt-2.5 hairline-t space-y-1.5 text-[11px] font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Forecast:</span>
          <span className="text-white font-medium">+{leadTimeHours} Hours</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Source:</span>
          <span className="text-white font-medium truncate max-w-[130px]">{sourceName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Regime:</span>
          <span className="text-white font-medium">{currentResult.context.detectedRegime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Model spread:</span>
          <span className="text-white font-medium">{currentResult.modelSpread.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
