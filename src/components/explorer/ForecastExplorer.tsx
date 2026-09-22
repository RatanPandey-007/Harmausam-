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
  MapPin, 
  Sliders, 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Info, 
  Eye, 
  Maximize2,
  Layers,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Gauge
} from 'lucide-react';
import { 
  BlendedForecastResult, 
  StationLocation, 
  WeatherVariable 
} from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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

  const variables: { id: WeatherVariable; label: string; icon: any; unit: string }[] = [
    { id: 'temperature_2m', label: '2m Temperature', icon: Thermometer, unit: '°C' },
    { id: 'precipitation', label: 'Precipitation', icon: CloudRain, unit: 'mm/3h' },
    { id: 'wind_speed_10m', label: '10m Wind Speed', icon: Wind, unit: 'm/s' },
    { id: 'relative_humidity_2m', label: 'Relative Humidity', icon: Droplets, unit: '%' },
    { id: 'surface_pressure', label: 'Surface Pressure', icon: Gauge, unit: 'hPa' },
  ];

  const leadTimes = [0, 6, 12, 24, 48, 72, 120, 168];

  // Prepare chart dataset
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

  const currentUnit = variables.find(v => v.id === selectedVariable)?.unit || '';

  // Interactive timeline play / step
  React.useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        const idx = leadTimes.indexOf(leadTimeHours);
        const nextIdx = (idx + 1) % leadTimes.length;
        setLeadTimeHours(leadTimes[nextIdx]);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, leadTimeHours]);

  return (
    <div className="space-y-6">
      
      {/* Variable & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1422] p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400 mr-2 uppercase tracking-wider">
            Predictand:
          </span>
          {variables.map((v) => {
            const Icon = v.icon;
            const isSelected = selectedVariable === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVariable(v.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected 
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold' 
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="scientific" className="border-cyan-500/30 text-cyan-300">
            {isDemonstrationData ? 'BENCHMARK RUN' : 'LIVE RUN'}
          </Badge>
        </div>
      </div>

      {/* Geospatial Map Section (Dominant visual interface) */}
      <Card className="border-slate-800 bg-[#0E1422] overflow-hidden">
        <CardHeader className="py-3 px-5 border-b border-slate-800/80 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-sm font-semibold">Geospatial Station Network & Climatological Baselines</CardTitle>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Click any station pin to load its multi-model forecast trajectory
          </span>
        </CardHeader>
        <CardContent className="p-0 relative">
          
          {/* Scientific Geospatial Map Canvas */}
          <div className="relative w-full h-[320px] bg-slate-950 overflow-hidden flex items-center justify-center">
            {/* Vector World Grid Graphic */}
            <svg 
              className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" 
              viewBox="0 0 1000 500" 
              preserveAspectRatio="none"
            >
              {/* Latitude and Longitude Graticule lines */}
              {[100, 200, 300, 400].map((y) => (
                <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#334155" strokeWidth="0.75" strokeDasharray="3 3" />
              ))}
              {[150, 300, 450, 600, 750, 900].map((x) => (
                <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#334155" strokeWidth="0.75" strokeDasharray="3 3" />
              ))}
              {/* Equator & Prime Meridian */}
              <line x1="0" y1="250" x2="1000" y2="250" stroke="#475569" strokeWidth="1.2" />
              <line x1="500" y1="0" x2="500" y2="500" stroke="#475569" strokeWidth="1.2" />
            </svg>

            {/* Stylized Continents Outline Backing */}
            <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center text-slate-600 font-mono text-[80px] font-black select-none tracking-widest">
              GLOBAL GRID
            </div>

            {/* Global Station Pins on Map */}
            {GLOBAL_STATIONS.map((st) => {
              // Mercator/Equirectangular projection approximation:
              // X: (lon + 180) / 360 * 100%
              // Y: (90 - lat) / 180 * 100%
              const posX = ((st.longitude + 180) / 360) * 100;
              const posY = ((90 - st.latitude) / 180) * 100;
              const isActive = st.id === station.id;

              return (
                <div
                  key={st.id}
                  onClick={() => setStation(st)}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-300 z-10`}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Active Ping */}
                    {isActive && (
                      <span className="absolute h-8 w-8 rounded-full bg-cyan-400/25 animate-ping" />
                    )}
                    
                    {/* Marker Dot */}
                    <div className={`h-4 w-4 rounded-full border-2 transition-transform group-hover:scale-125 flex items-center justify-center ${
                      isActive 
                        ? 'bg-cyan-500 border-white shadow-lg shadow-cyan-500/50' 
                        : 'bg-slate-800 border-slate-400 group-hover:border-cyan-400'
                    }`}>
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>

                    {/* Station Tag Tooltip */}
                    <div className={`absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-[11px] font-mono transition-all pointer-events-none ${
                      isActive 
                        ? 'bg-slate-900 border border-cyan-500/50 text-cyan-200 shadow-md z-20' 
                        : 'bg-slate-950/80 border border-slate-800 text-slate-300 group-hover:opacity-100 opacity-75'
                    }`}>
                      <div className="font-semibold">{st.name.split(' ')[0]}</div>
                      <div className="text-[9px] text-slate-400">{st.id} ({st.country})</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Map Legend Overlay in corner */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono text-slate-400 pointer-events-none">
              <div className="text-slate-200 font-semibold mb-1">STATION TELEMETRY</div>
              <div>Selected: <span className="text-cyan-300 font-bold">{station.name}</span></div>
              <div>Lat/Lon: {station.latitude}°N, {station.longitude}°E</div>
              <div>Elevation: {station.elevationMeters}m MSL</div>
            </div>

            <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-[11px] font-mono text-slate-400">
              Active Station: <span className="text-cyan-300 font-bold">{station.name}</span>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Multi-Model Ensemble Spread Chart & Fan Diagram */}
      <Card className="border-slate-800 bg-[#0E1422]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span>Multi-Model Trajectory & Ensemble Spread</span>
              <Badge variant="scientific" className="font-mono text-[10px]">
                {variables.find(v => v.id === selectedVariable)?.label} ({currentUnit})
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Spaghetti forecast trajectories for NWP (ECMWF, GFS, ICON) & AI (GraphCast) against Adaptive Blend and 90% confidence envelope
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-xs font-mono h-8 border-slate-700 hover:bg-slate-800"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 mr-1 text-amber-400" /> : <Play className="w-3.5 h-3.5 mr-1 text-cyan-400" />}
              <span>{isPlaying ? 'Pause' : 'Animate Lead'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis 
                  dataKey="lead" 
                  stroke="#64748B" 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} 
                  unit={` ${currentUnit}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0B0F17', 
                    borderColor: '#1E293B', 
                    borderRadius: '8px', 
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }} 
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} 
                />

                {/* Shaded 90% Confidence Uncertainty Envelope */}
                <Area 
                  type="monotone" 
                  dataKey="Upper90" 
                  stroke="none" 
                  fill="#06B6D4" 
                  fillOpacity={0.12} 
                  name="90% Confidence Envelope" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Lower90" 
                  stroke="none" 
                  fill="#06B6D4" 
                  fillOpacity={0.0} 
                />

                {/* Individual Models (Spaghetti) */}
                <Line 
                  type="monotone" 
                  dataKey="ECMWF" 
                  stroke="#3B82F6" 
                  strokeWidth={1.5} 
                  dot={{ r: 2 }} 
                  name="ECMWF IFS (9km)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="GFS" 
                  stroke="#10B981" 
                  strokeWidth={1.5} 
                  dot={{ r: 2 }} 
                  name="NCEP GFS (13km)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="ICON" 
                  stroke="#F59E0B" 
                  strokeWidth={1.5} 
                  dot={{ r: 2 }} 
                  name="DWD ICON (13km)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="GraphCast" 
                  stroke="#A855F7" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={{ r: 2 }} 
                  name="GraphCast AI (0.25°)" 
                />

                {/* Verified Ground Truth Observations (when available) */}
                <Line 
                  type="monotone" 
                  dataKey="Observation" 
                  stroke="#38BDF8" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, stroke: '#38BDF8', fill: '#0E1422' }} 
                  name="Verified Observation (Ground Truth)" 
                />

                {/* Adaptive Blended Forecast (Hero Line) */}
                <Line 
                  type="monotone" 
                  dataKey="AdaptiveBlend" 
                  stroke="#F43F5E" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: '#F43F5E', fill: '#FFF' }} 
                  name="Adaptive Context Blend" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Time Timeline Scrubber Control */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Forecast Lead Time Scrubber:</span>
              </span>
              <span className="text-cyan-300 font-bold text-sm">
                +{leadTimeHours} Hours ({Math.round(leadTimeHours / 24 * 10) / 10} Days out)
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {leadTimes.map((lt) => {
                const isActive = lt === leadTimeHours;
                return (
                  <button
                    key={lt}
                    onClick={() => setLeadTimeHours(lt)}
                    className={`py-2 px-1 rounded-md text-xs font-mono transition-all text-center border ${
                      isActive 
                        ? 'bg-cyan-600 text-white font-bold border-cyan-400 shadow-md shadow-cyan-950/40' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div>+{lt}h</div>
                    <div className="text-[9px] opacity-75">{lt === 0 ? 'Init' : lt < 24 ? 'Short' : lt <= 72 ? 'Medium' : 'Extended'}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
};
