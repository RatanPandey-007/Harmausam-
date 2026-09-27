import React from 'react';

export type ForecastOverlayStatus = 'LOADING' | 'SUCCESS' | 'UNAVAILABLE' | 'INSUFFICIENT_DATA';

interface MapStatusOverlayProps {
  status: ForecastOverlayStatus;
  subMessage?: string | null;
}

export const MapStatusOverlay: React.FC<MapStatusOverlayProps> = ({
  status,
  subMessage,
}) => {
  return (
    <div className="absolute top-14 sm:top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300">
      {status === 'LOADING' && (
        <div className="flex items-center space-x-2 bg-[#0E1015]/90 border border-slate-700/80 text-slate-300 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md font-mono text-[11px] pointer-events-auto animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="tracking-wide">Loading forecast overlay...</span>
        </div>
      )}

      {status === 'SUCCESS' && (
        <div className="flex items-center space-x-2 bg-[#0E1015]/85 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full shadow-lg backdrop-blur-md font-mono text-[11px] pointer-events-auto transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="tracking-wide">Forecast overlay active</span>
        </div>
      )}

      {status === 'UNAVAILABLE' && (
        <div className="flex flex-col items-center bg-[#0E1015]/95 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md font-mono text-center pointer-events-auto max-w-[280px] sm:max-w-none">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Forecast overlay unavailable</span>
          </div>
          <span className="text-[10.5px] text-slate-400 mt-0.5 font-sans">
            {subMessage || 'Forecast data could not be loaded for this location/time.'}
          </span>
        </div>
      )}

      {status === 'INSUFFICIENT_DATA' && (
        <div className="flex flex-col items-center bg-[#0E1015]/95 border border-slate-700/80 text-slate-300 px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md font-mono text-center pointer-events-auto max-w-[280px] sm:max-w-none">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Insufficient forecast data</span>
          </div>
          <span className="text-[10.5px] text-slate-400 mt-0.5 font-sans">
            {subMessage || 'Forecast parameters incomplete for selected model or variable.'}
          </span>
        </div>
      )}
    </div>
  );
};
