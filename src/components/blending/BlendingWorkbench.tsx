import React from 'react';
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Sliders, 
  Compass, 
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { 
  BlendedForecastResult, 
  ForecastSourceId, 
  WeatherVariable 
} from '../../core/types';
import { HISTORICAL_SKILL_MATRIX } from '../../core/blending/AdaptiveWeightingEngine';

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

  // Identify highest weighted model
  const sortedSources = [...sources].sort((a, b) => 
    (adaptiveWeights[b]?.weight ?? 0) - (adaptiveWeights[a]?.weight ?? 0)
  );
  const primarySource = sortedSources[0];

  const regimes = ['Normal', 'Heavy Rainfall', 'Convective / Rapid Change', 'Heatwave', 'High Wind'] as const;

  return (
    <div className="space-y-12 py-4">
      
      {/* 1. Decision Interface Headline */}
      <div className="space-y-2 hairline-b pb-8">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          DECISION ARCHITECTURE
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
          How the forecast was built
        </h2>
        <p className="text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
          The system dynamically evaluates multi-model performance under active meteorological conditions 
          rather than relying on static historical assumptions.
        </p>
      </div>

      {/* 2. Visual Decision Flow Pipeline (Clean horizontal sequence) */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-6">
        <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          DECISION PIPELINE FLOW
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 block">STEP 1</span>
            <span className="font-bold text-white block">SOURCES</span>
            <span className="text-[11px] text-slate-400 block">4 Models</span>
          </div>

          <div className="p-3 rounded bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 block">STEP 2</span>
            <span className="font-bold text-white block">CONTEXT</span>
            <span className="text-[11px] text-slate-400 block">{context.detectedRegime}</span>
          </div>

          <div className="p-3 rounded bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 block">STEP 3</span>
            <span className="font-bold text-white block">SKILL</span>
            <span className="text-[11px] text-slate-400 block">Regime RMSE</span>
          </div>

          <div className="p-3 rounded bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 block">STEP 4</span>
            <span className="font-bold text-white block">DISAGREEMENT</span>
            <span className="text-[11px] text-slate-400 block">σ = {context.modelDisagreementSpread}</span>
          </div>

          <div className="p-3 rounded bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 block">STEP 5</span>
            <span className="font-bold text-white block">WEIGHTS</span>
            <span className="text-[11px] text-slate-400 block">Softmax (T=1.2)</span>
          </div>

          <div className="p-3 rounded bg-white text-black space-y-1">
            <span className="text-[10px] text-slate-600 block">RESULT</span>
            <span className="font-bold text-black block">FORECAST</span>
            <span className="text-[11px] text-slate-800 font-bold block">{adaptiveBlendedForecast.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* 3. Prominent Weight Allocation Grid (SpaceX / Tesla large typography) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-sans">
            Assigned Model Weights
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Target Lead: <strong className="text-white">+{leadTimeHours}h</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sources.map((src) => {
            const sw = adaptiveWeights[src];
            const weightPct = Math.round((sw?.weight ?? 0.25) * 100);
            const isTop = src === primarySource;

            return (
              <div 
                key={src} 
                className={`p-6 rounded border transition-colors ${
                  isTop 
                    ? 'border-white/30 bg-[#12151D]' 
                    : 'border-white/10 bg-[#0D0F15]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                  <span className="font-semibold text-white">{src}</span>
                  <span>{src === 'GRAPHCAST' ? 'AI' : 'NWP'}</span>
                </div>

                <div className="mt-4 flex items-baseline space-x-1">
                  <span className="text-5xl sm:text-6xl font-extralight tracking-tight text-white font-sans">
                    {weightPct}
                  </span>
                  <span className="text-lg text-slate-400 font-sans">%</span>
                </div>

                <div className="mt-4 pt-3 hairline-t text-xs font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Raw Output:</span>
                    <span className="text-slate-200">{individualForecasts[src].toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regime RMSE:</span>
                    <span className="text-slate-200">{sw?.historicalRmseInRegime.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explainability Callout (NASA mission report clarity) */}
        <div className="p-4 rounded border border-white/10 bg-[#0D0F15] text-xs font-sans text-slate-300 leading-relaxed">
          <strong className="text-white">{primarySource}</strong> received the highest contribution ({Math.round((adaptiveWeights[primarySource]?.weight ?? 0.4) * 100)}%) 
          because its historical verification error for this geographic zone and lead time is lower under the current <strong className="text-white">{context.detectedRegime}</strong> regime.
        </div>
      </div>

      {/* 4. Exact Mathematical Synthesis Table */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white font-sans">
            Linear Synthesis Formulation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculation: F_blend = ∑ (w_i × F_i)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="hairline-b text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">System</th>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3">Raw Value (F_i)</th>
                <th className="py-2.5 px-3">Weight (w_i)</th>
                <th className="py-2.5 px-3 text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {sources.map((src) => {
                const w = adaptiveWeights[src]?.weight ?? 0.25;
                const raw = individualForecasts[src];
                const contrib = w * raw;

                return (
                  <tr key={src} className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-semibold text-white">{src}</td>
                    <td className="py-2.5 px-3 text-slate-400">{src === 'GRAPHCAST' ? 'AI Neural Surrogate' : 'Dynamical NWP'}</td>
                    <td className="py-2.5 px-3 text-slate-200">{raw.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{w.toFixed(4)} ({Math.round(w * 100)}%)</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{contrib.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="hairline-t font-bold text-white">
              <tr>
                <td colSpan={3} className="py-3 px-3 uppercase text-slate-400">Adaptive Blended Forecast:</td>
                <td className="py-3 px-3 text-white">1.0000 (100%)</td>
                <td className="py-3 px-3 text-right text-base text-white">{adaptiveBlendedForecast.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Empirical Skill Matrix */}
      <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white font-sans">
            Empirical Regime Skill Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical Root Mean Square Error (RMSE) across distinct weather regimes
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="hairline-b text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Weather Regime</th>
                <th className="py-2.5 px-3">ECMWF (9km)</th>
                <th className="py-2.5 px-3">GFS (13km)</th>
                <th className="py-2.5 px-3">ICON (13km)</th>
                <th className="py-2.5 px-3">GraphCast AI</th>
                <th className="py-2.5 px-3">Historical Optimum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {regimes.map((r) => {
                const skills = HISTORICAL_SKILL_MATRIX[selectedVariable]?.[r] || { ECMWF: 1.5, GFS: 1.8, ICON: 1.7, GRAPHCAST: 1.9 };
                const isActive = r === context.detectedRegime;
                const minVal = Math.min(...Object.values(skills));
                const best = (Object.keys(skills) as ForecastSourceId[]).find(k => skills[k] === minVal) || 'ECMWF';

                return (
                  <tr key={r} className={isActive ? 'bg-white/10' : 'hover:bg-white/5'}>
                    <td className="py-2.5 px-3 font-semibold text-white flex items-center space-x-2">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      <span>{r}</span>
                      {isActive && <span className="text-[10px] text-slate-400 ml-1 uppercase">(Current)</span>}
                    </td>
                    <td className={`py-2.5 px-3 ${best === 'ECMWF' ? 'text-white font-bold' : 'text-slate-400'}`}>{skills.ECMWF.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 ${best === 'GFS' ? 'text-white font-bold' : 'text-slate-400'}`}>{skills.GFS.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 ${best === 'ICON' ? 'text-white font-bold' : 'text-slate-400'}`}>{skills.ICON.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 ${best === 'GRAPHCAST' ? 'text-white font-bold' : 'text-slate-400'}`}>{skills.GRAPHCAST.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{best}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
