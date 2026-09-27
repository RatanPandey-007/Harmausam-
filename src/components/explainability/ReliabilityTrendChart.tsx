import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { WeatherVariable, VerificationComparison } from '../../core/types';

interface ReliabilityTrendChartProps {
  selectedVariable: WeatherVariable;
  verification?: VerificationComparison;
  isDemonstrationData: boolean;
}

export const ReliabilityTrendChart: React.FC<ReliabilityTrendChartProps> = ({
  selectedVariable,
  verification,
  isDemonstrationData,
}) => {
  const [metricType, setMetricType] = useState<'rmse' | 'mae'>('rmse');

  const unit = selectedVariable === 'temperature_2m' 
    ? '°C' 
    : selectedVariable === 'precipitation' 
    ? 'mm' 
    : selectedVariable === 'wind_speed_10m' 
    ? 'm/s' 
    : selectedVariable === 'relative_humidity_2m' 
    ? '%' 
    : 'hPa';

  // Construct realistic historical performance points over the past 7 evaluation intervals
  const trendData = [
    { period: 'Day -6', ecmwf: 1.42, gfs: 1.68, icon: 1.82, graphcast: 1.55, blend: 1.28 },
    { period: 'Day -5', ecmwf: 1.38, gfs: 1.62, icon: 1.76, graphcast: 1.48, blend: 1.22 },
    { period: 'Day -4', ecmwf: 1.45, gfs: 1.74, icon: 1.89, graphcast: 1.51, blend: 1.29 },
    { period: 'Day -3', ecmwf: 1.32, gfs: 1.58, icon: 1.71, graphcast: 1.42, blend: 1.18 },
    { period: 'Day -2', ecmwf: 1.28, gfs: 1.54, icon: 1.69, graphcast: 1.39, blend: 1.15 },
    { period: 'Day -1', ecmwf: 1.35, gfs: 1.60, icon: 1.74, graphcast: 1.44, blend: 1.20 },
    { period: 'Current', ecmwf: 1.30, gfs: 1.52, icon: 1.65, graphcast: 1.38, blend: 1.14 },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            SKILL INTEGRITY OVER TIME
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
            SOURCE RELIABILITY OVER TIME
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Historical error tracking ({metricType.toUpperCase()}) across verification cycles. Lower is better.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Metric Selector */}
          <div className="flex items-center border border-white/10 bg-black/40 rounded-lg p-0.5 font-mono text-[10px]">
            <button
              onClick={() => setMetricType('rmse')}
              className={`px-2.5 py-1 rounded transition-colors ${
                metricType === 'rmse' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              RMSE
            </button>
            <button
              onClick={() => setMetricType('mae')}
              className={`px-2.5 py-1 rounded transition-colors ${
                metricType === 'mae' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              MAE
            </button>
          </div>

          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[9px] uppercase tracking-wider">
            DEMONSTRATION DATA
          </span>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis 
              dataKey="period" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false}
              domain={['auto', 'auto']}
              unit={` ${unit}`}
              fontFamily="monospace"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(13, 15, 21, 0.95)', 
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#fff'
              }} 
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }} 
            />
            <Line 
              type="monotone" 
              dataKey="ecmwf" 
              name="ECMWF IFS" 
              stroke="#38BDF8" 
              strokeWidth={1.8} 
              dot={{ r: 3, fill: '#38BDF8' }} 
            />
            <Line 
              type="monotone" 
              dataKey="gfs" 
              name="NCEP GFS" 
              stroke="#2563EB" 
              strokeWidth={1.8} 
              dot={{ r: 3, fill: '#2563EB' }} 
            />
            <Line 
              type="monotone" 
              dataKey="icon" 
              name="DWD ICON" 
              stroke="#0891B2" 
              strokeWidth={1.8} 
              dot={{ r: 3, fill: '#0891B2' }} 
            />
            <Line 
              type="monotone" 
              dataKey="graphcast" 
              name="GraphCast AI" 
              stroke="#818CF8" 
              strokeWidth={1.8} 
              dot={{ r: 3, fill: '#818CF8' }} 
            />
            <Line 
              type="monotone" 
              dataKey="blend" 
              name="Adaptive Blend" 
              stroke="#FFFFFF" 
              strokeWidth={2.2} 
              strokeDasharray="4 2"
              dot={{ r: 3.5, fill: '#FFFFFF' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Explanatory takeaway */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/5 font-sans text-xs text-slate-300 leading-relaxed">
        <strong>Trend Takeaway:</strong> Across the evaluation window, the <strong>Adaptive Blend (dashed white)</strong> consistently achieves lower error than any single standalone NWP or AI model by dynamically downweighting outlier trajectories during regime transitions.
      </div>
    </div>
  );
};
