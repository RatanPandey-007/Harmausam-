import React from 'react';
import { 
  X, 
  BookOpen, 
  Compass, 
  Cpu, 
  ShieldCheck, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded border border-white/20 bg-[#0A0C10] shadow-2xl text-slate-200">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between hairline-b bg-[#0A0C10]/95 px-8 py-5 backdrop-blur-md">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              SCIENTIFIC RESEARCH PROTOCOL
            </div>
            <h3 className="text-xl font-bold text-white font-sans">
              Methodology & Mathematical Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 space-y-10 text-sm font-sans leading-relaxed">
          
          {/* Section 1: Research Hypothesis */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white font-sans uppercase tracking-wider">
              1. Research Thesis
            </h4>
            <p className="text-slate-300">
              Atmospheric predictability is strongly context-dependent. Fixed-weight averaging or simple equal-weight multi-model ensembles fail to capitalize on the complementary strengths of diverse forecasting architectures:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs pt-2">
              <div className="p-3.5 rounded bg-white/5 space-y-1">
                <span className="font-semibold text-white block">ECMWF IFS (9km)</span>
                <p className="text-slate-400 font-sans text-xs">
                  Superior convective initiation and thermodynamic boundary layer capture, excelling during extreme precipitation and severe frontogenesis.
                </p>
              </div>
              <div className="p-3.5 rounded bg-white/5 space-y-1">
                <span className="font-semibold text-white block">GraphCast AI (0.25°)</span>
                <p className="text-slate-400 font-sans text-xs">
                  Autoregressive global neural simulator trained on ERA5; preserves synoptic geopotential patterns at medium lead times (+72h to +120h) at ultra-low inference latency.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Pipeline Sequence Diagram */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white font-sans uppercase tracking-wider">
              2. End-to-End Pipeline Architecture
            </h4>
            
            <div className="p-6 rounded border border-white/10 bg-black/40 space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-2 text-white">
                <span className="p-2 rounded bg-white/10">1. FORECAST SOURCES</span>
                <span className="text-slate-500">➔</span>
                <span className="p-2 rounded bg-white/10">2. TEMPORAL & SPATIAL ALIGNMENT</span>
                <span className="text-slate-500">➔</span>
                <span className="p-2 rounded bg-white/10">3. REGIME DETECTION</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-white pt-2">
                <span className="text-slate-500">➔</span>
                <span className="p-2 rounded bg-white/10">4. HISTORICAL SKILL</span>
                <span className="text-slate-500">➔</span>
                <span className="p-2 rounded bg-white text-black font-bold">5. ADAPTIVE WEIGHTING</span>
                <span className="text-slate-500">➔</span>
                <span className="p-2 rounded bg-white/10">6. VERIFICATION</span>
              </div>
            </div>
          </div>

          {/* Section 3: Mathematical Formulation */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white font-sans uppercase tracking-wider">
              3. Context-Conditioned Bayesian Softmax Weighting
            </h4>
            <p className="text-slate-300">
              Source weights are calculated via normalized Boltzmann softmax loss over context-conditioned error terms:
            </p>
            <div className="p-4 rounded bg-black/60 border border-white/10 font-mono text-xs text-white space-y-2">
              <div>w_m(C) = exp( -L(m, C) / T ) / ∑ exp( -L(k, C) / T ),  with ∑ w_m = 1.000</div>
              <div className="text-slate-400 text-[11px] pt-1">
                L(m, C) = RMSE_regime(m) + α_lead · Degradation(m, lead) + α_rec · RecentError(m) + α_disag · ConsensusPenalty(m)
              </div>
            </div>
          </div>

          {/* Section 4: Chronological Out-of-Sample Split */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white font-sans uppercase tracking-wider">
              4. Chronological Verification Protocol (No Leakage)
            </h4>
            <p className="text-slate-300">
              To eliminate temporal data contamination, all evaluation utilizes strict chronological time blocks:
            </p>
            <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
              <div className="p-3 rounded bg-white/5">
                <span className="text-slate-400 block text-[10px]">TRAIN (DAYS 1-90)</span>
                <span className="text-white font-bold">Weight Optimization</span>
              </div>
              <div className="p-3 rounded bg-white/5">
                <span className="text-slate-400 block text-[10px]">VALIDATE (DAYS 91-105)</span>
                <span className="text-white font-bold">Temperature (T=1.2)</span>
              </div>
              <div className="p-3 rounded border border-white text-white">
                <span className="text-slate-400 block text-[10px]">TEST (DAYS 106-120)</span>
                <span className="font-bold">Strict Out-of-Sample</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="hairline-t bg-[#0A0C10] px-8 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-white text-black font-medium text-xs hover:bg-slate-200 transition-colors"
          >
            Close Methodology
          </button>
        </div>

      </div>
    </div>
  );
};
