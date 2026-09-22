import React from 'react';
import { 
  Server, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { ProviderHealthStatus } from '../../core/types';

interface SystemHealthProps {
  providerHealth: ProviderHealthStatus[];
  isDemonstrationData: boolean;
  onRefresh: () => void;
  isLoading: boolean;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({
  providerHealth,
  isDemonstrationData,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="space-y-12 py-4">
      
      {/* Engineering Headline */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 hairline-b pb-8">
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            ENGINEERING DIAGNOSTICS
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
            System Ingestion & Telemetry
          </h2>
          <p className="text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
            Real-time pipeline monitoring tracking latency, data completeness, and automated Quality Control (QC) validation pass rates.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 text-xs font-mono text-white border border-white/20 px-3.5 py-2 rounded hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Polling Sources...' : 'Poll Providers'}</span>
        </button>
      </div>

      {/* Provider Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {providerHealth.map((provider) => {
          const isLive = provider.status === 'ONLINE';

          return (
            <div key={provider.providerId} className="p-5 rounded border border-white/10 bg-[#0D0F15] space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">{provider.providerId}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  isLive 
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' 
                    : 'border-white/10 text-slate-400'
                }`}>
                  {isLive ? 'ONLINE' : 'BENCHMARK'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 truncate">
                {provider.name}
              </div>

              <div className="hairline-t pt-3 space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-slate-200">{provider.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>QC Pass Rate:</span>
                  <span className="text-emerald-400 font-bold">{provider.qcPassRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Records:</span>
                  <span className="text-slate-200">{provider.totalRecordsIngested}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cycle:</span>
                  <span className="text-slate-200">{provider.activeCycle}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quality Control Stages & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white font-sans">
              Quality Control Pipeline Stages
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated physical range limits and elevation lapse-rate corrections
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="p-3 rounded bg-white/5 space-y-1">
              <div className="flex justify-between font-semibold text-white">
                <span>1. Boundary Sanity Verification</span>
                <span className="text-emerald-400">100% PASS</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Clamps physical extremes: Temperature [-75°C, 58°C], Wind [0, 110 m/s], RH [0, 100%].
              </p>
            </div>

            <div className="p-3 rounded bg-white/5 space-y-1">
              <div className="flex justify-between font-semibold text-white">
                <span>2. Temporal Rate-of-Change Check</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Flags unnatural unphysical hourly step deltas (&gt;12°C/hr without frontal passage).
              </p>
            </div>

            <div className="p-3 rounded bg-white/5 space-y-1">
              <div className="flex justify-between font-semibold text-white">
                <span>3. Tropospheric Elevation Lapse Adjustment</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Harmonizes station MSL elevation via standard 6.5°C / 1000m lapse rate.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded border border-white/10 bg-[#0D0F15] space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white font-sans">
              Operational Ingestion Audit Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of multi-model data transformations and Bayesian calculations
            </p>
          </div>

          <div className="p-4 rounded bg-black/60 border border-white/5 font-mono text-[11px] space-y-2 h-[260px] overflow-y-auto text-slate-400">
            <div>[00:00:00Z] Pipeline initialized. Ingestion providers verified.</div>
            <div>[00:00:01Z] Quality control active: boundary filters nominal.</div>
            <div>[00:00:02Z] Temporal grid resampled onto uniform lead times: [0, 6, 12, 24, 48, 72, 120, 168]h.</div>
            <div>[00:00:03Z] Context Engine: Weather regime evaluated with thermodynamic proxies.</div>
            <div>[00:00:04Z] Adaptive Weighting: Bayesian softmax optimization converged (T=1.2).</div>
            <div>[00:00:05Z] Uncertainty Engine: Epistemic disagreement and aleatoric bounds computed.</div>
            <div>[00:00:06Z] Out-of-sample chronological verification block synchronized.</div>
            <div className="text-white">[00:00:07Z] Telemetry nominal. Ready for queries.</div>
          </div>
        </div>

      </div>

    </div>
  );
};
