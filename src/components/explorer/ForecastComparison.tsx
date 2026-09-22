import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  GitCompare, 
  Activity, 
  TrendingUp, 
  Info 
} from 'lucide-react';
import { 
  BlendedForecastResult, 
  ForecastSourceId, 
  WeatherVariable 
} from '../../core/types';

interface ForecastComparisonProps {
  currentResult: BlendedForecastResult;
  timeSeriesTrajectory: BlendedForecastResult[];
  selectedVariable: WeatherVariable;
  leadTimeHours: number;
}

export const ForecastComparison: React.FC<ForecastComparisonProps> = ({
  currentResult,
  timeSeriesTrajectory,
  selectedVariable,
  leadTimeHours,
}) => {
  const { individualForecasts, adaptiveBlendedForecast, equalWeightForecast, modelSpread, context } = currentResult;

  const getUnit = (v: WeatherVariable) => {
    switch (v) {
      case 'temperature_2m': return '°C';
      case 'precipitation': return 'mm';
      case 'wind_speed_10m': return 'm/s';
      case 'relative_humidity_2m': return '%';
      case 'surface_pressure': return 'hPa';
    }
  };

  const unit = getUnit(selectedVariable);

  // Model values
  const models = [
    { id: 'ECMWF', name: 'ECMWF IFS (9km)', val: individualForecasts.ECMWF, color: '#3B82F6' },
    { id: 'GFS', name: 'NCEP GFS (13km)', val: individualForecasts.GFS, color: '#10B981' },
    { id: 'ICON', name: 'DWD ICON (13km)', val: individualForecasts.ICON, color: '#F59E0B' },
    { id: 'GRAPHCAST', name: 'GraphCast AI (0.25°)', val: individualForecasts.GRAPHCAST, color: '#8B5CF6' },
  ];

  // Min and max for divergence normalization
  const allVals = [...models.map(m => m.val), adaptiveBlendedForecast];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = Math.max(0.5, maxVal - minVal);

  // Trajectory chart dataset
  const chartData = timeSeriesTrajectory.map((step) => ({
    lead: `+${step.leadTimeHours}h`,
    leadHours: step.leadTimeHours,
    ECMWF: step.individualForecasts.ECMWF,
    GFS: step.individualForecasts.GFS,
    ICON: step.individualForecasts.ICON,
    GraphCast: step.individualForecasts.GRAPHCAST,
    Blended: step.adaptiveBlendedForecast,
    EqualWeight: step.equalWeightForecast,
  }));

  // Disagreement label badge styling
  const getDisagreementStyle = (level: string) => {
    switch (level) {
      case 'Low':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Moderate':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'High':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'Severe':
      default:
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Model Disagreement Barometer */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-b pb-4">
          <div>
            <h3 className="text-base font-semibold text-white font-sans">
              Multi-Model Divergence & Disagreement Scale
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Point-in-time spread across available forecast systems at +{leadTimeHours}h horizon
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-400">DISAGREEMENT:</span>
            <span className={`px-2.5 py-0.5 rounded border uppercase font-bold text-xs ${getDisagreementStyle(context.disagreementLevel)}`}>
              {context.disagreementLevel} (σ = {modelSpread.toFixed(2)} {unit})
            </span>
          </div>
        </div>

        {/* Divergence Linear Alignment */}
        <div className="space-y-3.5 font-mono text-xs">
          {models.map((m) => {
            const pct = ((m.val - minVal) / range) * 100;
            const delta = m.val - adaptiveBlendedForecast;

            return (
              <div key={m.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="font-semibold text-white">{m.id}</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">({m.name})</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400 text-[11px]">
                      Δ {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} {unit}
                    </span>
                    <span className="text-white font-bold text-sm w-16 text-right">
                      {m.val.toFixed(1)} {unit}
                    </span>
                  </div>
                </div>

                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
                    style={{ 
                      backgroundColor: m.color,
                      left: `${Math.min(pct, 50)}%`, 
                      width: `${Math.max(6, Math.abs(pct - 50))}%` 
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Blended Synthesis Anchor */}
          <div className="pt-3 hairline-t flex items-center justify-between font-bold">
            <span className="text-white uppercase tracking-wider">ADAPTIVE BLENDED FORECAST:</span>
            <span className="text-base text-white">{adaptiveBlendedForecast.toFixed(1)} {unit}</span>
          </div>
        </div>
      </div>

      {/* 2. Coherent Forecast Trajectory Line Chart */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white font-sans">
            Forecast Divergence Over Lead Time (+0h to +168h / 7 Days)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trace how numerical systems diverge as chaotic atmospheric uncertainty compounds with lead time
          </p>
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

              <Line type="monotone" dataKey="ECMWF" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="ECMWF IFS (9km)" />
              <Line type="monotone" dataKey="GFS" stroke="#10B981" strokeWidth={1.5} dot={false} name="NCEP GFS (13km)" />
              <Line type="monotone" dataKey="ICON" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="DWD ICON (13km)" />
              <Line type="monotone" dataKey="GraphCast" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="GraphCast AI (0.25°)" />
              <Line type="monotone" dataKey="Blended" stroke="#FFFFFF" strokeWidth={2.5} dot={{ r: 3, fill: '#FFFFFF' }} name="Adaptive Blended Forecast" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
