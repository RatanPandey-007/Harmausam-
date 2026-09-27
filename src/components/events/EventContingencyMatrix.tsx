import React from 'react';
import { EventVerificationResult, EventThresholdDefinition } from '../../core/events/ExtremeEventEngine';

interface EventContingencyMatrixProps {
  verificationResult: EventVerificationResult;
  activeThreshold: number;
  activeDef: EventThresholdDefinition;
}

export const EventContingencyMatrix: React.FC<EventContingencyMatrixProps> = ({
  verificationResult,
  activeThreshold,
  activeDef,
}) => {
  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#0D0F15] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-b pb-4">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
            HISTORICAL BENCHMARK VERIFICATION SUITE
          </div>
          <h3 className="text-xl font-bold text-white font-sans">
            Contingency Evaluation & Detection Reliability
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Evaluated across N = {verificationResult.sampleCount} time-aligned verified forecast/observation pairs.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded border border-white/10">
          SPLIT: <strong className="text-white">Strict Chronological Test Benchmark</strong>
        </div>
      </div>

      {/* Analytical Verification Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Precision */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 space-y-1 font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            PRECISION (PPV)
          </div>
          <div className="text-2xl font-bold text-white">
            {verificationResult.precision !== null ? `${(verificationResult.precision * 100).toFixed(1)}%` : 'Not available'}
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            TP / (TP + FP) — Ratio of predicted events that actually occurred.
          </div>
        </div>

        {/* Recall / POD */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 space-y-1 font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            RECALL (POD)
          </div>
          <div className="text-2xl font-bold text-white">
            {verificationResult.recall !== null ? `${(verificationResult.recall * 100).toFixed(1)}%` : 'Not available'}
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            TP / (TP + FN) — Probability of detection across observed ground events.
          </div>
        </div>

        {/* F1 Score */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 space-y-1 font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            F1 SCORE
          </div>
          <div className="text-2xl font-bold text-white">
            {verificationResult.f1 !== null ? verificationResult.f1.toFixed(3) : 'Not available'}
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            Harmonic balance between false alarms and missed events.
          </div>
        </div>

        {/* Critical Success Index (CSI) */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 space-y-1 font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            THREAT SCORE (CSI)
          </div>
          <div className="text-2xl font-bold text-white">
            {verificationResult.csi !== null ? verificationResult.csi.toFixed(3) : 'Not available'}
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            TP / (TP + FP + FN) — Standard meteorological skill metric.
          </div>
        </div>
      </div>

      {/* 2x2 Contingency Matrix and Skill by Lead Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* A. 2x2 Contingency Matrix */}
        <div className="p-5 rounded-lg border border-white/10 bg-black/40 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 hairline-b pb-3">
            <span className="font-bold text-white uppercase tracking-wider">
              2×2 CONTINGENCY MATRIX
            </span>
            <span>THRESHOLD: τ = {activeThreshold.toFixed(1)}{activeDef.unit}</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Header: Observed State */}
            <div className="grid grid-cols-3 text-center text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              <div></div>
              <div className="bg-white/5 py-1 rounded-t">OBSERVED: NO</div>
              <div className="bg-white/5 py-1 rounded-t">OBSERVED: YES</div>
            </div>

            {/* Row 1: Predicted NO */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-[11px] font-bold text-slate-300 uppercase pr-2 text-right">
                PREDICTED: NO
              </div>

              {/* TN */}
              <div className="p-3 rounded-lg border border-white/10 bg-[#0C0E14] text-center space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">TRUE NEGATIVE (TN)</div>
                <div className="text-xl font-bold text-slate-200">{verificationResult.tn}</div>
                <div className="text-[10px] text-slate-500">
                  {verificationResult.sampleCount > 0 ? ((verificationResult.tn / verificationResult.sampleCount) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* FN */}
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-center space-y-1">
                <div className="text-[10px] text-rose-300 uppercase font-semibold">MISS (FN)</div>
                <div className="text-xl font-bold text-rose-400">{verificationResult.fn}</div>
                <div className="text-[10px] text-rose-300">
                  {verificationResult.sampleCount > 0 ? ((verificationResult.fn / verificationResult.sampleCount) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>

            {/* Row 2: Predicted YES */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-[11px] font-bold text-slate-300 uppercase pr-2 text-right">
                PREDICTED: YES
              </div>

              {/* FP */}
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-center space-y-1">
                <div className="text-[10px] text-amber-300 uppercase font-semibold">FALSE ALARM (FP)</div>
                <div className="text-xl font-bold text-amber-400">{verificationResult.fp}</div>
                <div className="text-[10px] text-amber-300">
                  {verificationResult.sampleCount > 0 ? ((verificationResult.fp / verificationResult.sampleCount) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* TP */}
              <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-center space-y-1">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">HIT (TP)</div>
                <div className="text-xl font-bold text-emerald-400">{verificationResult.tp}</div>
                <div className="text-[10px] text-emerald-300">
                  {verificationResult.sampleCount > 0 ? ((verificationResult.tp / verificationResult.sampleCount) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>

          <div className="hairline-t pt-3 flex justify-between text-[11px] font-mono text-slate-400">
            <div>Total Predicted Events: <strong className="text-white">{verificationResult.tp + verificationResult.fp}</strong></div>
            <div>Total Observed Events: <strong className="text-white">{verificationResult.tp + verificationResult.fn}</strong></div>
          </div>
        </div>

        {/* B. Skill by Lead Time */}
        <div className="p-5 rounded-lg border border-white/10 bg-black/40 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 hairline-b pb-3">
            <span className="font-bold text-white uppercase tracking-wider">
              SKILL BY LEAD TIME HORIZON
            </span>
            <span>+6H TO +168H</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="hairline-b text-[10px] text-slate-400 uppercase">
                  <th className="py-1.5 pr-2">Lead</th>
                  <th className="py-1.5 px-2 text-center">TP / FP / FN</th>
                  <th className="py-1.5 px-2 text-right">Precision</th>
                  <th className="py-1.5 px-2 text-right">Recall</th>
                  <th className="py-1.5 pl-2 text-right">F1 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {verificationResult.byLeadTime.map((lt) => (
                  <tr key={lt.leadTimeHours} className="hover:bg-white/5">
                    <td className="py-2 pr-2 text-white font-bold">
                      +{lt.leadTimeHours}h
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400 text-[11px]">
                      <span className="text-emerald-400 font-semibold">{lt.tp}</span> /{' '}
                      <span className="text-amber-400 font-semibold">{lt.fp}</span> /{' '}
                      <span className="text-rose-400 font-semibold">{lt.fn}</span>
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">
                      {lt.precision !== null ? `${(lt.precision * 100).toFixed(0)}%` : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">
                      {lt.recall !== null ? `${(lt.recall * 100).toFixed(0)}%` : 'N/A'}
                    </td>
                    <td className="py-2 pl-2 text-right text-white font-bold">
                      {lt.f1 !== null ? lt.f1.toFixed(3) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] font-mono text-slate-500 leading-normal hairline-t pt-2">
            Skill exhibits expected physical degradation at longer lead times as numerical dispersion expands ensemble uncertainty.
          </p>
        </div>
      </div>

      {/* C. Skill by Weather Regime */}
      <div className="p-4 rounded-lg border border-white/10 bg-black/40 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 hairline-b pb-2">
          <span className="font-bold text-white uppercase tracking-wider">
            REGIME-STRATIFIED DETECTION SKILL
          </span>
          <span>ERROR DYNAMICS ACROSS SYNOPTIC REGIMES</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="hairline-b text-[10px] text-slate-400 uppercase">
                <th className="py-1.5 pr-2">Synoptic Regime</th>
                <th className="py-1.5 px-2 text-right">Samples (N)</th>
                <th className="py-1.5 px-2 text-center">TP / FP / FN</th>
                <th className="py-1.5 px-2 text-right">Precision</th>
                <th className="py-1.5 px-2 text-right">Recall (POD)</th>
                <th className="py-1.5 pl-2 text-right">F1 Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {verificationResult.byRegime.map((rg) => (
                <tr key={rg.regime} className="hover:bg-white/5">
                  <td className="py-2 pr-2 text-white font-semibold">
                    {rg.regime}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400">
                    {rg.sampleCount}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400 text-[11px]">
                    <span className="text-emerald-400 font-semibold">{rg.tp}</span> /{' '}
                    <span className="text-amber-400 font-semibold">{rg.fp}</span> /{' '}
                    <span className="text-rose-400 font-semibold">{rg.fn}</span>
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300">
                    {rg.precision !== null ? `${(rg.precision * 100).toFixed(0)}%` : 'N/A'}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300">
                    {rg.recall !== null ? `${(rg.recall * 100).toFixed(0)}%` : 'N/A'}
                  </td>
                  <td className="py-2 pl-2 text-right text-white font-bold">
                    {rg.f1 !== null ? rg.f1.toFixed(3) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
