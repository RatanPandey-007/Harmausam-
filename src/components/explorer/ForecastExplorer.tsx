import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  Play, 
  Pause, 
  MapPin, 
  Layers, 
  Compass,
  ChevronRight
} from 'lucide-react';
import { 
  BlendedForecastResult, 
  StationLocation, 
  WeatherVariable 
} from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';

interface ForecastExplorerProps {
  currentResult: BlendedForecastResult;
  timeSeriesTrajectory: BlendedForecastResult[];
  station: StationLocation;
  setStation: (station: StationLocation) => void;
  selectedVariable: WeatherVariable;
  setSelectedVariable: (v: WeatherVariable) => void;
  leadTimeHours: number;
  setLeadTimeHours: (lead: number) => void;
  isDemonstrationData: boolean;
}

export const ForecastExplorer: React.FC<ForecastExplorerProps> = ({
  currentResult,
  timeSeriesTrajectory,
  station,
  setStation,
  selectedVariable,
  setSelectedVariable,
  leadTimeHours,
  setLeadTimeHours,
  isDemonstrationData,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');

  const variables: { id: WeatherVariable; label: string; unit: string }[] = [
    { id: 'temperature_2m', label: 'Temperature', unit: '°C' },
    { id: 'precipitation', label: 'Rainfall', unit: 'mm/3h' },
    { id: 'wind_speed_10m', label: 'Wind Speed', unit: 'm/s' },
    { id: 'relative_humidity_2m', label: 'Humidity', unit: '%' },
    { id: 'surface_pressure', label: 'Pressure', unit: 'hPa' },
  ];

  const leadTimes = [0, 6, 12, 24, 48, 72, 120, 168];
  const currentUnit = variables.find(v => v.id === selectedVariable)?.unit || '';

  // Chart dataset
  const chartData = timeSeriesTrajectory.map((step) => {
    return {
      lead: `+${step.leadTimeHours}h`,
      leadHours: step.leadTimeHours,
      time: new Date(step.timestamp).toLocaleTimeString([], { weekday: 'short', hour: '2-digit' }),
      ECMWF: step.individualForecasts.ECMWF,
      GFS: step.individualForecasts.GFS,
      ICON: step.individualForecasts.ICON,
      GraphCast: step.individualForecasts.GRAPHCAST,
      AdaptiveBlend: step.adaptiveBlendedForecast,
      EqualWeight: step.equalWeightForecast,
      Upper90: step.uncertaintyInterval.upper90,
      Lower90: step.uncertaintyInterval.lower90,
      Observation: step.observationValue,
    };
  });

  // Timeline scrubber player
  React.useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        const idx = leadTimes.indexOf(leadTimeHours);
        const nextIdx = (idx + 1) % leadTimes.length;
        setLeadTimeHours(leadTimes[nextIdx]);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, leadTimeHours, setLeadTimeHours]);

  return (
    <div className="space-y-8 py-2">
      
      {/* 1. Minimal Top Control Header (Tesla / SpaceX minimalism) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 hairline-b pb-4">
        
        {/* Variable Switcher */}
        <div className="flex flex-wrap items-center gap-1">
          {variables.map((v) => {
            const isSelected = selectedVariable === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVariable(v.id)}
                className={`px-3 py-1.5 rounded text-xs font-sans transition-colors ${
                  isSelected 
                    ? 'bg-white text-black font-semibold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Source Filter Selector */}
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>SOURCE:</span>
          {['ALL', 'ECMWF', 'GFS', 'ICON', 'GRAPHCAST'].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSourceFilter(src)}
              className={`px-2 py-1 rounded transition-colors ${
                selectedSourceFilter === src 
                  ? 'text-white font-bold bg-white/10' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {src === 'GRAPHCAST' ? 'AI' : src}
            </button>
          ))}
        </div>

      </div>

      {/* 2. Dominant Geospatial Weather Map Canvas (Occupies most of visual space) */}
      <div className="relative w-full h-[520px] rounded border border-white/10 bg-[#0A0C10] overflow-hidden">
        
        {/* World Coordinate Graticule Grid */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" 
          viewBox="0 0 1000 500" 
          preserveAspectRatio="none"
        >
          {[100, 200, 300, 400].map((y) => (
            <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#475569" strokeWidth="0.8" strokeDasharray="3 3" />
          ))}
          {[150, 300, 450, 600, 750, 900].map((x) => (
            <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 3" />
          ))}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#64748B" strokeWidth="1.2" />
          <line x1="500" y1="0" x2="500" y2="500" stroke="#64748B" strokeWidth="1.2" />
        </svg>

        {/* Global Reference Meteorological Stations */}
        {GLOBAL_STATIONS.map((st) => {
          const posX = ((st.longitude + 180) / 360) * 100;
          const posY = ((90 - st.latitude) / 180) * 100;
          const isActive = st.id === station.id;

          return (
            <div
              key={st.id}
              onClick={() => setStation(st)}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20`}
            >
              <div className="relative flex flex-col items-center">
                {/* Active Pulse Ring */}
                {isActive && (
                  <span className="absolute h-8 w-8 rounded-full border border-white/40 animate-ping pointer-events-none" />
                )}

                {/* Clean Marker */}
                <div className={`h-3 w-3 rounded-full transition-transform group-hover:scale-125 ${
                  isActive 
                    ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]' 
                    : 'bg-slate-600 group-hover:bg-slate-300'
                }`} />

                {/* Minimalist Station Label */}
                <div className={`mt-2 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-white text-black font-semibold shadow' 
                    : 'bg-[#08090C]/80 text-slate-300 border border-white/10 group-hover:text-white'
                }`}>
                  {st.name.split(' (')[0]}
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating Telemetry Box (NASA Mission Control style) */}
        <div className="absolute top-4 left-4 p-4 rounded bg-[#08090C]/90 border border-white/10 font-mono text-xs text-slate-300 space-y-1 backdrop-blur-md">
          <div className="text-[10px] tracking-widest text-slate-400 uppercase">ACTIVE OBSERVATION STATION</div>
          <div className="text-base font-bold text-white font-sans">{station.name}</div>
          <div className="text-slate-400 text-[11px]">
            {station.latitude.toFixed(2)}°N, {station.longitude.toFixed(2)}°E • Elev {station.elevationMeters}m MSL
          </div>
          <div className="pt-2 hairline-t text-slate-400 text-[11px] flex items-center justify-between gap-4">
            <span>Forecast Lead:</span>
            <span className="text-white font-bold">+{leadTimeHours} Hours</span>
          </div>
        </div>

      </div>

      {/* 3. Operational Timeline Scrubber (Bottom of Map) */}
      <div className="p-4 rounded border border-white/10 bg-[#0D0F15] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded hover:bg-white/10 text-white transition-colors"
              title={isPlaying ? 'Pause timeline' : 'Animate through lead times'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-white" />}
            </button>
            <span className="text-slate-400">TIMELINE:</span>
            <span className="text-white font-bold">+{leadTimeHours}h ({Math.round(leadTimeHours / 24 * 10) / 10} Days out)</span>
          </div>

          <span className="text-slate-400 text-[11px]">
            Target Valid Window: {new Date(currentResult.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-8 gap-1.5">
          {leadTimes.map((lt) => {
            const isActive = lt === leadTimeHours;
            return (
              <button
                key={lt}
                onClick={() => setLeadTimeHours(lt)}
                className={`py-2 px-1 text-center font-mono text-xs rounded transition-colors ${
                  isActive 
                    ? 'bg-white text-black font-bold' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <div>+{lt}h</div>
                <div className="text-[9px] opacity-60">
                  {lt === 0 ? 'Init' : lt < 24 ? 'Short' : lt <= 72 ? 'Medium' : 'Extended'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Integrated Multi-Model Trajectory Chart (Clean & Restrained) */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white font-sans">
              Multi-Model Ensemble Trajectory & 90% Confidence Envelope
            </h3>
            <p className="text-xs text-slate-400">
              ECMWF, GFS, ICON, and GraphCast forecast paths compared against the Adaptive Blend
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Unit: <strong className="text-white">{currentUnit}</strong>
          </span>
        </div>

        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis 
                dataKey="lead" 
                stroke="#64748B" 
                tick={{ fill: '#8E8E93', fontSize: 11, fontFamily: 'monospace' }} 
              />
              <YAxis 
                stroke="#64748B" 
                tick={{ fill: '#8E8E93', fontSize: 11, fontFamily: 'monospace' }} 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0E1015', 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  borderRadius: '4px', 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#FFFFFF'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />

              {/* 90% Confidence Uncertainty Envelope */}
              <Area 
                type="monotone" 
                dataKey="Upper90" 
                stroke="none" 
                fill="#3B82F6" 
                fillOpacity={0.12} 
                name="90% Confidence Envelope" 
              />
              <Area 
                type="monotone" 
                dataKey="Lower90" 
                stroke="none" 
                fill="#3B82F6" 
                fillOpacity={0.0} 
              />

              {/* Individual Models */}
              {(selectedSourceFilter === 'ALL' || selectedSourceFilter === 'ECMWF') && (
                <Line 
                  type="monotone" 
                  dataKey="ECMWF" 
                  stroke="#3B82F6" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="ECMWF IFS (9km)" 
                />
              )}
              {(selectedSourceFilter === 'ALL' || selectedSourceFilter === 'GFS') && (
                <Line 
                  type="monotone" 
                  dataKey="GFS" 
                  stroke="#10B981" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="NCEP GFS (13km)" 
                />
              )}
              {(selectedSourceFilter === 'ALL' || selectedSourceFilter === 'ICON') && (
                <Line 
                  type="monotone" 
                  dataKey="ICON" 
                  stroke="#F59E0B" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="DWD ICON (13km)" 
                />
              )}
              {(selectedSourceFilter === 'ALL' || selectedSourceFilter === 'GRAPHCAST') && (
                <Line 
                  type="monotone" 
                  dataKey="GraphCast" 
                  stroke="#8B5CF6" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                  name="GraphCast AI (0.25°)" 
                />
              )}

              {/* Observation (when verified ground truth exists) */}
              <Line 
                type="monotone" 
                dataKey="Observation" 
                stroke="#38BDF8" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#38BDF8' }} 
                name="Verified Observation" 
              />

              {/* Adaptive Blend (White Dominant Line) */}
              <Line 
                type="monotone" 
                dataKey="AdaptiveBlend" 
                stroke="#FFFFFF" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#FFFFFF' }} 
                name="Adaptive Blended Forecast" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
