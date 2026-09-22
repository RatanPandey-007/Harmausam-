import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Info, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { 
  BlendedForecastResult, 
  WeatherVariable, 
  ForecastSourceId 
} from '../../core/types';

interface ForecastBlendedViewProps {
  currentResult: BlendedForecastResult;
  selectedVariable: WeatherVariable;
  leadTimeHours: number;
}

export const ForecastBlendedView: React.FC<ForecastBlendedViewProps> = ({
  currentResult,
  selectedVariable,
  leadTimeHours,
}) => {
  const { adaptiveBlendedForecast, uncertaintyInterval, confidenceIndicator, confidenceTier, adaptiveWeights, context, individualForecasts } = currentResult;

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
  const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];

  // Half-width of 90% confidence interval for ± notation
  const halfWidth = Number(((uncertaintyInterval.upper90 - uncertaintyInterval.lower90) / 2).toFixed(1));

  return (
    <div className="space-y-6">
      
      {/* 1. Visually Dominant Blended Forecast Card (Tesla Product-First style) */}
      <div className="p-8 rounded border border-white/10 bg-[#0D0F15] space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 hairline-b pb-6">
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              SYNTHESIZED METEOROLOGICAL PREDICTION
            </div>
            
            <div className="flex items-baseline space-x-3">
              <span className="text-6xl sm:text-7xl font-extralight tracking-tight text-white font-sans">
                {adaptiveBlendedForecast.toFixed(1)}
              </span>
              <span className="text-2xl text-slate-400 font-light font-sans">{unit}</span>

              {/* Uncertainty ± Range Indicator */}
              <div className="flex items-baseline space-x-1 font-mono text-sm text-slate-300 ml-2">
                <span>±</span>
                <span className="font-bold text-white">{halfWidth}</span>
                <span>{unit}</span>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 space-y-0.5">
              <div>90% Confidence Interval: <strong className="text-slate-200">[{uncertaintyInterval.lower90}, {uncertaintyInterval.upper90}] {unit}</strong></div>
              <div>Calibrated Confidence Score: <strong className="text-white">{confidenceIndicator}% ({confidenceTier} Confidence)</strong></div>
            </div>
          </div>

          <div className="font-mono text-xs text-slate-400 space-y-1 text-right">
            <div>Weather Regime: <strong className="text-white">{context.detectedRegime}</strong></div>
            <div>Forecast Horizon: <strong className="text-white">+{leadTimeHours}h Outlook</strong></div>
            <div>Model Spread: <strong className="text-white">σ = {currentResult.modelSpread.toFixed(2)} {unit}</strong></div>
          </div>
        </div>

        {/* 2. Source Contributions breakdown (Section 13 requirement) */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            CONTRIBUTING FORECAST SYSTEMS & DYNAMIC WEIGHTS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {sources.map((src) => {
              const sw = adaptiveWeights[src];
              const pct = Math.round((sw?.weight ?? 0.25) * 100);
              const raw = individualForecasts[src];

              return (
                <div key={src} className="p-4 rounded border border-white/5 bg-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{src}</span>
                    <span className="text-white font-bold text-sm">{pct}%</span>
                  </div>

                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Raw Output:</span>
                    <span className="text-slate-200 font-semibold">{raw.toFixed(1)} {unit}</span>
                  </div>

                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Regime RMSE:</span>
                    <span className="text-slate-200">{sw?.historicalRmseInRegime.toFixed(2)}</span>
                  </div>

                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-white h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attribution Callout */}
        <div className="p-3.5 rounded bg-white/5 text-xs font-sans text-slate-300 leading-relaxed">
          Dynamic weights are produced via Boltzmann softmax loss (<span className="font-mono text-white">T = 1.2</span>) 
          penalizing systems according to active weather regime historical error and lead-time degradation.
        </div>

      </div>

    </div>
  );
};
