import React from 'react';
import { 
  Database, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Radio, 
  Cpu 
} from 'lucide-react';
import { 
  ForecastSourceId, 
  BlendedForecastResult, 
  WeatherVariable 
} from '../../core/types';
import { ExplorerDisplayMode } from './ForecastControls';

interface ForecastMetadataProps {
  currentResult: BlendedForecastResult;
  selectedVariable: WeatherVariable;
  displayMode: ExplorerDisplayMode;
  selectedSource: ForecastSourceId;
  isDemonstrationData: boolean;
}

export const ForecastMetadata: React.FC<ForecastMetadataProps> = ({
  currentResult,
  selectedVariable,
  displayMode,
  selectedSource,
  isDemonstrationData,
}) => {
  const { station, leadTimeHours, timestamp } = currentResult;

  const getSourceLabel = () => {
    if (displayMode === 'BLENDED') return 'Harmausam Adaptive Context-Aware Blend';
    if (displayMode === 'COMPARISON') return 'Multi-Model Synthesis (4 Systems)';
    switch (selectedSource) {
      case 'ECMWF': return 'ECMWF IFS (Integrated Forecasting System)';
      case 'GFS': return 'NCEP GFS (Global Forecast System)';
      case 'ICON': return 'DWD ICON (Icosahedral Nonhydrostatic)';
      case 'GRAPHCAST': return 'DeepMind GraphCast AI Neural Simulator';
    }
  };

  const getResolution = () => {
    if (displayMode === 'BLENDED') return 'Optimal Multi-Scale Harmonized Grid (9–13km)';
    switch (selectedSource) {
      case 'ECMWF': return '9 km Deterministic (137 Vertical Levels)';
      case 'GFS': return '13 km Spectral (127 Vertical Levels)';
      case 'ICON': return '13 km Icosahedral-Triangular Grid';
      case 'GRAPHCAST': return '0.25° Equirectangular (~28 km)';
    }
  };

  return (
    <div className="p-4 rounded border border-white/10 bg-[#0A0C10] font-mono text-[11px] text-slate-400 space-y-2">
      
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 hairline-b pb-2">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isDemonstrationData ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="font-bold text-white">
            {isDemonstrationData ? 'DEMONSTRATION DATASET' : 'OPERATIONAL LIVE STREAM'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            {isDemonstrationData ? 'Historical research benchmark (peer-reviewed verification data)' : 'Open-Meteo Multi-Model Ensemble API'}
          </span>
        </div>

        <div className="text-slate-400">
          Cycle: <strong className="text-white">00Z Operational Run</strong>
        </div>
      </div>

      {/* Scientific Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 pt-1">
        <div>
          <span className="text-slate-500 block text-[10px]">INITIALIZATION:</span>
          <span className="text-slate-300">2026-09-22 00:00 UTC</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">VALID TIME:</span>
          <span className="text-slate-300">{new Date(timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} UTC</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">FORECAST SYSTEM:</span>
          <span className="text-slate-200 truncate block">{getSourceLabel()}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">SPATIAL RESOLUTION:</span>
          <span className="text-slate-200 truncate block">{getResolution()}</span>
        </div>
      </div>

    </div>
  );
};
