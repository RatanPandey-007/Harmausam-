import React from 'react';
import { 
  X, 
  BookOpen, 
  Cpu, 
  ShieldCheck, 
  Compass, 
  Layers, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#0E1422] shadow-2xl text-slate-100">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0E1422]/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-sans">
              Scientific Methodology & Mathematical Formulation
            </h3>
            <Badge variant="scientific" className="text-[10px]">
              PEER-GRADE SPEC
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs text-slate-300 font-sans leading-relaxed">
          
          {/* Section 1: Core Hypothesis */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>1. Research Hypothesis & Core Contribution</span>
            </h4>
            <p className="text-slate-300">
              Traditional multi-model weather forecast ensembling relies on fixed-weight averaging or equal-weight arithmetic means. 
              However, numerical weather prediction systems (NWP) and neural data-driven simulators exhibit starkly non-uniform skill profiles:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
              <li><strong className="text-slate-200">High-Resolution NWP (ECMWF IFS 9km):</strong> Excels in deep convective initiation, boundary layer thermodynamics, and extreme rainfall peaks.</li>
              <li><strong className="text-slate-200">Global Spectral Models (GFS 13km / ICON 13km):</strong> Provide robust planetary-scale momentum transfer and synoptic trough tracking with rapid update cycles.</li>
              <li><strong className="text-slate-200">AI Neural Weather Simulators (GraphCast 0.25°):</strong> Autoregressively maintain large-scale geopotential coherence at medium lead times (+72h to +120h) at a fraction of compute cost, but experience spatial smoothing on localized rain bursts.</li>
            </ul>
            <p className="text-slate-300">
              <strong>Harmausam</strong> tests whether <span className="text-cyan-300 font-semibold">Context-Aware Adaptive Blending</span> yields statistically significant error reductions (RMSE, MAE, CSI) over fixed and equal-weight baselines.
            </p>
          </div>

          {/* Section 2: Mathematical Weight Formulation */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>2. Context-Conditioned Bayesian Softmax Loss</span>
            </h4>
            <p className="text-slate-300">
              For a forecast system m in ECMWF, GFS, ICON, GraphCast in weather context C:
            </p>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-xs">
              w_m(C) = exp(-L(m, C) / T) / sum(exp(-L(k, C) / T)), such that sum(w_m) = 1.000
            </div>
            <p className="text-slate-300">
              Where the context-conditioned loss L(m, C) balances four empirical components:
            </p>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300 text-[11px] space-y-1">
              <div>L(m, C) = RMSE(m, regime) + alpha_lead * Degradation(m, lead) + alpha_rec * RecentError(m) + alpha_disag * OutlierPenalty(m)</div>
              <div className="text-slate-500 pt-1">• T = 1.2: Boltzmann temperature controlling distribution sharpness without pathological single-model collapse.</div>
            </div>
          </div>

          {/* Section 3: Uncertainty & Disagreement */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>3. Epistemic Disagreement & Aleatoric Uncertainty</span>
            </h4>
            <p className="text-slate-300">
              Confidence is never arbitrarily declared. It is mathematically coupled to model spread and atmospheric chaos:
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div>sigma_epistemic = sqrt(sum(w_m * (F_m - F_blend)^2)) (inter-model disagreement)</div>
              <div>S_total = sqrt(sigma_epistemic^2 + sigma_aleatoric^2(var, regime))</div>
              <div>CI_90% = [F_blend - 1.645 * S_total, F_blend + 1.645 * S_total]</div>
            </div>
          </div>

          {/* Section 4: Verification Protocol (No Leakage) */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>4. Time-Aware Chronological Out-of-Sample Split</span>
            </h4>
            <p className="text-slate-300">
              Random K-fold train/test splits cause severe temporal autocorrelation leakage in atmospheric time series. 
              All benchmarks in Harmausam strictly utilize chronological blocking:
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TRAINING SPLIT</span>
                <span className="text-white font-bold">Days 1 – 90</span>
                <span className="text-[10px] text-slate-500 block">Weights derived</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">VALIDATION SPLIT</span>
                <span className="text-white font-bold">Days 91 – 105</span>
                <span className="text-[10px] text-slate-500 block">Hyperparameters (T)</span>
              </div>
              <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/40">
                <span className="text-[10px] text-cyan-400 block">TEST SPLIT</span>
                <span className="text-cyan-200 font-bold">Days 106 – 120</span>
                <span className="text-[10px] text-cyan-400 block">Strict out-of-sample</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-[#0E1422] px-6 py-3 flex justify-end">
          <Button onClick={onClose} size="sm" variant="default" className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs">
            Close Methodology
          </Button>
        </div>

      </div>
    </div>
  );
};
