import React from 'react';
import { Activity, ShieldCheck, Database, FlaskConical } from 'lucide-react';

interface DiagnosticHeaderProps {
  isDemonstrationData: boolean;
}

export const DiagnosticHeader: React.FC<DiagnosticHeaderProps> = ({
  isDemonstrationData,
}) => {
  return (
    <div className="space-y-4 hairline-b pb-8">
      {/* Top Laboratory Metadata Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#10141E] border border-sky-500/25 text-sky-300">
            <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold tracking-wider text-[11px] uppercase">
              SCIENTIFIC INVESTIGATION & ATTRIBUTION LAB
            </span>
          </div>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 text-[11px] tracking-wide font-mono hidden md:inline">
            EXP-RUN-2026.09
          </span>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1 rounded bg-[#0E1015] border border-white/10 text-slate-300 flex items-center space-x-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 uppercase text-[9px]">ENGINE:</span>
            <span className="font-semibold text-white">Loss Attribution Ready</span>
          </div>

          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded border tracking-wider uppercase font-semibold ${
              isDemonstrationData
                ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
            }`}
          >
            {isDemonstrationData ? 'DEMONSTRATION BENCHMARK' : 'LIVE OPERATIONAL STREAM'}
          </span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans uppercase">
          Why did Harmausam make this forecast?
        </h2>
        <p className="text-sm text-slate-400 font-sans max-w-3xl mt-2 leading-relaxed">
          Inspect model reliability, disagreement, uncertainty and contextual signals behind the blended forecast.
          This console exposes the exact mathematical weights, regime loss factors, and epistemic boundaries governing consensus.
        </p>
      </div>
    </div>
  );
};
