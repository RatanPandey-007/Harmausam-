import React from 'react';
import { EventThresholdDefinition } from '../../core/events/ExtremeEventEngine';

interface TimelineStep {
  leadTimeHours: number;
  timestamp: string;
  value: number;
  exceeds: boolean;
  stage: 'Developing' | 'Peak' | 'Ending' | 'Sub-threshold';
  observation?: number;
}

interface EventTimelineRailProps {
  timeline: TimelineStep[];
  peakLeadTimeHours: number;
  activeThreshold: number;
  activeDef: EventThresholdDefinition;
}

export const EventTimelineRail: React.FC<EventTimelineRailProps> = ({
  timeline,
  peakLeadTimeHours,
  activeThreshold,
  activeDef,
}) => {
  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#0D0F15] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 hairline-b pb-4">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
            TEMPORAL PROGRESSION TRAJECTORY
          </div>
          <h3 className="text-lg font-bold text-white font-sans">
            Forecast Horizon & Threat Evolution (+0h to +168h)
          </h3>
        </div>

        <div className="text-xs font-mono text-slate-400">
          CRITICAL THRESHOLD: <strong className="text-white font-mono">{activeThreshold.toFixed(1)} {activeDef.unit}</strong>
        </div>
      </div>

      {/* Step-by-Step Horizontal Rail */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
        {timeline.map((step) => {
          const isPeak = step.leadTimeHours === peakLeadTimeHours;
          const delta = step.value - activeThreshold;

          let stageBadgeBg = 'bg-white/5 text-slate-400';
          if (step.stage === 'Peak') {
            stageBadgeBg = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
          } else if (step.stage === 'Developing') {
            stageBadgeBg = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
          } else if (step.stage === 'Ending') {
            stageBadgeBg = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
          }

          return (
            <div
              key={step.leadTimeHours}
              className={`p-3 rounded-lg border font-mono text-xs space-y-2 transition-all ${
                isPeak 
                  ? 'border-sky-400/80 bg-[#121927] ring-1 ring-sky-400/30' 
                  : step.exceeds
                  ? 'border-white/20 bg-white/5'
                  : 'border-white/5 bg-black/30'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-bold ${isPeak ? 'text-sky-300' : 'text-slate-400'}`}>
                  +{step.leadTimeHours}h
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${stageBadgeBg}`}>
                  {step.stage}
                </span>
              </div>

              <div className="text-center py-1">
                <div className="text-base font-bold text-white font-mono">
                  {step.value.toFixed(1)}{activeDef.unit}
                </div>
                <div className={`text-[10px] font-semibold mt-0.5 ${
                  delta >= 0 ? 'text-rose-400' : 'text-slate-500'
                }`}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)} Δ
                </div>
              </div>

              {/* Ground Truth Observation Marker if Available */}
              {step.observation !== undefined ? (
                <div className="hairline-t pt-1.5 text-[10px] text-slate-400 flex justify-between">
                  <span>OBS:</span>
                  <strong className="text-emerald-400">{step.observation.toFixed(1)}{activeDef.unit}</strong>
                </div>
              ) : (
                <div className="hairline-t pt-1.5 text-[9px] text-slate-600 text-center uppercase tracking-wider">
                  Pending Valid
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
