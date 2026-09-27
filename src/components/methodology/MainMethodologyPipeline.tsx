import React, { useState } from 'react';
import { 
  ChevronRight, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  BarChart3, 
  Compass, 
  Cpu, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export interface PipelineStageInfo {
  id: string;
  num: string;
  title: string;
  shortDesc: string;
  status: 'LIVE' | 'DEMO' | 'PLANNED';
  keyConcept: string;
}

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 'stage-01',
    num: '01',
    title: 'FORECAST SOURCES',
    shortDesc: 'ECMWF, GFS, ICON, GraphCast AI',
    status: 'DEMO',
    keyConcept: 'Ingests multiple diverse NWP and machine-learning systems rather than relying on a single deterministic run.',
  },
  {
    id: 'stage-02',
    num: '02',
    title: 'DATA ALIGNMENT',
    shortDesc: 'Common grid, timestamp & lead',
    status: 'LIVE',
    keyConcept: 'Harmonizes heterogeneous spatial resolutions (0.1° to 0.25°), synoptic cycle hours, and valid lead times onto compatible coordinates.',
  },
  {
    id: 'stage-03',
    num: '03',
    title: 'QUALITY CONTROL',
    shortDesc: 'Bounds, missing values & fallback',
    status: 'LIVE',
    keyConcept: 'Guards against bad inputs by verifying coordinate co-location, missing values, physical thresholds, and pipeline latency.',
  },
  {
    id: 'stage-04',
    num: '04',
    title: 'HISTORICAL SKILL',
    shortDesc: 'Obs verification: MAE, RMSE, Bias',
    status: 'DEMO',
    keyConcept: 'Quantifies past error metrics against ground-truth WMO observations to build empirical trust baselines.',
  },
  {
    id: 'stage-05',
    num: '05',
    title: 'CONTEXT ENGINE',
    shortDesc: 'Region, season, lead, regime',
    status: 'LIVE',
    keyConcept: 'Classifies active atmospheric thermodynamic state (convective, monsoonal, stable, heatwave) and forecast horizon.',
  },
  {
    id: 'stage-06',
    num: '06',
    title: 'ADAPTIVE WEIGHTING',
    shortDesc: 'Convex blend optimization (∑w=1)',
    status: 'LIVE',
    keyConcept: 'Calculates dynamic Boltzmann weights that reward models with superior skill in the specific active weather regime.',
  },
  {
    id: 'stage-07',
    num: '07',
    title: 'BLENDED FORECAST',
    shortDesc: 'Consensus synthesis prediction',
    status: 'LIVE',
    keyConcept: 'Synthesizes available forecasts using verified weights into a robust, context-adapted operational forecast.',
  },
  {
    id: 'stage-08',
    num: '08',
    title: 'UNCERTAINTY & SPREAD',
    shortDesc: 'Inter-model spread σ & bounds',
    status: 'LIVE',
    keyConcept: 'Quantifies agreement level and epistemic spread (σ) so high divergence is communicated rather than concealed.',
  },
  {
    id: 'stage-09',
    num: '09',
    title: 'VERIFICATION',
    shortDesc: 'Chronological test benchmarks',
    status: 'LIVE',
    keyConcept: 'Evaluates the blend against individual models, 1/N equal-weight, and fixed weights across strict time splits with no data leakage.',
  },
  {
    id: 'stage-10',
    num: '10',
    title: 'EXTREME EVENTS',
    shortDesc: 'Heavy rain, heatwave, high wind',
    status: 'LIVE',
    keyConcept: 'Separately evaluates categorical hazard thresholds with Precision, Recall, and Critical Success Index (CSI).',
  },
];

interface MainMethodologyPipelineProps {
  activeStageId: string;
  onSelectStage: (id: string) => void;
}

export const MainMethodologyPipeline: React.FC<MainMethodologyPipelineProps> = ({
  activeStageId,
  onSelectStage,
}) => {
  const currentStage = PIPELINE_STAGES.find(s => s.id === activeStageId) || PIPELINE_STAGES[0];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0C10] space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            CENTRAL ARCHITECTURE PIPELINE
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
            10-STAGE SCIENTIFIC SYNTHESIS PIPELINE
          </h3>
        </div>
        <div className="text-[11px] text-slate-400">
          Click any stage to inspect its operational mechanics
        </div>
      </div>

      {/* Responsive Pipeline View (Desktop: 10 horizontal nodes / Mobile: 2-column or vertical flow) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 font-mono">
        {PIPELINE_STAGES.map((st, idx) => {
          const isSelected = st.id === activeStageId;
          const statusBg = st.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                           st.status === 'DEMO' ? 'bg-amber-500/20 text-amber-300' :
                           'bg-sky-500/20 text-sky-300';

          return (
            <button
              key={st.id}
              onClick={() => onSelectStage(st.id)}
              className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 cursor-pointer group ${
                isSelected
                  ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-400/50'
                  : 'border-white/10 bg-[#12141C] hover:border-white/20 hover:bg-[#161822]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] font-bold ${isSelected ? 'text-sky-300' : 'text-slate-500 group-hover:text-slate-400'}`}>
                  {st.num}
                </span>
                <span className={`text-[8.5px] px-1 py-0.2 rounded font-bold uppercase ${statusBg}`}>
                  {st.status}
                </span>
              </div>

              <div>
                <div className={`text-[11px] font-bold font-sans uppercase leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {st.title}
                </div>
                <div className="text-[9.5px] text-slate-400 font-sans mt-1 leading-tight line-clamp-2">
                  {st.shortDesc}
                </div>
              </div>

              {idx < PIPELINE_STAGES.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  {/* Subtle chevron between nodes */}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Stage Callout Box (Section 4) */}
      <div className="p-4 rounded-xl bg-[#12141C] border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-400 text-black font-bold">
              STAGE {currentStage.num}
            </span>
            <span className="text-white font-bold font-sans text-sm">
              {currentStage.title}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{currentStage.shortDesc}</span>
          </div>
          <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
            {currentStage.keyConcept}
          </p>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById(currentStage.id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-3.5 py-1.5 rounded bg-white text-black font-sans font-semibold text-xs hover:bg-slate-200 transition-colors shrink-0"
        >
          View Stage Details ↓
        </button>
      </div>

    </div>
  );
};
