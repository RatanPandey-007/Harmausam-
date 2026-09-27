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
      className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-[120%] bg-[#0E1015]/95 border border-slate-800/90 backdrop-blur-md p-2.5 rounded-xl shadow-2xl text-[10px] font-sans text-slate-300 min-w-[155px] transition-all"
      style={{
        left: `${data.x}px`,
        top: `${data.y}px`,
      }}
    >
      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 font-semibold">
        {data.lat.toFixed(2)}°N · {data.lng.toFixed(2)}°E
      </div>

      <div className="mt-1.5 flex justify-between items-baseline">
        <span className="text-slate-400 capitalize">{data.variableLabel}:</span>
        <span className="text-cyan-400 font-bold text-xs font-mono">
          {data.valueFormatted} {data.unit}
        </span>
      </div>

      <div className="flex justify-between items-center text-slate-400 mt-1 font-mono text-[9px]">
        <span>Model:</span>
        <span className="text-slate-200 font-medium">{data.sourceLabel}</span>
      </div>

      <div className="flex justify-between items-center text-slate-400 mt-0.5 font-mono text-[9px]">
        <span>Lead:</span>
        <span className="text-slate-200 font-medium">+{data.leadTimeHours}h</span>
      </div>
    </div>
  );
};
