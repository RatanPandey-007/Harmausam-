import React from 'react';
import { WeatherVariable } from '../../../core/types';
import { ExplorerDisplayMode } from '../ForecastControls';

interface MapLegendOverlayProps {
  selectedVariable: WeatherVariable;
  displayMode: ExplorerDisplayMode;
  leadTimeHours: number;
}

export const MapLegendOverlay: React.FC<MapLegendOverlayProps> = ({
  selectedVariable,
  displayMode,
  leadTimeHours,
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-20 p-3 rounded bg-[#08090C]/85 border border-white/10 backdrop-blur-md text-slate-300 font-mono shadow-2xl pointer-events-none max-w-xs">
      {displayMode === 'DISAGREEMENT' ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400">
            <span>MODEL DISAGREEMENT (σ)</span>
            <span className="text-white font-sans">Lead +{leadTimeHours}h</span>
          </div>
          <div className="w-52 h-2 rounded-sm bg-gradient-to-r from-slate-700 via-sky-400 via-amber-400 to-rose-600" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>0.2 (Consensus)</span>
            <span>1.5</span>
            <span>3.0+ (Severe Divergence)</span>
          </div>
        </div>
      ) : selectedVariable === 'temperature_2m' ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400">
            <span>TEMPERATURE FIELD (°C)</span>
            <span className="text-white font-sans">+{leadTimeHours}h</span>
          </div>
          <div className="w-52 h-2 rounded-sm bg-gradient-to-r from-[#1E1B4B] via-[#06B6D4] via-[#10B981] via-[#F59E0B] via-[#F97316] to-[#EF4444]" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>-15°C (Cold)</span>
            <span>10°C</span>
            <span>25°C</span>
            <span>42°C+ (Warm)</span>
          </div>
        </div>
      ) : selectedVariable === 'precipitation' ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400">
            <span>PRECIPITATION INTENSITY (mm)</span>
            <span className="text-white font-sans">+{leadTimeHours}h</span>
          </div>
          <div className="w-52 h-2 rounded-sm bg-gradient-to-r from-white/10 via-sky-400 via-blue-600 via-indigo-600 to-purple-600" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>0 mm</span>
            <span>2.5 mm</span>
            <span>10 mm</span>
            <span>25 mm</span>
            <span>50+ mm</span>
          </div>
        </div>
      ) : selectedVariable === 'wind_speed_10m' ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400">
            <span>WIND STREAMLINES (m/s)</span>
            <span className="text-white font-sans">Vector Flow</span>
          </div>
          <div className="w-52 h-2 rounded-sm bg-gradient-to-r from-slate-400 via-sky-400 via-amber-400 to-rose-600" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>0 (Calm)</span>
            <span>5 (Breeze)</span>
            <span>12 (Gale)</span>
            <span>20+ m/s</span>
          </div>
        </div>
      ) : selectedVariable === 'relative_humidity_2m' ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400">
            <span>RELATIVE HUMIDITY (%)</span>
            <span className="text-white font-sans">Vapor Field</span>
          </div>
          <div className="w-52 h-2 rounded-sm bg-gradient-to-r from-amber-700/60 via-sky-500/60 via-teal-500/70 to-emerald-500" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>20% (Dry)</span>
            <span>50%</span>
            <span>75%</span>
            <span>100% (Saturated)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400">
            <span>SURFACE PRESSURE (hPa)</span>
            <span className="text-white font-sans">4 hPa Isobars</span>
          </div>
          <div className="w-52 h-2 rounded-sm bg-gradient-to-r from-amber-500 via-slate-400 to-sky-400" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>996 (Low)</span>
            <span>1012 (Standard)</span>
            <span>1028 (High)</span>
          </div>
        </div>
      )}
    </div>
  );
};
