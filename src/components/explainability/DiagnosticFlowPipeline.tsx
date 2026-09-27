import React from 'react';
import { ChevronRight, ArrowDown } from 'lucide-react';

export const DiagnosticFlowPipeline: React.FC = () => {
  const stages = [
    { num: '01', label: 'FORECAST SOURCES', desc: 'ECMWF, GFS, ICON, GraphCast' },
    { num: '02', label: 'DATA QUALITY', desc: 'Sanity, alignment, integrity checks' },
    { num: '03', label: 'HISTORICAL SKILL', desc: 'Regime-specific verification metrics' },
    { num: '04', label: 'CONTEXT', desc: 'Synoptic regime, lead horizon, season' },
    { num: '05', label: 'ADAPTIVE WEIGHTS', desc: 'Dynamic Bayesian optimization' },
    { num: '06', label: 'MODEL DISAGREEMENT', desc: 'Inter-model consensus & spread σ' },
    { num: '07', label: 'UNCERTAINTY', desc: 'Bounded predictive confidence range' },
    { num: '08', label: 'BLENDED FORECAST', desc: 'Context-aware consensus prediction' },
  ];

  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-[#0A0C10] space-y-3">
      <div className="flex items-center justify-between font-mono text-xs text-slate-400 pb-2 border-b border-white/5">
        <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">
          CONCEPTUAL DIAGNOSTIC PIPELINE
        </span>
        <span className="text-[10px] text-slate-500">
          END-TO-END BLENDING & ATTRIBUTION TRACE
        </span>
      </div>

      {/* Responsive Horizontal / Wrapped Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 font-mono">
        {stages.map((stage, idx) => (
          <div key={stage.num} className="relative flex flex-col justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-sky-500/30 transition-colors group">
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span className="font-bold text-sky-400/80">{stage.num}</span>
              {idx < stages.length - 1 && (
                <ChevronRight className="hidden lg:block w-3 h-3 text-slate-600 group-hover:text-sky-400 transition-colors" />
              )}
            </div>

            <div className="mt-2">
              <div className="text-[10.5px] font-bold text-white uppercase tracking-tight leading-snug font-sans">
                {stage.label}
              </div>
              <div className="text-[9px] text-slate-400 font-sans mt-0.5 leading-tight">
                {stage.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
