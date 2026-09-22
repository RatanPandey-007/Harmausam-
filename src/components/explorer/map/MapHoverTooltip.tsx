import React from 'react';

export interface HoverTooltipData {
  x: number;
  y: number;
  lat: number;
  lng: number;
  valueFormatted: string;
  unit: string;
  variableLabel: string;
  sourceLabel: string;
  leadTimeHours: number;
}

interface MapHoverTooltipProps {
  data: HoverTooltipData | null;
}

export const MapHoverTooltip: React.FC<MapHoverTooltipProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div
      className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-[120%] bg-[#08090C]/95 border border-white/20 backdrop-blur-md p-2.5 rounded shadow-2xl text-[10px] font-mono text-slate-300 min-w-[140px]"
      style={{
        left: `${data.x}px`,
        top: `${data.y}px`,
      }}
    >
      <div className="text-[9px] text-slate-400 uppercase tracking-wider pb-1 border-b border-white/10">
        {data.lat.toFixed(2)}°N, {data.lng.toFixed(2)}°E
      </div>

      <div className="mt-1.5 flex justify-between items-baseline">
        <span className="text-slate-400 capitalize">{data.variableLabel}:</span>
        <span className="text-white font-bold text-xs font-sans">
          {data.valueFormatted} {data.unit}
        </span>
      </div>

      <div className="flex justify-between items-center text-slate-400 mt-1">
        <span>Source:</span>
        <span className="text-slate-200">{data.sourceLabel}</span>
      </div>

      <div className="flex justify-between items-center text-slate-400 mt-0.5">
        <span>Lead:</span>
        <span className="text-slate-200">+{data.leadTimeHours}h</span>
      </div>
    </div>
  );
};
