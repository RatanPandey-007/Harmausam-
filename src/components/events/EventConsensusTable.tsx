import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ForecastSourceId, ExtremeEventAlert, BlendedForecastResult } from '../../core/types';
import { EventThresholdDefinition } from '../../core/events/ExtremeEventEngine';
import { ActiveTab } from '../layout/Navbar';

interface EventConsensusTableProps {
  primaryStep: BlendedForecastResult;
  peakLeadTimeHours: number;
  activeDef: EventThresholdDefinition;
  activeThreshold: number;
  selectedEventType: ExtremeEventAlert['eventType'];
  onNavigate?: (tab: ActiveTab) => void;
}

export const EventConsensusTable: React.FC<EventConsensusTableProps> = ({
  primaryStep,
  peakLeadTimeHours,
  activeDef,
  activeThreshold,
  selectedEventType,
  onNavigate,
}) => {
  const isCold = selectedEventType === 'Extreme Cold';

  const models: { id: ForecastSourceId; name: string; val: number; w: number }[] = [
    { 
      id: 'ECMWF', 
      name: 'ECMWF IFS 9km', 
      val: primaryStep.individualForecasts.ECMWF, 
      w: primaryStep.adaptiveWeights.ECMWF?.weight ?? 0.35 
    },
    { 
      id: 'GFS', 
      name: 'NCEP GFS 13km', 
      val: primaryStep.individualForecasts.GFS, 
      w: primaryStep.adaptiveWeights.GFS?.weight ?? 0.25 
    },
    { 
      id: 'ICON', 
      name: 'DWD ICON 13km', 
      val: primaryStep.individualForecasts.ICON, 
      w: primaryStep.adaptiveWeights.ICON?.weight ?? 0.25 
    },
    { 
      id: 'GRAPHCAST', 
      name: 'GraphCast AI 0.25°', 
      val: primaryStep.individualForecasts.GRAPHCAST, 
      w: primaryStep.adaptiveWeights.GRAPHCAST?.weight ?? 0.15 
    },
  ];

  const exceedingCount = models.filter(m => isCold ? m.val <= activeThreshold : m.val >= activeThreshold).length;

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#0D0F15] space-y-5">
      {/* Header with Spread Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-b pb-4">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
            MULTI-SOURCE EVENT CONSENSUS (+{peakLeadTimeHours}H)
          </div>
          <h3 className="text-lg font-bold text-white font-sans">
            Forecast System Exceedance & Weight Contribution
          </h3>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded border border-white/10">
          <span>MODEL SPREAD:</span>
          <strong className="text-white">±{primaryStep.modelSpread.toFixed(2)} {activeDef.unit}</strong>
        </div>
      </div>

      {/* Consensus Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="hairline-b text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="py-2 pr-3">Forecast System</th>
              <th className="py-2 px-3 text-right">Projected Value</th>
              <th className="py-2 px-3 text-right">Delta vs Threshold</th>
              <th className="py-2 px-3 text-center">Status</th>
              <th className="py-2 pl-3 text-right">Applied Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {models.map((m) => {
              const exceeds = isCold ? m.val <= activeThreshold : m.val >= activeThreshold;
              const delta = m.val - activeThreshold;

              return (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 pr-3 text-white font-semibold">
                    {m.name}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-200 font-bold">
                    {m.val.toFixed(1)} {activeDef.unit}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${
                    delta >= 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)} {activeDef.unit}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      exceeds 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                        : 'bg-white/5 text-slate-400 border border-white/5'
                    }`}>
                      {exceeds ? 'EXCEEDED' : 'SUB-THRESHOLD'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right text-slate-300">
                    {(m.w * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}

            {/* Baseline Row: Equal-Weight Ensemble (1/N) */}
            <tr className="bg-white/5 font-semibold hairline-t">
              <td className="py-2.5 pr-3 text-slate-300">
                Equal-Weight Ensemble (1/N)
              </td>
              <td className="py-2.5 px-3 text-right text-slate-200">
                {primaryStep.equalWeightForecast.toFixed(1)} {activeDef.unit}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-300">
                {(primaryStep.equalWeightForecast - activeThreshold) >= 0 ? '+' : ''}
                {(primaryStep.equalWeightForecast - activeThreshold).toFixed(1)} {activeDef.unit}
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-medium">
                  {(isCold ? primaryStep.equalWeightForecast <= activeThreshold : primaryStep.equalWeightForecast >= activeThreshold) ? 'EXCEEDED' : 'SUB-THRESHOLD'}
                </span>
              </td>
              <td className="py-2.5 pl-3 text-right text-slate-400">
                25.0% each
              </td>
            </tr>

            {/* Highlighted Row: Adaptive Context Blend */}
            <tr className="bg-[#141A28] font-bold border-l-2 border-sky-400">
              <td className="py-2.5 pr-3 text-white flex items-center space-x-1.5 pl-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Adaptive Context Blend</span>
              </td>
              <td className="py-2.5 px-3 text-right text-white text-sm">
                {primaryStep.adaptiveBlendedForecast.toFixed(1)} {activeDef.unit}
              </td>
              <td className="py-2.5 px-3 text-right text-sky-400">
                {(primaryStep.adaptiveBlendedForecast - activeThreshold) >= 0 ? '+' : ''}
                {(primaryStep.adaptiveBlendedForecast - activeThreshold).toFixed(1)} {activeDef.unit}
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  (isCold ? primaryStep.adaptiveBlendedForecast <= activeThreshold : primaryStep.adaptiveBlendedForecast >= activeThreshold)
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50'
                    : 'bg-white/10 text-slate-300'
                }`}>
                  {(isCold ? primaryStep.adaptiveBlendedForecast <= activeThreshold : primaryStep.adaptiveBlendedForecast >= activeThreshold) ? 'EXCEEDED' : 'SUB-THRESHOLD'}
                </span>
              </td>
              <td className="py-2.5 pl-3 text-right text-white">
                100.0% (Adaptive)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Consensus Evidence Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-slate-400">
        <div>
          <span className="text-slate-300 font-semibold">CONSENSUS EVIDENCE:</span>{' '}
          <strong className="text-white">{exceedingCount} of 4</strong> operational forecasting systems exceed the configured threshold at +{peakLeadTimeHours}h lead time.
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('blending')}
            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center space-x-1 whitespace-nowrap self-end sm:self-center transition-colors"
          >
            <span>INSPECT BLENDING WEIGHTS</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
