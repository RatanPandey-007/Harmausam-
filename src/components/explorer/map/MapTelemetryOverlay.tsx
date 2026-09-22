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

  const varName = selectedVariable === 'temperature_2m'
    ? 'TEMPERATURE (2M)'
    : selectedVariable === 'precipitation'
    ? 'PRECIPITATION (3H)'
    : selectedVariable === 'wind_speed_10m'
    ? 'WIND SPEED (10M)'
    : selectedVariable === 'relative_humidity_2m'
    ? 'RELATIVE HUMIDITY'
    : 'SURFACE PRESSURE';

  return (
    <div className="absolute top-3 left-3 z-20 p-3.5 rounded bg-[#08090C]/90 border border-white/15 backdrop-blur-md text-slate-300 font-mono pointer-events-none w-64 shadow-2xl transition-all">
      {/* 1. Header with Data Transparency Tag */}
      <div className="flex items-center justify-between text-[8px] tracking-widest text-slate-400 uppercase hairline-b pb-2">
        <span>HARMAUSAM OPERATIONAL CONSOLE</span>
        <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 font-bold">
          {isDemonstrationData ? 'DEMO' : 'LIVE'}
        </span>
      </div>

      {/* 2. Structured Meteorological Information Grid */}
      <div className="space-y-2.5 mt-2.5">
        
        {/* Location & Coordinates */}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            LOCATION
          </div>
          <div className="text-sm font-bold text-white font-sans mt-0.5">
            {station.name.toUpperCase()}
          </div>
          <div className="text-[10px] text-cyan-300">
            {station.latitude.toFixed(2)}°N · {station.longitude.toFixed(2)}°E
          </div>
        </div>

        {/* Target Lead Horizon */}
        <div className="hairline-t pt-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            TARGET LEAD
          </div>
          <div className="text-xs font-bold text-white">
            +{leadTimeHours} HOURS
          </div>
        </div>

        {/* Variable & Primary Readout */}
        <div className="hairline-t pt-2 flex items-baseline justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              VARIABLE
            </div>
            <div className="text-[11px] font-bold text-slate-200">
              {varName}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white font-sans">
              {displayMode === 'DISAGREEMENT' ? `σ ${val.toFixed(2)}` : val.toFixed(1)}
            </span>
            {displayMode !== 'DISAGREEMENT' && (
              <span className="text-xs text-slate-400 ml-1">{unit}</span>
            )}
          </div>
        </div>

        {/* Weather Regime Context */}
        <div className="hairline-t pt-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            WEATHER REGIME
          </div>
          <div className="text-xs font-bold text-white uppercase">
            {currentResult.context.detectedRegime}
          </div>
        </div>

        {/* Model Spread Disagreement */}
        <div className="hairline-t pt-2 flex justify-between items-center">
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            MODEL SPREAD
          </div>
          <div className="text-xs font-bold text-cyan-300">
            {currentResult.modelSpread.toFixed(2)}{unit}
          </div>
        </div>

      </div>
    </div>
  );
};
