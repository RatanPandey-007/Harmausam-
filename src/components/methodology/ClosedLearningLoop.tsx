import React from 'react';
import { RotateCw, ArrowRight } from 'lucide-react';

export const ClosedLearningLoop: React.FC = () => {
  const steps = [
    { num: '01', title: 'FORECAST', desc: 'Blended consensus issued' },
    { num: '02', title: 'OBSERVATION', desc: 'Ground truth recorded (WMO)' },
    { num: '03', title: 'VERIFICATION', desc: 'Residual error quantified' },
    { num: '04', title: 'SKILL UPDATE', desc: 'Regime loss updated' },
    { num: '05', title: 'ADAPTIVE WEIGHTS', desc: 'Weights re-optimized' },
    { num: '06', title: 'NEXT FORECAST', desc: 'Calibrated prediction cycle' },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            CONTINUOUS VERIFICATION & MODEL CALIBRATION
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
            THE LEARNING LOOP
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 font-bold text-[10px] uppercase">
          PLANNED FEEDBACK LOOP
        </span>
      </div>

      <p className="text-sm text-slate-300 font-sans leading-relaxed">
        &ldquo;As new observations become available, historical performance can be updated and used to inform future weighting.&rdquo;
      </p>

      {/* Visual Sequence */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        {steps.map((st, idx) => (
          <div 
            key={st.num}
            className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 space-y-2 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span className="font-bold text-sky-400">{st.num}</span>
              {idx < steps.length - 1 && (
                <ArrowRight className="hidden lg:block w-3 h-3 text-slate-600" />
              )}
            </div>

            <div>
              <div className="font-bold text-white text-[11px] uppercase font-sans">
                {st.title}
              </div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                {st.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[11px] font-mono text-slate-400">
        * Planned operational design: Ingests automated METAR and synoptic surface reports at valid times to dynamically update regime RMSE coefficients without model retraining.
      </div>
    </div>
  );
};
