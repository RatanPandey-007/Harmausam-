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
    <div className="absolute bottom-3 left-3 z-20 p-2.5 sm:p-3 rounded-xl bg-[#0E1015]/95 border border-slate-800/90 shadow-2xl backdrop-blur-md text-slate-300 font-sans pointer-events-none max-w-xs transition-all">
      {displayMode === 'DISAGREEMENT' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <span>MODEL SPREAD (σ)</span>
            <span className="text-cyan-400">+{leadTimeHours}h</span>
          </div>
          <div className="w-44 sm:w-48 h-1.5 rounded-full bg-gradient-to-r from-slate-600 via-sky-400 via-amber-400 to-rose-500" />
          <div className="flex justify-between text-[8px] font-mono text-slate-400">
            <span>0.2 (Consensus)</span>
            <span>1.5</span>
            <span>3.0+ (Spread)</span>
          </div>
        </div>
      ) : selectedVariable === 'temperature_2m' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <span>TEMPERATURE FIELD (°C)</span>
            <span className="text-cyan-400">+{leadTimeHours}h</span>
          </div>
          <div className="w-44 sm:w-48 h-1.5 rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#0284C7] via-[#38BDF8] via-[#FDBA74] to-[#E11D48]" />
          <div className="flex justify-between text-[8px] font-mono text-slate-400">
            <span>-10°C</span>
            <span>0°C</span>
            <span>18°C</span>
            <span>28°C</span>
            <span>40°C</span>
          </div>
        </div>
      ) : selectedVariable === 'precipitation' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <span>PRECIPITATION INTENSITY</span>
            <span className="text-cyan-400">+{leadTimeHours}h</span>
          </div>
          <div className="w-44 sm:w-48 h-1.5 rounded-full bg-gradient-to-r from-slate-700 via-sky-400 via-blue-500 to-indigo-600" />
          <div className="flex justify-between text-[8px] font-mono text-slate-400">
            <span>0 mm</span>
            <span>2 mm</span>
            <span>10 mm</span>
            <span>25 mm</span>
            <span>50+ mm</span>
          </div>
        </div>
      ) : selectedVariable === 'wind_speed_10m' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <span>WIND STREAMLINES</span>
            <span className="text-cyan-400">m/s</span>
          </div>
          <div className="w-44 sm:w-48 h-1.5 rounded-full bg-gradient-to-r from-slate-600 via-cyan-400 via-blue-500 to-indigo-500" />
          <div className="flex justify-between text-[8px] font-mono text-slate-400">
            <span>Calm</span>
            <span>5 m/s</span>
            <span>12 m/s</span>
            <span>20+ m/s</span>
          </div>
        </div>
      ) : selectedVariable === 'relative_humidity_2m' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <span>RELATIVE HUMIDITY</span>
            <span className="text-cyan-400">%</span>
          </div>
          <div className="w-44 sm:w-48 h-1.5 rounded-full bg-gradient-to-r from-slate-600 via-sky-400 via-blue-500 to-cyan-300" />
          <div className="flex justify-between text-[8px] font-mono text-slate-400">
            <span>20% (Dry)</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <span>SURFACE PRESSURE</span>
            <span className="text-cyan-400">Isobars</span>
          </div>
          <div className="w-44 sm:w-48 h-1.5 rounded-full bg-gradient-to-r from-slate-700 via-sky-500 to-slate-400" />
          <div className="flex justify-between text-[8px] font-mono text-slate-400">
            <span>996 (Low)</span>
            <span>1012 (Standard)</span>
            <span>1028 (High)</span>
          </div>
        </div>
      )}
    </div>
  );
};
