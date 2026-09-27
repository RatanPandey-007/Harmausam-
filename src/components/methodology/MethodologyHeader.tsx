import React from 'react';
import { BookOpen, Layers, CheckCircle2, AlertCircle, Clock, ShieldCheck, Scale, Cpu } from 'lucide-react';

interface MethodologyHeaderProps {
  isDemonstrationData: boolean;
}

export const MethodologyHeader: React.FC<MethodologyHeaderProps> = ({
  isDemonstrationData,
}) => {
  return (
    <div className="space-y-6 hairline-b pb-8">
      {/* Top Metadata Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#10141E] border border-sky-500/25 text-sky-300">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold tracking-wider text-[11px] uppercase">
              RESEARCH METHODOLOGY & SYNTHESIS MONOGRAPH
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-400 text-[11px] tracking-wide font-mono hidden md:inline">
            REF: HMS-2026-NWP-BLEND
          </span>
        </div>

        {/* 3-State Badge Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center space-x-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>LIVE OPERATIONAL</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center space-x-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>DEMO BENCHMARK</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-bold flex items-center space-x-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>PLANNED PIPELINE</span>
          </div>
        </div>
      </div>

      {/* Main Headline & Supporting Text */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans uppercase">
            How Harmausam builds a better-informed forecast.
          </h2>
        </div>

        <p className="text-base text-slate-300 font-sans max-w-4xl leading-relaxed">
          Harmausam is an intelligent post-processing synthesis engine. It aligns diverse physical numerical weather prediction (NWP) systems and neural autoregressive surrogates, dynamically assesses their contextual regime skill, solves constrained convex weights, and propagates calibrated uncertainty alongside consensus.
        </p>
      </div>

      {/* 30-Second Executive Summary (SIH Reviewer Fast Briefing) */}
      <div className="p-4 rounded-xl bg-[#0D0F15] border border-white/10 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2 text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] uppercase tracking-wider">30-SECOND EXECUTIVE ARCHITECTURE BRIEFING</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline">
            ZERO TEMPORAL LEAKAGE PROTOCOL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <div className="text-sky-400 font-bold text-[11px]">1. Heterogeneous Ingest</div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Ingests ECMWF IFS (9km), GFS (13km), ICON (13km), and GraphCast AI (0.25°).
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <div className="text-sky-400 font-bold text-[11px]">2. Physical Alignment</div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Bilinear interpolation onto 0.1° grid, unit harmonization, and physical QC bounds.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <div className="text-sky-400 font-bold text-[11px]">3. Contextual Convex Weights</div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Constrained Bayesian optimization rewards verified skill in the active weather regime.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <div className="text-sky-400 font-bold text-[11px]">4. Honest Spread & Bounds</div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Inter-model standard deviation σ preserves epistemic disagreement without false certainty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
