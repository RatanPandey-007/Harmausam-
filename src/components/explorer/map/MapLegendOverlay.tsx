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
    <div className="absolute bottom-3 left-3 z-20 p-2.5 rounded bg-[#08090C]/90 border border-white/15 backdrop-blur-md text-slate-300 font-mono shadow-2xl pointer-events-none max-w-xs">
      {displayMode === 'DISAGREEMENT' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
            <span>MODEL DISAGREEMENT (σ)</span>
            <span className="text-white">+{leadTimeHours}h</span>
          </div>
          <div className="w-48 h-1.5 rounded-sm bg-gradient-to-r from-[#0F172A] via-[#0E7490] via-[#38BDF8] via-[#FB923C] to-[#F43F5E]" />
          <div className="flex justify-between text-[8px] text-slate-400">
            <span>0.2 (Consensus)</span>
            <span>1.5</span>
            <span>3.0+ (Divergence)</span>
          </div>
        </div>
      ) : selectedVariable === 'temperature_2m' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
            <span>TEMPERATURE FIELD (°C)</span>
            <span className="text-white">+{leadTimeHours}h</span>
          </div>
          <div className="w-48 h-1.5 rounded-sm bg-gradient-to-r from-[#0F172A] via-[#0E7490] via-[#06B6D4] via-[#38BDF8] via-[#BAE6FD] to-[#FB923C]" />
          <div className="flex justify-between text-[8px] text-slate-400">
            <span>-15°C</span>
            <span>0°C</span>
            <span>15°C</span>
            <span>28°C</span>
            <span>42°C</span>
          </div>
        </div>
      ) : selectedVariable === 'precipitation' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
            <span>PRECIPITATION INTENSITY (mm)</span>
            <span className="text-white">+{leadTimeHours}h</span>
          </div>
          <div className="w-48 h-1.5 rounded-sm bg-gradient-to-r from-transparent via-[#38BDF8] via-[#0EA5E9] via-[#0284C7] to-[#0369A1]" />
          <div className="flex justify-between text-[8px] text-slate-400">
            <span>0 mm</span>
            <span>2.5 mm</span>
            <span>10 mm</span>
            <span>25 mm</span>
            <span>50+ mm</span>
          </div>
        </div>
      ) : selectedVariable === 'wind_speed_10m' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
            <span>WIND STREAMLINES (m/s)</span>
            <span className="text-white">Vector Field</span>
          </div>
          <div className="w-48 h-1.5 rounded-sm bg-gradient-to-r from-slate-400 via-[#06B6D4] via-[#38BDF8] to-white" />
          <div className="flex justify-between text-[8px] text-slate-400">
            <span>0 (Calm)</span>
            <span>5 (Breeze)</span>
            <span>12 (Gale)</span>
            <span>20+ m/s</span>
          </div>
        </div>
      ) : selectedVariable === 'relative_humidity_2m' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
            <span>RELATIVE HUMIDITY (%)</span>
            <span className="text-white">Vapor Plume</span>
          </div>
          <div className="w-48 h-1.5 rounded-sm bg-gradient-to-r from-[#0F172A] via-[#0E7490] via-[#06B6D4] to-[#38BDF8]" />
          <div className="flex justify-between text-[8px] text-slate-400">
            <span>20% (Dry)</span>
            <span>50%</span>
            <span>75%</span>
            <span>100% (Saturated)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
            <span>SURFACE PRESSURE (hPa)</span>
            <span className="text-white">4 hPa Isobars</span>
          </div>
          <div className="w-48 h-1.5 rounded-sm bg-gradient-to-r from-slate-600 via-[#38BDF8] to-white" />
          <div className="flex justify-between text-[8px] text-slate-400">
            <span>996 (Low)</span>
            <span>1012 (Standard)</span>
            <span>1028 (High)</span>
          </div>
        </div>
      )}
    </div>
  );
};
