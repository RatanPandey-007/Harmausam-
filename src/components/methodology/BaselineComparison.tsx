import React from 'react';
import { ArrowRight, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { ActiveTab } from '../layout/Navbar';

interface BaselineComparisonProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({ onNavigate }) => {
  const baselines = [
    {
      title: 'INDIVIDUAL MODEL',
      subtitle: 'Standalone deterministic run',
      desc: 'Evaluates each standalone NWP (ECMWF, GFS, ICON) and AI model without blending to identify individual system biases.',
      tag: 'CONTROL',
    },
    {
      title: 'EQUAL WEIGHT (1/N)',
      subtitle: 'Uniform 25% allocation',
      desc: 'Standard multi-model ensemble (MME) benchmark. Assumes all forecasting systems contribute equally regardless of atmospheric regime.',
      tag: 'NAIVE BENCHMARK',
    },
    {
      title: 'FIXED WEIGHT',
      subtitle: 'Static historical climatology',
      desc: 'Applies fixed weights based solely on long-term seasonal averages, unable to adapt to rapid synoptic transitions.',
      tag: 'STATIC BENCHMARK',
    },
    {
      title: 'ADAPTIVE BLEND',
      subtitle: 'Dynamic Bayesian optimization',
      desc: 'Harmausam core method. Dynamically re-weights based on detected weather regime, lead-time horizon, and inter-model consensus.',
      tag: 'HARMAUSAM HYBRID',
    },
  ];

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#0D0F15] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            EMPIRICAL RIGOR & BENCHMARKING
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5 uppercase">
            HOW DO WE KNOW THE BLEND HELPS?
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
          4-Tier Comparative Benchmark Suite
        </span>
      </div>

      <p className="text-sm text-slate-300 font-sans leading-relaxed">
        &ldquo;A blended forecast must be proven against meaningful baselines, not simply presented as an isolated prediction.&rdquo;
      </p>

      {/* 4 Methods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {baselines.map((b) => (
          <div 
            key={b.title}
            className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
              b.tag === 'HARMAUSAM HYBRID'
                ? 'bg-[#121927] border-sky-400/40 ring-1 ring-sky-400/20'
                : 'bg-[#12141C] border-white/5'
            }`}
          >
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className={`font-semibold ${b.tag === 'HARMAUSAM HYBRID' ? 'text-sky-300' : 'text-slate-400'}`}>
                  {b.tag}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white font-sans mt-1.5">
                {b.title}
              </h4>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {b.subtitle}
              </div>
              <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">
                {b.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
              <ArrowRight className="w-3 h-3 text-sky-400" />
              <span>Fed into Verification Suite</span>
            </div>
          </div>
        ))}
      </div>

      {/* Verification Banner with Direct CTA */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div>
          <span className="text-white font-bold">STRICT CHRONOLOGICAL OUT-OF-SAMPLE TEST PROTOCOL</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Verified across continuous RMSE, MAE, CRPS, and Brier Skill Scores on ground truth SYNOP observations.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('verification')}
            className="px-3.5 py-1.5 rounded-lg bg-white text-black font-sans font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <span>Open Verification Lab</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
