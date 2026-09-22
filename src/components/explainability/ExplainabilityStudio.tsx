import React, { useState } from 'react';
import { 
  HelpCircle, 
  Cpu, 
  Sliders, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  Compass, 
  Info,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  ExplanationBreakdown, 
  WeatherRegime, 
  ForecastSourceId, 
  WeatherContext,
  SourceWeight,
  WeatherVariable
} from '../../core/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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

  // Re-run explainability engine if counterfactual regime is picked
  const activeExplanation = counterfactualRegime 
    ? ExplainabilityEngine.explainWeights(context, weights, individualForecasts, counterfactualRegime)
    : explanation;

  const getSourceColor = (src: ForecastSourceId) => {
    switch (src) {
      case 'ECMWF': return '#3B82F6';
      case 'GFS': return '#10B981';
      case 'ICON': return '#F59E0B';
      case 'GRAPHCAST': return '#A855F7';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Diagnostic Banner: Why These Weights? */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Transparent Weight Attribution & Explainability</h2>
              <Badge variant="scientific" className="text-xs">
                Zero Black-Box
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Diagnostic audit trail decomposing how weather regime, lead time, and disagreement generated the final forecast blend.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono text-xs border-slate-700 text-slate-300">
              Context: {context.detectedRegime} (+{leadTimeHours}h)
            </Badge>
          </div>
        </div>
      </div>

      {/* Structured Natural Language Diagnostic Breakdown */}
      <Card className="border-slate-800 bg-[#0E1422]">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Mathematical Reasoning & Attribution Trace</span>
          </CardTitle>
          <CardDescription>
            Generated dynamically from actual context-conditioned loss equations and error differentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 font-mono text-xs">
            {activeExplanation.naturalLanguageSummary.map((item, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start space-x-3 text-slate-300 leading-relaxed"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Attribution Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((src) => {
          const sw = weights[src];
          const raw = individualForecasts[src];
          const finalPct = Math.round(sw.weight * 100);
          const color = getSourceColor(src);

          return (
            <Card key={src} className="border-slate-800 bg-[#0E1422]">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <CardTitle className="text-sm font-bold text-white">{src}</CardTitle>
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-300">{finalPct}% Weight</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Raw Forecast: <span className="text-slate-200 font-semibold">{raw.toFixed(1)}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 text-xs font-mono space-y-2.5">
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500 block">Base Historical Skill in Regime:</span>
                  <span className="text-slate-200 font-semibold">RMSE = {sw.historicalRmseInRegime.toFixed(2)}</span>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <span className="text-slate-500 text-[10px] block">Attribution Signals:</span>
                  {sw.supportingFactors.map((f, i) => (
                    <div key={i} className="text-[11px] text-slate-300 flex items-start space-x-1.5">
                      <span className="text-cyan-400">•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Counterfactual Regime Simulator */}
      <Card className="border-slate-800 bg-[#0E1422]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Counterfactual Regime Simulator</span>
              </CardTitle>
              <CardDescription>
                Simulate how weights and blended forecasts would shift if the atmospheric context changed to a different weather regime
              </CardDescription>
            </div>

            {counterfactualRegime && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCounterfactualRegime(null)}
                className="text-xs font-mono border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reset to Observed Context</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Regime Picker Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-2">Hypothetical Regime:</span>
            {regimes.map((r) => {
              const isSelected = counterfactualRegime === r;
              const isActual = context.detectedRegime === r;

              return (
                <button
                  key={r}
                  onClick={() => setCounterfactualRegime(r === counterfactualRegime ? null : r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    isSelected 
                      ? 'bg-cyan-600 text-white font-bold border-cyan-400 shadow' 
                      : isActual 
                      ? 'bg-slate-800 border-cyan-500/50 text-cyan-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{r}</span>
                  {isActual && <span className="ml-1 text-[9px] text-cyan-400">(Actual)</span>}
                </button>
              );
            })}
          </div>

          {/* Counterfactual Shift Output Display */}
          {activeExplanation.counterfactualComparison ? (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Counterfactual Shift: {activeExplanation.counterfactualComparison.originalRegime} ➔ {activeExplanation.counterfactualComparison.counterfactualRegime}</span>
                </span>
                <span className="text-slate-400">
                  Forecast Shift: <span className="font-bold text-white">{activeExplanation.counterfactualComparison.forecastShift.before.toFixed(2)}</span> ➔ <span className="font-bold text-cyan-300">{activeExplanation.counterfactualComparison.forecastShift.after.toFixed(2)}</span> ({activeExplanation.counterfactualComparison.forecastShift.delta > 0 ? `+${activeExplanation.counterfactualComparison.forecastShift.delta.toFixed(2)}` : activeExplanation.counterfactualComparison.forecastShift.delta.toFixed(2)})
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                {sources.map((src) => {
                  const shift = activeExplanation.counterfactualComparison!.weightShifts[src];
                  const isUp = shift.delta > 0;
                  return (
                    <div key={src} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-bold text-slate-200">{src}</div>
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{Math.round(shift.before * 100)}% ➔ {Math.round(shift.after * 100)}%</span>
                        <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? `+${Math.round(shift.delta * 100)}%` : `${Math.round(shift.delta * 100)}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-mono">
              Click any hypothetical regime above to trigger dynamic counterfactual Bayesian re-weighting.
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
