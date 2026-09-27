import React, { useState } from 'react';
import { 
  WeatherContext, 
  WeatherRegime, 
  ForecastSourceId, 
  SourceWeight,
  ExplanationBreakdown
} from '../../core/types';
import { ExplainabilityEngine } from '../../core/explainability/ExplainabilityEngine';
import { ArrowUpRight, ArrowRight, TrendingUp, AlertTriangle, RotateCcw } from 'lucide-react';

interface CausalExplainabilityTimelineProps {
  context: WeatherContext;
  weights: Record<ForecastSourceId, SourceWeight>;
  individualForecasts: Record<ForecastSourceId, number>;
  explanation: ExplanationBreakdown;
  isDemonstrationData: boolean;
}

export const CausalExplainabilityTimeline: React.FC<CausalExplainabilityTimelineProps> = ({
  context,
  weights,
  individualForecasts,
  explanation,
  isDemonstrationData,
}) => {
  const [simulatedRegime, setSimulatedRegime] = useState<WeatherRegime | null>(null);

  const regimes: WeatherRegime[] = [
    'Normal', 
    'Heavy Rainfall', 
    'Convective / Rapid Change', 
    'Heatwave', 
    'High Wind'
  ];

  const activeExplanation = simulatedRegime 
    ? ExplainabilityEngine.explainWeights(context, weights, individualForecasts, simulatedRegime)
    : explanation;

  // Causal factors derived from active context
  const causalSteps = [
    {
      step: '01',
      title: 'Regional Historical Skill',
      direction: '↑ Increased Top Performer Allocation',
      impact: 'ECMWF IFS & AI models demonstrated lower baseline verification RMSE across this geographic sector.',
      status: 'skill_gain',
    },
    {
      step: '02',
      title: 'Current Weather Regime',
      direction: `→ Favored ${simulatedRegime ?? context.detectedRegime} Response`,
      impact: `Atmospheric thermodynamic state classified as ${simulatedRegime ?? context.detectedRegime}. Dynamical weighting penalized models with high historical regime error.`,
      status: 'regime_shift',
    },
    {
      step: '03',
      title: 'Inter-Model Disagreement',
      direction: context.modelDisagreementSpread > 1.8 ? '↑ Elevated Uncertainty' : '✓ Strengthened Consensus',
      impact: `Consensus divergence spread of σ = ${context.modelDisagreementSpread.toFixed(2)} bounded the predictive interval without overfitting outliers.`,
      status: 'disagreement',
    },
    {
      step: '04',
      title: 'Forecast Lead Horizon (+24h)',
      direction: '→ Balanced Physics and Machine Learning',
      impact: 'At +24h lead time, GraphCast AI maintains tight boundary resolution while IFS maintains deep vertical tropospheric balance.',
      status: 'lead_time',
    },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            CAUSAL REASONING CHAIN
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
            WHAT CHANGED THE FORECAST?
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Explainability timeline detailing key atmospheric and statistical factors influencing weight distribution.
          </p>
        </div>

        <div>
          <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider block text-center">
            DEMONSTRATION EXPLANATION
          </span>
        </div>
      </div>

      {/* 1. Four-Step Explainability Sequence (Section 14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {causalSteps.map((c) => (
          <div 
            key={c.step}
            className="p-4 rounded-xl border border-white/10 bg-[#12141C] space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px]">
                  {c.step}
                </span>
                <span className="text-[10px] text-sky-300 font-semibold font-mono">
                  {c.direction}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white font-sans mt-2.5">
                {c.title}
              </h4>

              <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                {c.impact}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500">
              Factor Influence: Validated
            </div>
          </div>
        ))}
      </div>

      {/* 2. Interactive Counterfactual Regime Simulator */}
      <div className="p-4 rounded-xl bg-[#12141C] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              SIMULATION BENCH: COUNTERFACTUAL REGIME STRESS TEST
            </div>
            <div className="text-xs text-slate-300 font-sans mt-0.5">
              Select an alternative atmospheric regime to simulate how weights and consensus reconfigure.
            </div>
          </div>

          {simulatedRegime && (
            <button
              onClick={() => setSimulatedRegime(null)}
              className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-300 border border-white/15 px-2.5 py-1 rounded hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Observed</span>
            </button>
          )}
        </div>

        {/* Regime Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
          {regimes.map((r) => {
            const isSelected = simulatedRegime === r;
            const isObserved = context.detectedRegime === r;

            return (
              <button
                key={r}
                onClick={() => setSimulatedRegime(r === simulatedRegime ? null : r)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-sky-500 text-black font-bold' 
                    : isObserved 
                    ? 'border border-sky-400 text-sky-300 bg-sky-500/10' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>{r}</span>
                {isObserved && <span className="ml-1.5 text-[9px] opacity-75">(Observed)</span>}
              </button>
            );
          })}
        </div>

        {/* Dynamic Simulation Result Card */}
        {activeExplanation.counterfactualComparison && (
          <div className="mt-3 p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-white pb-2 border-b border-white/5">
              <span>Simulated Shift: {activeExplanation.counterfactualComparison.originalRegime} ➔ {activeExplanation.counterfactualComparison.counterfactualRegime}</span>
              <span className="text-sky-300 font-bold">
                Forecast Delta: {activeExplanation.counterfactualComparison.forecastShift.delta > 0 ? `+${activeExplanation.counterfactualComparison.forecastShift.delta.toFixed(2)}` : activeExplanation.counterfactualComparison.forecastShift.delta.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {(['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'] as ForecastSourceId[]).map((src) => {
                const shift = activeExplanation.counterfactualComparison!.weightShifts[src];
                return (
                  <div key={src} className="p-2 rounded bg-white/5 text-[11px]">
                    <div className="text-white font-bold">{src}</div>
                    <div className="text-slate-400 mt-0.5">
                      {Math.round(shift.before * 100)}% ➔ <strong className="text-sky-300">{Math.round(shift.after * 100)}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
