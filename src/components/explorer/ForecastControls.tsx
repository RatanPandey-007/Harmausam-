import React from 'react';
import { 
  ChevronDown, 
  Thermometer, 
  CloudRain, 
  Wind, 
  Droplets, 
  Gauge, 
  Layers, 
  GitCompare, 
  Cpu, 
  MapPin, 
  Compass 
} from 'lucide-react';
import { 
  WeatherVariable, 
  StationLocation, 
  ForecastSourceId 
} from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';

export type ExplorerDisplayMode = 'SINGLE' | 'COMPARISON' | 'BLENDED' | 'DISAGREEMENT';

interface ForecastControlsProps {
  station: StationLocation;
  setStation: (station: StationLocation) => void;
  selectedVariable: WeatherVariable;
  setSelectedVariable: (v: WeatherVariable) => void;
  displayMode: ExplorerDisplayMode;
  setDisplayMode: (mode: ExplorerDisplayMode) => void;
  selectedSource: ForecastSourceId;
  setSelectedSource: (src: ForecastSourceId) => void;
  leadTimeHours: number;
}

export const ForecastControls: React.FC<ForecastControlsProps> = ({
  station,
  setStation,
  selectedVariable,
  setSelectedVariable,
  displayMode,
  setDisplayMode,
  selectedSource,
  setSelectedSource,
  leadTimeHours,
}) => {
  const variables: { id: WeatherVariable; label: string; unit: string }[] = [
    { id: 'temperature_2m', label: 'Temperature', unit: '°C' },
    { id: 'precipitation', label: 'Precipitation', unit: 'mm' },
    { id: 'wind_speed_10m', label: 'Wind Speed', unit: 'm/s' },
    { id: 'relative_humidity_2m', label: 'Humidity', unit: '%' },
    { id: 'surface_pressure', label: 'Pressure', unit: 'hPa' },
  ];

  const sources: { id: ForecastSourceId; label: string; desc: string }[] = [
    { id: 'ECMWF', label: 'ECMWF IFS', desc: '9km NWP' },
    { id: 'GFS', label: 'NCEP GFS', desc: '13km NWP' },
    { id: 'ICON', label: 'DWD ICON', desc: '13km NWP' },
    { id: 'GRAPHCAST', label: 'GraphCast', desc: '0.25° AI' },
  ];

  return (
    <div className="space-y-4 hairline-b pb-6">
      
      {/* Top Header Row: Headline & Location */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            OPERATIONAL METEOROLOGICAL CONSOLE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans mt-0.5">
            Forecast Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Explore how different forecast systems model the same atmosphere over space, lead time, and physical consensus.
          </p>
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={station.id}
              onChange={(e) => {
                const s = GLOBAL_STATIONS.find(st => st.id === e.target.value);
                if (s) setStation(s);
              }}
              className="appearance-none bg-[#0E1015] hover:bg-[#14161F] border border-white/10 text-white text-xs rounded px-3 py-2 pr-8 focus:outline-none focus:border-white/30 cursor-pointer font-mono transition-colors"
            >
              {GLOBAL_STATIONS.map((st) => (
                <option key={st.id} value={st.id} className="bg-[#0E1015] text-white">
                  {st.name} — {st.country}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="hidden sm:block text-xs font-mono text-slate-400 px-2 py-1.5 rounded border border-white/5 bg-white/5">
            {station.latitude.toFixed(2)}°N, {station.longitude.toFixed(2)}°E
          </div>
        </div>
      </div>

      {/* Control Bar: Variable Switcher & Display Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        
        {/* Predictand Variable Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            LAYER:
          </span>
          {variables.map((v) => {
            const isSelected = selectedVariable === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVariable(v.id)}
                className={`px-3 py-1.5 rounded text-xs font-sans transition-colors ${
                  isSelected 
                    ? 'bg-white text-black font-semibold shadow-sm' 
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{v.label}</span>
                <span className="text-[10px] opacity-70 ml-1 font-mono">({v.unit})</span>
              </button>
            );
          })}
        </div>

        {/* Display Mode Selector (Blended / Comparison / Single / Disagreement) */}
        <div className="flex flex-wrap items-center gap-1 border border-white/10 bg-[#0E1015] p-1 rounded">
          <button
            onClick={() => setDisplayMode('BLENDED')}
            className={`px-3 py-1 rounded text-xs font-sans transition-colors ${
              displayMode === 'BLENDED' 
                ? 'bg-white text-black font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blended Forecast
          </button>

          <button
            onClick={() => setDisplayMode('COMPARISON')}
            className={`px-3 py-1 rounded text-xs font-sans transition-colors ${
              displayMode === 'COMPARISON' 
                ? 'bg-white text-black font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Compare Sources
          </button>

          <button
            onClick={() => setDisplayMode('SINGLE')}
            className={`px-3 py-1 rounded text-xs font-sans transition-colors ${
              displayMode === 'SINGLE' 
                ? 'bg-white text-black font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Single Source
          </button>

          <button
            onClick={() => setDisplayMode('DISAGREEMENT')}
            className={`px-3 py-1 rounded text-xs font-sans transition-colors ${
              displayMode === 'DISAGREEMENT' 
                ? 'bg-rose-500 text-white font-bold' 
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Model Disagreement (σ)
          </button>
        </div>

      </div>

      {/* Sub-bar for Single / Comparison Source Focus Picker */}
      {(displayMode === 'SINGLE' || displayMode === 'COMPARISON') && (
        <div className="flex items-center space-x-2 pt-2 text-xs font-mono text-slate-400 animate-fade-in">
          <span className="text-[10px] uppercase tracking-wider">
            {displayMode === 'SINGLE' ? 'ACTIVE SYSTEM:' : 'INSPECT ON MAP:'}
          </span>
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSource(s.id)}
              className={`px-2.5 py-1 rounded border transition-colors ${
                selectedSource === s.id 
                  ? 'border-white bg-white text-black font-bold' 
                  : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{s.label}</span>
              <span className="opacity-70 text-[9px] ml-1">({s.desc})</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
};
