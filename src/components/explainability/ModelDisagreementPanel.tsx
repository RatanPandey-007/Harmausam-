import React from 'react';
import { 
  BlendedForecastResult, 
  ForecastSourceId, 
  WeatherVariable 
} from '../../core/types';
import { GitCompare, AlertCircle, HelpCircle } from 'lucide-react';

interface ModelDisagreementPanelProps {
  currentResult: BlendedForecastResult;
  selectedVariable: WeatherVariable;
  isDemonstrationData: boolean;
}

export const ModelDisagreementPanel: React.FC<ModelDisagreementPanelProps> = ({
  currentResult,
  selectedVariable,
  isDemonstrationData,
}) => {
  const unit = selectedVariable === 'temperature_2m' 
    ? '°C' 
    : selectedVariable === 'precipitation' 
    ? 'mm' 
    : selectedVariable === 'wind_speed_10m' 
    ? 'm/s' 
    : selectedVariable === 'relative_humidity_2m' 
    ? '%' 
    : 'hPa';

  const forecasts = currentResult.individualForecasts;
  const blended = currentResult.adaptiveBlendedForecast;
  const spread = currentResult.modelSpread;

  // Derive agreement tier
  const agreement = spread < 1.2 ? 'High' : spread <= 2.4 ? 'Moderate' : 'Low';
  const uncertaintyLevel = spread < 1.2 ? 'Low' : spread <= 2.4 ? 'Moderate' : 'High';

  // Compute min and max across all 4 sources and blend for visual normalization
  const sourceValues: { id: ForecastSourceId; name: string; val: number; color: string }[] = [
    { id: 'ECMWF', name: 'ECMWF IFS', val: forecasts.ECMWF, color: '#38BDF8' },
    { id: 'GFS', name: 'NCEP GFS', val: forecasts.GFS, color: '#2563EB' },
    { id: 'ICON', name: 'DWD ICON', val: forecasts.ICON, color: '#0891B2' },
    { id: 'GRAPHCAST', name: 'GraphCast AI', val: forecasts.GRAPHCAST, color: '#6366F1' },
  ];

  const allVals = [...sourceValues.map(s => s.val), blended];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const valRange = Math.max(0.1, maxVal - minVal);
  const paddingRange = valRange * 0.15;
  const axisMin = minVal - paddingRange;
  const axisMax = maxVal + paddingRange;
  const totalAxisSpan = Math.max(0.2, axisMax - axisMin);

  // Position on 0-100% axis
  const getPercent = (v: number) => {
    return Math.min(96, Math.max(4, ((v - axisMin) / totalAxisSpan) * 100));
  };

  const expectedLower = currentResult.uncertaintyInterval?.lower90 ?? (blended - spread * 0.8);
  const expectedUpper = currentResult.uncertaintyInterval?.upper90 ?? (blended + spread * 0.8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Model Disagreement Panel (Section 8) */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
          <div>
            <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
              MULTI-MODEL CONSENSUS
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
              MODEL DISAGREEMENT
            </h3>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase">AGREEMENT: </span>
            <span className={`font-bold ${
              agreement === 'High' ? 'text-emerald-400' : agreement === 'Moderate' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {agreement}
            </span>
            <div className="text-sky-300 font-mono text-xs font-bold mt-0.5">
              Spread σ = {spread.toFixed(2)}{unit}
            </div>
          </div>
        </div>

        {/* Source Values List */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          {sourceValues.map((s) => (
            <div key={s.id} className="p-2.5 rounded-lg bg-[#141722] border border-white/5 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium truncate">{s.name}</div>
              <div className="text-sm font-bold text-white font-sans">
                {s.val.toFixed(1)}{unit}
              </div>
            </div>
          ))}
        </div>

        {/* Blended Consensus Readout */}
        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-white font-bold font-sans">ADAPTIVE BLENDED CONSENSUS:</span>
          </div>
          <span className="text-base font-bold text-sky-300 font-sans">
            {blended.toFixed(1)}{unit}
          </span>
        </div>

        {/* Visual Spread Axis */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Range: {minVal.toFixed(1)}{unit}</span>
            <span>Spread Axis</span>
            <span>{maxVal.toFixed(1)}{unit}</span>
          </div>

          <div className="relative h-12 w-full rounded-xl bg-black/40 border border-white/5 flex items-center px-4">
            {/* Horizontal axis line */}
            <div className="absolute left-4 right-4 h-0.5 bg-white/20" />

            {/* Individual source markers */}
            {sourceValues.map((s) => (
              <div 
                key={s.id}
                style={{ left: `${getPercent(s.val)}%` }}
                className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              >
                <div 
                  className="w-3 h-3 rounded-full border border-black shadow"
                  style={{ backgroundColor: s.color }}
                />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 text-[9px] font-mono bg-slate-900 border border-white/10 px-1 py-0.5 rounded text-white whitespace-nowrap">
                  {s.id}: {s.val.toFixed(1)}
                </span>
              </div>
            ))}

            {/* Blended indicator marker */}
            <div 
              style={{ left: `${getPercent(blended)}%` }}
              className="absolute -translate-x-1/2 flex flex-col items-center"
            >
              <div className="w-4 h-4 rounded-full border-2 border-white bg-sky-400 shadow-md animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-sky-300 mt-5 absolute whitespace-nowrap">
                BLEND {blended.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Note on Empirical Spread */}
        <div className="text-[10px] font-mono text-slate-500 pt-1">
          * Note: Spread represents inter-model ensemble standard deviation (σ), not a calibrated Gaussian confidence interval.
        </div>
      </div>

      {/* 2. Uncertainty Panel (Section 9) */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
            <div>
              <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
                PREDICTIVE UNCERTAINTY
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
                FORECAST UNCERTAINTY
              </h3>
            </div>

            <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase ${
              uncertaintyLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              uncertaintyLevel === 'Moderate' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
              'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}>
              {uncertaintyLevel} Uncertainty
            </span>
          </div>

          {/* Expected Range Card */}
          <div className="mt-4 p-4 rounded-xl bg-[#141722] border border-white/10 space-y-2">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              UNCERTAINTY PROXY BOUNDS (EMPIRICAL ERROR SCALE)
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {expectedLower.toFixed(1)}{unit} — {expectedUpper.toFixed(1)}{unit}
            </div>
            <div className="text-xs text-slate-400 font-sans">
              Empirical proxy derived from contextual historical error scale and inter-model dispersion. Not a calibrated Gaussian prediction interval.
            </div>
          </div>

          {/* Scientific Transparency Explanation */}
          <div className="mt-4 space-y-2 font-sans text-xs text-slate-300">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              UNCERTAINTY EXPLANATION
            </div>
            <p className="leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
              {spread < 1.2 ? (
                'Forecast sources exhibit tight agreement around the blended estimate with low synoptic variance across NWP and machine learning representations.'
              ) : spread <= 2.4 ? (
                'Forecast sources show moderate spread around the blended estimate. Minor divergence exists regarding timing and boundary-layer thermal advection.'
              ) : (
                'Forecast sources exhibit elevated disagreement. Outlier solutions differ significantly, reflecting high synoptic sensitivity in the active weather regime.'
              )}
            </p>
          </div>
        </div>

        {/* Scientific Integrity Notice */}
        <div className="pt-4 border-t border-white/5 text-[10px] font-mono text-slate-500 flex items-start space-x-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
          <span>
            Harmausam explicitly separates model disagreement from predictive certainty. Categorical tiers reflect empirical inter-system divergence, avoiding uncalibrated probability claims.
          </span>
        </div>
      </div>


    </div>
  );
};
