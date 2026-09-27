import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ScientificIntegrityRules: React.FC = () => {
  const tenets = [
    {
      title: 'Blending does not guarantee better accuracy.',
      detail: 'If all models share a common structural flaw or wrong initial condition, blending cannot invent missing physics. It dampens uncorrelated errors, not universal blind spots.',
    },
    {
      title: 'Model performance changes with context.',
      detail: 'No single system dominates everywhere. An AI surrogate may excel at +72h 500hPa geopotential height, while convection-resolving NWP dominates localized rainfall initiation.',
    },
    {
      title: 'Uncertainty should not be hidden.',
      detail: 'A single consensus point without disagreement spread is epistemically misleading. When physics diverges, honest disagreement bounds must be communicated to operators.',
    },
    {
      title: 'Results must be verified against observations.',
      detail: 'Theoretical weights mean nothing without empirical out-of-sample testing. All claims of blending skill are audited against verified ground-truth meteorological stations.',
    },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            RESEARCH CODE OF HONESTY
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
            WHAT HARMAUSAM DOES NOT ASSUME
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">4 Core Scientific Tenets</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tenets.map((t, idx) => (
          <div 
            key={idx}
            className="p-4 rounded-xl bg-[#12141C] border border-white/5 space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-2 text-sky-400 text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TENET 0{idx + 1}</span>
              </div>
              <h4 className="text-sm font-bold text-white font-sans mt-1.5 leading-snug">
                &ldquo;{t.title}&rdquo;
              </h4>
              <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                {t.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
