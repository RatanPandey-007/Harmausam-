import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

export const DataToDecisionTrace: React.FC = () => {
  const steps = [
    { title: 'DATA', desc: 'Raw model grids & METAR obs' },
    { title: 'EVIDENCE', desc: 'Regime verification metrics' },
    { title: 'CONTEXT', desc: 'Synoptic regime & lead horizon' },
    { title: 'WEIGHTS', desc: 'Dynamic Bayesian optimization' },
    { title: 'FORECAST', desc: 'Context-aware consensus blend' },
    { title: 'UNCERTAINTY', desc: 'Bounded spread & agreement' },
    { title: 'VERIFICATION', desc: 'Strict out-of-sample audits' },
    { title: 'DECISION SUPPORT', desc: 'Clear meteorological action' },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0C10] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs">
        <span className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">
          END-TO-END AUDITABILITY
        </span>
        <span className="text-[11px] text-slate-500">
          PROVENANCE CHAIN
        </span>
      </div>

      {/* Horizontal / Wrapped Trace Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
        {steps.map((s, idx) => (
          <div 
            key={s.title}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-2 hover:border-sky-500/30 transition-colors"
          >
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span className="font-bold text-sky-400">0{idx + 1}</span>
              {idx < steps.length - 1 && (
                <ChevronRight className="hidden lg:block w-3 h-3 text-slate-600" />
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-white uppercase font-sans">
                {s.title}
              </div>
              <div className="text-[9.5px] text-slate-400 font-sans mt-0.5 leading-tight">
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-2 font-sans text-xs text-slate-300">
        &ldquo;Every forecast should remain traceable from input data to final output.&rdquo;
      </div>
    </div>
  );
};
