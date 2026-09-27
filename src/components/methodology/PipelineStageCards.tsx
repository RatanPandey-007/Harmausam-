import React from 'react';
import { 
  Layers, 
  Grid, 
  ShieldAlert, 
  BarChart, 
  Compass, 
  Cpu, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Clock,
  Globe,
  Calendar
} from 'lucide-react';

interface PipelineStageCardsProps {
  activeStageId: string;
}

export const PipelineStageCards: React.FC<PipelineStageCardsProps> = ({ activeStageId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs">
        <span className="text-xs uppercase tracking-wider text-sky-400 font-bold">
          DEEP-DIVE: 10 SCIENTIFIC STAGES
        </span>
        <span className="text-[11px] text-slate-400">
          Architecture & Implementation Breakdown
        </span>
      </div>

      {/* STAGE 01: FORECAST SOURCES (Section 5) */}
      <div 
        id="stage-01" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-01' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              01
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              FORECAST SOURCES
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
            Source configured for demonstration
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;Harmausam can combine multiple forecast systems rather than relying on a single source.&rdquo;
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex justify-between items-center text-white font-bold">
              <span>ECMWF IFS</span>
              <span className="text-[10px] text-sky-400">9km NWP</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              European Centre operational medium-range spectral model. Benchmark physics for atmospheric dynamics.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex justify-between items-center text-white font-bold">
              <span>NCEP GFS</span>
              <span className="text-[10px] text-blue-400">13km NWP</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              NOAA Global Forecast System. High synoptic skill and robust 4-cycle daily global data availability.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex justify-between items-center text-white font-bold">
              <span>DWD ICON</span>
              <span className="text-[10px] text-cyan-400">13km NWP</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              German Weather Service icosahedral non-hydrostatic global model with excellent moisture tracking.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex justify-between items-center text-white font-bold">
              <span>GraphCast AI</span>
              <span className="text-[10px] text-indigo-400">0.25° ML</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Autoregressive graph neural network trained on 40 years of ERA5 reanalysis; sub-second inference.
            </p>
          </div>
        </div>
      </div>

      {/* STAGE 02: DATA ALIGNMENT (Section 6) */}
      <div 
        id="stage-02" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-02' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              02
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              DATA ALIGNMENT
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
            OPERATIONAL
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;Forecasts must be compared on compatible spatial grids, timestamps and forecast lead times.&rdquo;
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="text-white font-bold uppercase text-[11px]">SPATIAL GRID</div>
            <div className="text-sky-300 text-[11px]">Common geographic reference</div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              Bilinear interpolation of 0.1° and 0.25° raw model grids onto co-located WMO surface coordinates.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="text-white font-bold uppercase text-[11px]">TIME SYNCHRONIZATION</div>
            <div className="text-sky-300 text-[11px]">Aligned forecast timestamps</div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              Harmonization of disparate 00z, 06z, 12z model runs to uniform UTC valid verification timestamps.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="text-white font-bold uppercase text-[11px]">LEAD TIME INDEX</div>
            <div className="text-sky-300 text-[11px]">Comparable forecast horizon</div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              Strict pairing of target lead hours (+6h to +168h) ensuring models are compared at identical horizons.
            </p>
          </div>
        </div>

        {/* Alignment Diagram */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <div className="space-y-1 text-slate-400 text-left">
            <div>Source A (IFS 0.1°)  ──┐</div>
            <div>Source B (GFS 0.25°) ──┼──➔ <strong>Unified Verification Reference (WMO Grid + UTC Timestamp)</strong></div>
            <div>Source C (ICON 0.12°) ──┘</div>
          </div>
        </div>
      </div>

      {/* STAGE 03: QUALITY CONTROL (Section 7) */}
      <div 
        id="stage-03" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-03' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              03
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              QUALITY CONTROL
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 font-bold text-[10px] uppercase">
            Planned operational fallback
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;Poor-quality or misaligned inputs should not silently influence the final forecast.&rdquo;
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center">
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">CHECK 1</span>
            <span className="font-bold text-white text-[11px]">Missing Data</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">CHECK 2</span>
            <span className="font-bold text-white text-[11px]">Timestamp Mismatch</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">CHECK 3</span>
            <span className="font-bold text-white text-[11px]">Spatial Mismatch</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">CHECK 4</span>
            <span className="font-bold text-white text-[11px]">Invalid Values (Bounds)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block">CHECK 5</span>
            <span className="font-bold text-white text-[11px]">Source Availability</span>
          </div>
        </div>

        {/* Quality Control Flow */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs flex flex-wrap items-center justify-center gap-4 text-slate-300">
          <span className="px-2.5 py-1 rounded bg-white/10 font-bold">RAW INGEST</span>
          <span>➔</span>
          <span className="px-2.5 py-1 rounded bg-white/10 font-bold">QC INTEGRITY CHECK</span>
          <span>➔</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              VALID ➔ CONTINUE PIPELINE
            </span>
            <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              INVALID ➔ FLAG / FALLBACK
            </span>
          </div>
        </div>
      </div>

      {/* STAGE 04: HISTORICAL SKILL (Section 8) */}
      <div 
        id="stage-04" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-04' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              04
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              HISTORICAL SKILL
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
            DEMO VERIFICATION DATA
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;Harmausam evaluates how forecast sources have performed against observations. Historical performance provides evidence for how much influence a source should receive.&rdquo;
        </p>

        {/* Evaluation Flow */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs flex flex-wrap items-center justify-center gap-3 text-slate-300">
          <span className="p-2 rounded bg-white/10 text-white font-semibold">Forecast System</span>
          <span>➔</span>
          <span className="p-2 rounded bg-white/10 text-white font-semibold">Ground Truth Observation</span>
          <span>➔</span>
          <span className="p-2 rounded bg-white/10 text-white font-semibold">Residual Error (e = ŷ - y)</span>
          <span>➔</span>
          <span className="p-2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
            Historical Skill Metrics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="font-bold text-white">MAE (Mean Absolute Error)</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Measures average magnitude of forecast discrepancies.</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="font-bold text-white">RMSE (Root Mean Square Error)</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Penalizes large outlier forecast errors quadatically.</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="font-bold text-white">BIAS (Mean Error)</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Detects persistent cold/warm or wet/dry systematic shifts.</div>
          </div>
        </div>
      </div>

      {/* STAGE 05: CONTEXT ENGINE (Section 9) */}
      <div 
        id="stage-05" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-05' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              05
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              CONTEXT ENGINE
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
            ACTIVE CORE
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;Model performance can vary with region, season, forecast horizon and weather conditions. Harmausam uses these contextual dimensions when determining source contribution.&rdquo;
        </p>

        {/* 4 Context Dimensions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sky-400 font-bold">REGION</div>
            <div className="text-white font-bold text-sm mt-0.5">New Delhi</div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans">Where is the forecast? Evaluates local terrain & geography.</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sky-400 font-bold">SEASON</div>
            <div className="text-white font-bold text-sm mt-0.5">Monsoon</div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans">What part of the year? Captures seasonal boundary dynamics.</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sky-400 font-bold">LEAD TIME</div>
            <div className="text-white font-bold text-sm mt-0.5">+24-Hour Lead</div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans">How far ahead? Accounts for physics error degradation.</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sky-400 font-bold">WEATHER REGIME</div>
            <div className="text-white font-bold text-sm mt-0.5">Convective</div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans">What type of weather? Rapid change vs stable state.</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-center text-slate-300">
          <span>NEW DELHI + MONSOON + 24-HOUR LEAD + CONVECTIVE REGIME ➔ <strong>OPTIMIZED CONTEXT VECTOR</strong></span>
        </div>
      </div>

      {/* STAGE 06: ADAPTIVE WEIGHTING (Section 10) */}
      <div 
        id="stage-06" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-06' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              06
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              ADAPTIVE WEIGHTING
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
            DEMONSTRATION WEIGHTS
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;The weighting mechanism changes the contribution of each source according to the available historical evidence and contextual conditions.&rdquo;
        </p>

        {/* Weights Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] text-slate-400 uppercase">DYNAMIC ALLOCATION:</div>
            <div className="flex justify-between items-center text-white">
              <span>ECMWF IFS:</span>
              <span className="font-bold text-sky-300">42%</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <span>NCEP GFS:</span>
              <span className="font-bold text-blue-300">27%</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <span>DWD ICON:</span>
              <span className="font-bold text-cyan-300">18%</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <span>GraphCast AI:</span>
              <span className="font-bold text-indigo-300">13%</span>
            </div>
            <div className="pt-2 border-t border-white/10 text-right text-[10px] text-slate-400">
              ∑ w_i = 100% (Strictly Convex)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2.5 font-mono text-xs flex flex-col justify-center">
            <div className="text-[10px] text-slate-400 uppercase">MATHEMATICAL CONVEX COMBINATION:</div>
            <div className="text-sm font-bold text-white bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
              Final Forecast = w₁·F₁ + w₂·F₂ + w₃·F₃ + w₄·F₄
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              &ldquo;For a basic convex blend, weights are constrained to meaningful non-negative contributions that sum to 1.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* STAGE 07: BLENDED FORECAST (Section 11) */}
      <div 
        id="stage-07" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-07' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              07
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              BLENDED FORECAST
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
            OPERATIONAL CONSENSUS
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;Rather than selecting one forecast source, Harmausam combines available signals according to the weighting method.&rdquo;
        </p>

        {/* Synthesis Graphic */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">ECMWF</span>
            <span className="text-base font-bold text-white">26.4°C</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">GFS</span>
            <span className="text-base font-bold text-white">27.1°C</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">ICON</span>
            <span className="text-base font-bold text-white">25.8°C</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">AI MODEL</span>
            <span className="text-base font-bold text-white">26.7°C</span>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-sky-300 block font-bold">HARMAUSAM BLEND</span>
            <span className="text-lg font-bold text-white">26.4°C</span>
          </div>
        </div>
      </div>

      {/* STAGE 08: UNCERTAINTY & MODEL DISAGREEMENT (Section 12) */}
      <div 
        id="stage-08" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-08' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              08
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              UNCERTAINTY & MODEL DISAGREEMENT
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
            EMPIRICAL SPREAD (σ)
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;When forecast sources strongly disagree, the system should communicate that disagreement rather than hiding it behind a single number.&rdquo;
        </p>

        {/* Spread Visual */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>25.8°C (ICON)</span>
            <span className="text-sky-300 font-bold text-sm">Blended: 26.4°C</span>
            <span>27.1°C (GFS)</span>
          </div>
          <div className="relative h-2 w-full bg-white/10 rounded-full">
            <div className="absolute left-[20%] right-[15%] h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 rounded-full" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
            <span>Agreement Level: <strong className="text-amber-300">MODERATE</strong></span>
            <span>Spread Span: <strong>1.3°C (σ = 0.76)</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-slate-300 space-y-1">
            <div className="font-bold text-emerald-400 font-mono text-xs uppercase">LOW DISAGREEMENT</div>
            <p className="text-[11.5px]">Sources are consistent. High consensus strengthens weights and bounds predictive error variance.</p>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-slate-300 space-y-1">
            <div className="font-bold text-rose-400 font-mono text-xs uppercase">HIGH DISAGREEMENT</div>
            <p className="text-[11.5px]">Sources diverge. Flags synoptic front uncertainty, investigates regime transition, and alerts operators.</p>
          </div>
        </div>
      </div>

      {/* STAGE 09: VERIFICATION (Section 13) */}
      <div 
        id="stage-09" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-09' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              09
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              VERIFICATION
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
            STRICT OUT-OF-SAMPLE
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;The purpose of verification is to determine whether the blending approach actually improves forecast skill. Never claim that adaptive blending is always more accurate; empirical evaluation determines where it helps and where it does not.&rdquo;
        </p>

        {/* 4-way comparison */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-center">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">BENCHMARK 1</span>
            <span className="font-bold text-white">Individual Models</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">BENCHMARK 2</span>
            <span className="font-bold text-white">Equal Weight (1/N)</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">BENCHMARK 3</span>
            <span className="font-bold text-white">Fixed Climatology Weight</span>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <span className="text-[10px] text-sky-300 block font-bold">HYBRID SOLUTION</span>
            <span className="font-bold text-white">Adaptive Blend</span>
          </div>
        </div>
      </div>

      {/* STAGE 10: EXTREME EVENT ANALYSIS (Section 14) */}
      <div 
        id="stage-10" 
        className={`p-6 rounded-2xl border transition-all space-y-4 ${
          activeStageId === 'stage-10' ? 'border-sky-400/80 bg-[#10131C] ring-1 ring-sky-400/40' : 'border-white/10 bg-[#0D0F15]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
              10
            </span>
            <h4 className="text-lg font-bold text-white font-sans">
              EXTREME EVENT ANALYSIS
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold text-[10px] uppercase">
            HIGH-IMPACT METRICS
          </span>
        </div>

        <p className="text-sm text-slate-300 font-sans leading-relaxed">
          &ldquo;Extreme-event performance is evaluated separately because average forecast error alone may not capture missed or false event warnings.&rdquo;
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center">
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">METRIC</span>
            <span className="font-bold text-white">Precision</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">METRIC</span>
            <span className="font-bold text-white">Recall (POD)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">METRIC</span>
            <span className="font-bold text-white">F1 Score</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 block">METRIC</span>
            <span className="font-bold text-white">False Alarms</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block">METRIC</span>
            <span className="font-bold text-white">Missed Events</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-400">
          Supported Event Categories: <strong className="text-white">Heavy Rainfall (&gt;25mm)</strong> • <strong className="text-white">Heatwave (&gt;40°C)</strong> • <strong className="text-white">High Wind (&gt;15 m/s)</strong>
        </div>
      </div>

    </div>
  );
};
