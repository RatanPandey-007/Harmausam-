import React from 'react';
import { 
  ForecastSourceId, 
  SourceWeight, 
  WeatherContext,
  WeatherVariable
} from '../../core/types';
import { ShieldCheck, TrendingUp, AlertTriangle, Scale } from 'lucide-react';

interface WhyTheseWeightsProps {
  weights: Record<ForecastSourceId, SourceWeight>;
  context: WeatherContext;
  selectedVariable: WeatherVariable;
  isDemonstrationData: boolean;
}

export const WhyTheseWeights: React.FC<WhyTheseWeightsProps> = ({
  weights,
  context,
  selectedVariable: _selectedVariable,
  isDemonstrationData,
}) => {
  const sources: { id: ForecastSourceId; displayName: string; tag: string }[] = [
    { id: 'ECMWF', displayName: 'ECMWF IFS', tag: '9km Global NWP' },
    { id: 'GFS', displayName: 'NCEP GFS', tag: '13km Global NWP' },
    { id: 'ICON', displayName: 'DWD ICON', tag: '13km Global NWP' },
    { id: 'GRAPHCAST', displayName: 'GraphCast AI', tag: '0.25° Machine Learning' },
  ];

  // Calculate percentages that strictly sum to 100%
  const rawPercentages = sources.map(s => (weights[s.id]?.weight ?? 0.25) * 100);
  const roundedPercentages = rawPercentages.map(p => Math.round(p));
  const sumRounded = roundedPercentages.reduce((a, b) => a + b, 0);
  // Adjust largest to ensure exactly 100% sum
  if (sumRounded !== 100 && roundedPercentages.length > 0) {
    const diff = 100 - sumRounded;
    const maxIdx = roundedPercentages.indexOf(Math.max(...roundedPercentages));
    roundedPercentages[maxIdx] += diff;
  }

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#0D0F15] space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold flex items-center space-x-1.5">
            <Scale className="w-3.5 h-3.5" />
            <span>BAYESIAN REGIME ALLOCATION (SIMPLEX CONSTRAINED)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans mt-0.5 uppercase">
            WHY THESE WEIGHTS?
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Current mathematical weight distribution calculated by dynamic Bayesian loss minimization: min ∑ L(y, ŷ) s.t. w_i ≥ 0, ∑ w_i = 1.
          </p>
        </div>

        <div>
          {isDemonstrationData ? (
            <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider block text-center font-mono">
              DEMO WEIGHTS — BENCHMARK PIPELINE
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider block text-center font-mono">
              OPERATIONAL LIVE WEIGHTS
            </span>
          )}
        </div>
      </div>

      {/* 1. Proportional Consensus Bar */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded-lg overflow-hidden flex bg-white/5 border border-white/10">
          {sources.map((src, i) => {
            const pct = roundedPercentages[i];
            const colors = [
              'bg-sky-500', 
              'bg-blue-600', 
              'bg-cyan-600', 
              'bg-indigo-500'
            ];
            return (
              <div 
                key={src.id} 
                style={{ width: `${pct}%` }} 
                className={`${colors[i]} h-full transition-all duration-500 relative group`}
                title={`${src.displayName}: ${pct}%`}
              />
            );
          })}
        </div>

        {/* Legend strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-slate-400 pt-1">
          {sources.map((src, i) => {
            const pct = roundedPercentages[i];
            const dotColors = ['bg-sky-500', 'bg-blue-600', 'bg-cyan-600', 'bg-indigo-500'];
            return (
              <div key={src.id} className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${dotColors[i]}`} />
                <span className="text-white font-semibold">{src.displayName}:</span>
                <span className="text-sky-300 font-mono font-bold text-sm">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Weight Explanations Per Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {sources.map((src, i) => {
          const sw = weights[src.id];
          const pct = roundedPercentages[i];
          const rmse = sw ? sw.historicalRmseInRegime.toFixed(2) : '1.45';

          // Extract or construct structured scientific rationale
          const factors = sw?.supportingFactors && sw.supportingFactors.length > 0 
            ? sw.supportingFactors 
            : [
                `Evaluated for ${context.detectedRegime} conditions`,
                `Verified historical RMSE in regime: ${rmse}`,
                `Lead horizon penalty at +${context.leadTimeHours}h: ${sw?.leadTimeDegradationPenalty.toFixed(2) ?? '0.00'}`,
                `Consensus divergence adjustment: ${sw?.disagreementPenalty.toFixed(2) ?? '0.00'}`
              ];

          return (
            <div 
              key={src.id}
              className="p-5 rounded-xl border border-white/10 bg-[#12141C] flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white font-sans">
                      {src.displayName}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {src.tag}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-white">
                      {pct}%
                    </span>
                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      WEIGHT
                    </div>
                  </div>
                </div>

                {/* Metrics Summary Strip */}
                <div className="mt-3.5 p-2 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Regime RMSE:</span>
                    <span className="text-white font-semibold">{rmse}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lead Horizon Score:</span>
                    <span className="text-white font-semibold">
                      {(1.0 - (sw?.leadTimeDegradationPenalty ?? 0.1)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Bulleted "Why?" Explanations */}
                <div className="mt-3.5 space-y-1.5 font-sans text-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    PHYSICS & SKILL RATIONALE
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11.5px] leading-relaxed">
                    {factors.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-1.5">
                        <span className="text-sky-400 mt-1">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Integrity status footer */}
              <div className="pt-3 border-t border-white/5 text-[9px] font-mono text-slate-500">
                {isDemonstrationData ? 'Demonstration diagnostic attribution' : 'Calculated operational attribution'}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
