import React, { useState } from 'react';
import { 
  RotateCcw, 
  Compass, 
  Info,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { 
  ExplanationBreakdown, 
  WeatherRegime, 
  ForecastSourceId, 
  WeatherContext,
  SourceWeight,
  WeatherVariable
} from '../../core/types';
import { ExplainabilityEngine } from '../../core/explainability/ExplainabilityEngine';

interface ExplainabilityStudioProps {
  explanation: ExplanationBreakdown;
  context: WeatherContext;
  weights: Record<ForecastSourceId, SourceWeight>;
  individualForecasts: Record<ForecastSourceId, number>;
  selectedVariable: WeatherVariable;
  leadTimeHours: number;
}

export const ExplainabilityStudio: React.FC<ExplainabilityStudioProps> = ({
  explanation,
  context,
  weights,
  individualForecasts,
  selectedVariable,
  leadTimeHours,
}) => {
  const [counterfactualRegime, setCounterfactualRegime] = useState<WeatherRegime | null>(null);

  const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
  const regimes: WeatherRegime[] = [
    'Normal', 
    'Heavy Rainfall', 
    'Convective / Rapid Change', 
    'Heatwave', 
    'High Wind'
  ];

  const activeExplanation = counterfactualRegime 
    ? ExplainabilityEngine.explainWeights(context, weights, individualForecasts, counterfactualRegime)
    : explanation;

  return (
    <div className="space-y-12 py-4">
      
      {/* 1. Diagnostic Headline */}
      <div className="space-y-2 hairline-b pb-8">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          DECISION DIAGNOSTICS
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
          Why did Harmausam trust this forecast?
        </h2>
        <p className="text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
          Transparent decomposition of Bayesian loss factors: regional regime skill, lead time degradation, and inter-model consensus divergence.
        </p>
      </div>

      {/* 2. Context & Parameter Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
        <div className="p-3 rounded border border-white/10 bg-[#0D0F15] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">STATION ZONE</span>
          <div className="text-white font-bold">{context.stationId}</div>
        </div>

        <div className="p-3 rounded border border-white/10 bg-[#0D0F15] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">FORECAST LEAD</span>
          <div className="text-white font-bold">+{leadTimeHours} Hours</div>
        </div>

        <div className="p-3 rounded border border-white/10 bg-[#0D0F15] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">WEATHER REGIME</span>
          <div className="text-white font-bold">{context.detectedRegime}</div>
        </div>

        <div className="p-3 rounded border border-white/10 bg-[#0D0F15] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">DISAGREEMENT</span>
          <div className="text-white font-bold">σ = {context.modelDisagreementSpread}</div>
        </div>

        <div className="p-3 rounded border border-white/10 bg-[#0D0F15] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">PRIMARY MODEL</span>
          <div className="text-white font-bold">
            {sources.reduce((a, b) => (weights[a].weight > weights[b].weight ? a : b))}
          </div>
        </div>
      </div>

      {/* 3. Structured Reasoning Trace */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white font-sans">
            Diagnostic Attribution Trace
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Derived directly from mathematical error calculations and consensus divergence
          </p>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {activeExplanation.naturalLanguageSummary.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded bg-white/5 flex items-start space-x-3 text-slate-300 leading-relaxed">
              <span className="text-slate-400 font-bold">{idx + 1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Weight Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white font-sans">
          Final System Weight Assignments
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sources.map((src) => {
            const sw = weights[src];
            const raw = individualForecasts[src];
            const pct = Math.round(sw.weight * 100);

            return (
              <div key={src} className="p-5 rounded border border-white/10 bg-[#0D0F15] space-y-3">
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-white font-bold">{src}</span>
                  <span className="text-white font-semibold">{pct}%</span>
                </div>

                <div className="text-xs font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Raw Output:</span>
                    <span className="text-slate-200">{raw.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regime RMSE:</span>
                    <span className="text-slate-200">{sw.historicalRmseInRegime.toFixed(2)}</span>
                  </div>
                </div>

                <div className="hairline-t pt-2 text-[11px] font-mono text-slate-400 space-y-0.5">
                  {sw.supportingFactors.map((f, i) => (
                    <div key={i} className="truncate">• {f}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Counterfactual Regime Simulator */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white font-sans">
              Counterfactual Regime Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate how weights and final forecasts would reconfigure under a different atmospheric regime
            </p>
          </div>

          {counterfactualRegime && (
            <button
              onClick={() => setCounterfactualRegime(null)}
              className="inline-flex items-center space-x-1.5 text-xs font-mono text-white border border-white/20 px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Observed</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {regimes.map((r) => {
            const isSelected = counterfactualRegime === r;
            const isActual = context.detectedRegime === r;

            return (
              <button
                key={r}
                onClick={() => setCounterfactualRegime(r === counterfactualRegime ? null : r)}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                  isSelected 
                    ? 'bg-white text-black font-bold' 
                    : isActual 
                    ? 'border border-white text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>{r}</span>
                {isActual && <span className="ml-1 text-[10px] opacity-75">(Observed)</span>}
              </button>
            );
          })}
        </div>

        {activeExplanation.counterfactualComparison && (
          <div className="p-4 rounded bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-white pb-2 hairline-b">
              <span>Shift: {activeExplanation.counterfactualComparison.originalRegime} ➔ {activeExplanation.counterfactualComparison.counterfactualRegime}</span>
              <span>
                Forecast Shift: <strong>{activeExplanation.counterfactualComparison.forecastShift.before.toFixed(2)}</strong> ➔ <strong>{activeExplanation.counterfactualComparison.forecastShift.after.toFixed(2)}</strong> ({activeExplanation.counterfactualComparison.forecastShift.delta > 0 ? `+${activeExplanation.counterfactualComparison.forecastShift.delta.toFixed(2)}` : activeExplanation.counterfactualComparison.forecastShift.delta.toFixed(2)})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {sources.map((src) => {
                const shift = activeExplanation.counterfactualComparison!.weightShifts[src];
                const isGain = shift.delta > 0;
                return (
                  <div key={src} className="p-2 rounded bg-black/40">
                    <div className="text-white font-bold">{src}</div>
                    <div className="text-slate-400 mt-1">
                      {Math.round(shift.before * 100)}% ➔ <strong className="text-white">{Math.round(shift.after * 100)}%</strong>
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
