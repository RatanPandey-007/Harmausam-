import React from 'react';
import { 
  StationLocation, 
  WeatherVariable, 
  BlendedForecastResult, 
  WeatherRegime 
} from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';
import { MapPin, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface DiagnosticSummaryProps {
  station: StationLocation;
  setStation: (st: StationLocation) => void;
  selectedVariable: WeatherVariable;
  setSelectedVariable: (v: WeatherVariable) => void;
  leadTimeHours: number;
  setLeadTimeHours: (h: number) => void;
  currentResult: BlendedForecastResult;
}

export const DiagnosticSummary: React.FC<DiagnosticSummaryProps> = ({
  station,
  setStation,
  selectedVariable,
  setSelectedVariable,
  leadTimeHours,
  setLeadTimeHours,
  currentResult,
}) => {
  const variables: { id: WeatherVariable; label: string; unit: string }[] = [
    { id: 'temperature_2m', label: 'Temperature', unit: '°C' },
    { id: 'precipitation', label: 'Precipitation', unit: 'mm' },
    { id: 'wind_speed_10m', label: 'Wind Speed', unit: 'm/s' },
    { id: 'relative_humidity_2m', label: 'Humidity', unit: '%' },
    { id: 'surface_pressure', label: 'Pressure', unit: 'hPa' },
  ];

  const leadOptions = [6, 12, 24, 48, 72, 96, 120, 168];

  // Derive Agreement rating strictly from underlying model spread
  const agreementRating = currentResult.modelSpread < 1.2
    ? 'High'
    : currentResult.modelSpread <= 2.4
    ? 'Moderate'
    : 'Low';

  // Derive Uncertainty level strictly from epistemic spread and stdDev
  const uncertaintyRating = currentResult.modelSpread < 1.2
    ? 'Low'
    : currentResult.modelSpread <= 2.4
    ? 'Moderate'
    : 'High';

  const shortCity = station.name.split(' (')[0];
  const activeVarLabel = variables.find(v => v.id === selectedVariable)?.label || 'Temperature';

  return (
    <div className="space-y-4">
      {/* 1. Operational Filter Bar */}
      <div className="p-3 rounded-xl border border-white/10 bg-[#0E1015] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[10px] uppercase tracking-wider font-semibold">DIAGNOSTIC FILTERS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Station Selector */}
          <div className="relative">
            <select
              value={station.id}
              onChange={(e) => {
                const s = GLOBAL_STATIONS.find(st => st.id === e.target.value);
                if (s) setStation(s);
              }}
              className="appearance-none bg-[#14161F] hover:bg-[#1A1D28] border border-white/15 text-white text-xs rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-sky-400/50 cursor-pointer font-sans transition-colors"
            >
              {GLOBAL_STATIONS.map((st) => (
                <option key={st.id} value={st.id} className="bg-[#0E1015] text-white">
                  {st.name} ({st.country})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Variable Selector */}
          <div className="relative">
            <select
              value={selectedVariable}
              onChange={(e) => setSelectedVariable(e.target.value as WeatherVariable)}
              className="appearance-none bg-[#14161F] hover:bg-[#1A1D28] border border-white/15 text-white text-xs rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-sky-400/50 cursor-pointer font-sans transition-colors"
            >
              {variables.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0E1015] text-white">
                  {v.label} ({v.unit})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Lead Horizon Selector */}
          <div className="relative">
            <select
              value={leadTimeHours}
              onChange={(e) => setLeadTimeHours(Number(e.target.value))}
              className="appearance-none bg-[#14161F] hover:bg-[#1A1D28] border border-white/15 text-white text-xs rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-sky-400/50 cursor-pointer font-sans transition-colors"
            >
              {leadOptions.map((h) => (
                <option key={h} value={h} className="bg-[#0E1015] text-white">
                  +{h}h Lead
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Compact Diagnostic Summary Metric Grid (Section 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        
        {/* Selected Location */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-[#0D0F15] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            SELECTED LOCATION
          </div>
          <div className="text-white font-bold font-sans text-sm truncate" title={station.name}>
            {shortCity}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {station.country} · {station.latitude.toFixed(1)}°N
          </div>
        </div>

        {/* Forecast Variable */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-[#0D0F15] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            VARIABLE
          </div>
          <div className="text-white font-bold font-sans text-sm truncate">
            {activeVarLabel}
          </div>
          <div className="text-[10px] text-slate-500">
            Surface (2m / 10m)
          </div>
        </div>

        {/* Forecast Lead */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-[#0D0F15] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            FORECAST LEAD
          </div>
          <div className="text-white font-bold font-sans text-sm">
            +{leadTimeHours} Hours
          </div>
          <div className="text-[10px] text-slate-500">
            Horizon offset
          </div>
        </div>

        {/* Weather Regime */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-[#0D0F15] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            WEATHER REGIME
          </div>
          <div className="text-sky-300 font-bold font-sans text-sm truncate" title={currentResult.context.detectedRegime}>
            {currentResult.context.detectedRegime}
          </div>
          <div className="text-[10px] text-slate-500">
            Detected atmospheric state
          </div>
        </div>

        {/* Model Agreement */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-[#0D0F15] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            MODEL AGREEMENT
          </div>
          <div className={`font-bold font-sans text-sm ${
            agreementRating === 'High' 
              ? 'text-emerald-400' 
              : agreementRating === 'Moderate' 
              ? 'text-amber-300' 
              : 'text-rose-400'
          }`}>
            {agreementRating}
          </div>
          <div className="text-[10px] text-slate-500">
            Spread σ = {currentResult.modelSpread.toFixed(2)}
          </div>
        </div>

        {/* Forecast Uncertainty */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-[#0D0F15] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            UNCERTAINTY
          </div>
          <div className={`font-bold font-sans text-sm ${
            uncertaintyRating === 'Low' 
              ? 'text-emerald-400' 
              : uncertaintyRating === 'Moderate' 
              ? 'text-amber-300' 
              : 'text-rose-400'
          }`}>
            {uncertaintyRating}
          </div>
          <div className="text-[10px] text-slate-500">
            Bounded range
          </div>
        </div>

      </div>
    </div>
  );
};
