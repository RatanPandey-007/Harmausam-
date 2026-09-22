import React from 'react';
import { 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  BarChart2, 
  Sparkles,
  Compass,
  Cpu
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ActiveTab } from '../layout/Navbar';

interface HeroProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenMethodology: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onOpenMethodology }) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-800/80 bg-[#0B0F17] py-16 md:py-24">
      {/* Precision Grid Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #38BDF8 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Subtle Atmospheric Depth Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-48 right-10 w-[450px] h-[250px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-slate-900/90 px-3.5 py-1 text-xs text-cyan-300 shadow-sm mb-6 animate-fade-in font-mono">
            <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="tracking-widest uppercase">AI × NWP FORECAST INTELLIGENCE</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Context-Conditioned Bayesian Ensemble</span>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl font-sans leading-[1.1] text-balance">
            Where Forecasts Learn <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              Which Forecast to Trust.
            </span>
          </h1>

          {/* Scientific Subtitle */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed text-balance font-normal">
            An explainable, context-aware meteorological platform that dynamically blends 
            Numerical Weather Prediction models (<span className="text-blue-400 font-mono text-sm">ECMWF</span>, <span className="text-emerald-400 font-mono text-sm">GFS</span>, <span className="text-amber-400 font-mono text-sm">ICON</span>) 
            with AI neural simulators (<span className="text-purple-400 font-mono text-sm">GraphCast</span>) using historical regime skill, lead time degradation, and model disagreement.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => onNavigate('explorer')}
              size="lg"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-6 py-2.5 rounded-md shadow-md shadow-cyan-950/40 flex items-center space-x-2 group"
            >
              <span>Explore Forecast Intelligence</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>

            <Button
              onClick={() => onNavigate('blending')}
              variant="outline"
              size="lg"
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white px-5"
            >
              <Sliders className="w-4 h-4 mr-2 text-cyan-400" />
              <span>Inspect Blending Weights</span>
            </Button>

            <Button
              onClick={() => onNavigate('verification')}
              variant="ghost"
              size="lg"
              className="text-slate-400 hover:text-slate-100 px-4"
            >
              <BarChart2 className="w-4 h-4 mr-2 text-emerald-400" />
              <span>Verification Benchmarks</span>
            </Button>
          </div>

          {/* Real Scientific Telemetry Strip */}
          <div className="mt-14 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0E1422]/70">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                4-Model Ensemble
              </span>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>IFS • GFS • ICON • AI</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">9km NWP to 0.25° GraphCast</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0E1422]/70">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Context-Aware Regimes
              </span>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>5 Dynamic Regimes</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Convective, Gale, Heatwave, Cold</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0E1422]/70">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Evaluation Split
              </span>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Strict Chronological</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Zero Temporal Lookahead Leakage</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0E1422]/70">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Transparent Weights
              </span>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Bayesian Softmax</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Explicit Factor Decomposition</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
