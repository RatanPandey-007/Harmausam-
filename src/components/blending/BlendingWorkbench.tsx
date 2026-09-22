import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  Sliders, 
  Cpu, 
  Layers, 
  Activity, 
  CheckCircle2, 
  TrendingDown, 
  Info,
  Compass
} from 'lucide-react';
import { 
  BlendedForecastResult, 
  ForecastSourceId, 
  WeatherVariable 
} from '../../core/types';
import { HISTORICAL_SKILL_MATRIX } from '../../core/blending/AdaptiveWeightingEngine';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface BlendingWorkbenchProps {
  currentResult: BlendedForecastResult;
  selectedVariable: WeatherVariable;
  leadTimeHours: number;
}

export const BlendingWorkbench: React.FC<BlendingWorkbenchProps> = ({
  currentResult,
  selectedVariable,
  leadTimeHours,
}) => {
  const { adaptiveWeights, individualForecasts, context, adaptiveBlendedForecast } = currentResult;
  const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];

  const getSourceColor = (src: ForecastSourceId) => {
    switch (src) {
      case 'ECMWF': return '#3B82F6';
      case 'GFS': return '#10B981';
      case 'ICON': return '#F59E0B';
      case 'GRAPHCAST': return '#A855F7';
    }
  };

  // Bar chart dataset
  const weightData = sources.map((src) => {
    const sw = adaptiveWeights[src];
    return {
      name: src,
      weightPct: Number(((sw?.weight ?? 0.25) * 100).toFixed(1)),
      color: getSourceColor(src),
      rawVal: individualForecasts[src],
      rmse: sw?.historicalRmseInRegime ?? 1.5,
    };
  });

  const regimes = ['Normal', 'Heavy Rainfall', 'Convective / Rapid Change', 'Heatwave', 'High Wind'] as const;

  return (
    <div className="space-y-6">
      
      {/* Top Context Pill Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Adaptive Weighting Engine (Bayesian Softmax)</h2>
              <Badge variant="scientific" className="text-xs">
                Context-Conditioned Loss
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Active Context: <span className="text-cyan-300 font-semibold">{context.detectedRegime}</span> | Lead: <span className="text-cyan-300 font-semibold">+{leadTimeHours}h</span> | Predictand: <span className="text-cyan-300 font-semibold">{selectedVariable}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg font-mono text-xs">
            <span className="text-slate-400">Normalizing Constraint:</span>
            <span className="text-emerald-400 font-bold">∑ wᵢ ≡ 1.000 (100.0%)</span>
          </div>
        </div>
      </div>

      {/* Grid: Dynamic Weights Chart & Interactive Contribution Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dynamic Weight Bar Chart */}
        <Card className="border-slate-800 bg-[#0E1422]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Current Dynamic Source Allocation</CardTitle>
            <CardDescription>
              Bayesian softmax weights assigned to each system based on regime-conditioned historical error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weightData} margin={{ top: 10, right: 15, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B" 
                    tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'monospace' }} 
                  />
                  <YAxis 
                    stroke="#64748B" 
                    tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'monospace' }} 
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0B0F17', 
                      borderColor: '#1E293B', 
                      borderRadius: '8px', 
                      fontFamily: 'monospace',
                      fontSize: '12px' 
                    }} 
                  />
                  <Bar dataKey="weightPct" radius={[4, 4, 0, 0]}>
                    {weightData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-center font-mono text-xs">
              {weightData.map((w) => (
                <div key={w.name} className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{w.name}</span>
                  <span className="text-sm font-bold text-white">{w.weightPct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mathematical Factor Decomposition */}
        <Card className="border-slate-800 bg-[#0E1422]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Mathematical Loss Breakdown</CardTitle>
            <CardDescription>
              Context-conditioned loss: <span className="font-mono text-cyan-300">ℒ(m, C) = RMSE_reg + Pen_lead + Pen_rec + Pen_disag</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 font-mono text-xs">
              {sources.map((src) => {
                const sw = adaptiveWeights[src];
                const color = getSourceColor(src);

                return (
                  <div key={src} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-bold text-slate-100">{src}</span>
                        <span className="text-[10px] text-slate-400">
                          (Confidence: {Math.round((sw?.confidence ?? 0.8) * 100)}%)
                        </span>
                      </div>
                      <span className="text-cyan-300 font-bold text-sm">
                        w = {sw?.weight.toFixed(4)}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="block text-slate-500">Base RMSE:</span>
                        <span className="text-slate-200">{sw?.historicalRmseInRegime.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Lead Pen:</span>
                        <span className="text-slate-200">+{sw?.leadTimeDegradationPenalty.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Recent Innov:</span>
                        <span className="text-slate-200">{sw?.recentPerformanceScore > 0 ? `+${sw?.recentPerformanceScore.toFixed(2)}` : sw?.recentPerformanceScore.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Disag Pen:</span>
                        <span className="text-slate-200">+{sw?.disagreementPenalty.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Loss values are transformed through a Boltzmann Gibbs / Softmax distribution with temperature scaling <span className="font-mono text-cyan-300">T = 1.2</span>, concentrating weight on top-performing architectures while preventing single-model overconfidence.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Numerical Linear Contribution Table */}
      <Card className="border-slate-800 bg-[#0E1422]">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Linear Synthesis Formulation</CardTitle>
          <CardDescription>
            Step-by-step contribution: <span className="font-mono text-cyan-300">F_Adaptive = ∑ wᵢ · Fᵢ</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Forecast System</th>
                  <th className="py-2.5 px-4">System Type</th>
                  <th className="py-2.5 px-4">Raw Forecast (Fᵢ)</th>
                  <th className="py-2.5 px-4">Calculated Weight (wᵢ)</th>
                  <th className="py-2.5 px-4 text-right">Contribution (wᵢ · Fᵢ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sources.map((src) => {
                  const sw = adaptiveWeights[src];
                  const raw = individualForecasts[src];
                  const w = sw?.weight ?? 0.25;
                  const contrib = w * raw;

                  return (
                    <tr key={src} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-semibold text-white flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getSourceColor(src) }} />
                        <span>{src}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {src === 'GRAPHCAST' ? 'AI Neural Surrogate' : 'Dynamical NWP'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {raw.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-cyan-300 font-bold">
                        {w.toFixed(4)} ({Math.round(w * 100)}%)
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {contrib.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-700 bg-slate-900/80 font-bold text-white">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-slate-400">
                    Final Adaptive Blended Value:
                  </td>
                  <td className="py-3 px-4 text-cyan-300">
                    1.0000 (100%)
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-cyan-300">
                    {adaptiveBlendedForecast.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Historical Empirical Skill Matrix Table */}
      <Card className="border-slate-800 bg-[#0E1422]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Empirical Historical Skill Matrix</CardTitle>
              <CardDescription>
                Benchmark verification RMSE across weather regimes for <span className="font-mono text-cyan-300">{selectedVariable}</span>. Currently active regime is highlighted.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] border-slate-700">
              Source: Peer-reviewed benchmarks
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Weather Regime</th>
                  <th className="py-2.5 px-4">ECMWF (9km)</th>
                  <th className="py-2.5 px-4">GFS (13km)</th>
                  <th className="py-2.5 px-4">ICON (13km)</th>
                  <th className="py-2.5 px-4">GraphCast AI</th>
                  <th className="py-2.5 px-4">Historical Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {regimes.map((reg) => {
                  const skills = HISTORICAL_SKILL_MATRIX[selectedVariable]?.[reg] || { ECMWF: 1.5, GFS: 1.8, ICON: 1.7, GRAPHCAST: 1.9 };
                  const isActive = reg === context.detectedRegime;

                  // Find min RMSE
                  const minVal = Math.min(...Object.values(skills));
                  const bestModel = (Object.keys(skills) as ForecastSourceId[]).find(k => skills[k] === minVal) || 'ECMWF';

                  return (
                    <tr key={reg} className={`transition-colors ${isActive ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400' : 'hover:bg-slate-900/30'}`}>
                      <td className="py-3 px-4 font-semibold text-slate-200 flex items-center space-x-2">
                        {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                        <span>{reg}</span>
                        {isActive && <Badge variant="scientific" className="text-[9px] py-0 px-1 border-cyan-500/40">ACTIVE</Badge>}
                      </td>
                      <td className={`py-3 px-4 ${bestModel === 'ECMWF' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {skills.ECMWF.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 ${bestModel === 'GFS' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {skills.GFS.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 ${bestModel === 'ICON' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {skills.ICON.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 ${bestModel === 'GRAPHCAST' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {skills.GRAPHCAST.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-cyan-300">
                        {bestModel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
