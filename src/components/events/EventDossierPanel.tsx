import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { ExtremeEventAlert, StationLocation } from '../../core/types';
import { EventThresholdDefinition } from '../../core/events/ExtremeEventEngine';

interface EventDossierPanelProps {
  selectedEventType: ExtremeEventAlert['eventType'];
  severityRisk: ExtremeEventAlert['severityRisk'];
  status: string;
  station: StationLocation;
  peakLeadTimeHours: number;
  activeThreshold: number;
  activeDef: EventThresholdDefinition;
  peakValue: number;
  durationExceededCount: number;
  requiredPeriods: number;
}

export const EventDossierPanel: React.FC<EventDossierPanelProps> = ({
  selectedEventType,
  severityRisk,
  status,
  station,
  peakLeadTimeHours,
  activeThreshold,
  activeDef,
  peakValue,
  durationExceededCount,
  requiredPeriods,
}) => {
  const isCold = selectedEventType === 'Extreme Cold';
  const delta = isCold ? activeThreshold - peakValue : peakValue - activeThreshold;
  const isExceeded = isCold ? peakValue <= activeThreshold : peakValue >= activeThreshold;

  const renderSeverityBadge = () => {
    switch (severityRisk) {
      case 'High Risk':
        return (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded border border-rose-500/40 text-rose-300 bg-rose-500/10 flex items-center space-x-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>HIGH RISK • {status || 'DETECTED'}</span>
          </span>
        );
      case 'Elevated Risk':
        return (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded border border-amber-500/40 text-amber-300 bg-amber-500/10 flex items-center space-x-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>ELEVATED • {status || 'DEVELOPING'}</span>
          </span>
        );
      case 'Watch':
        return (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded border border-yellow-500/40 text-yellow-300 bg-yellow-500/10 flex items-center space-x-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>WATCH • {status || 'MONITOR'}</span>
          </span>
        );
      case 'Information':
      default:
        return (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded border border-white/20 text-slate-300 flex items-center space-x-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>SUB-THRESHOLD • MONITOR</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#0D0F15] space-y-5 flex flex-col justify-between">
      <div className="space-y-5">
        <div className="flex items-center justify-between hairline-b pb-4">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
              EVENT DOSSIER
            </div>
            <h3 className="text-xl font-bold text-white font-sans mt-0.5 uppercase">
              {selectedEventType}
            </h3>
          </div>
          {renderSeverityBadge()}
        </div>

        {/* Core Event Telemetry Rows */}
        <div className="space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center py-1 hairline-b">
            <span className="text-slate-400">Monitoring Station:</span>
            <span className="text-white font-semibold">{station.name}</span>
          </div>

          <div className="flex justify-between items-center py-1 hairline-b">
            <span className="text-slate-400">Operational Status:</span>
            <span className="text-white font-bold tracking-wider">{status}</span>
          </div>

          <div className="flex justify-between items-center py-1 hairline-b">
            <span className="text-slate-400">Peak Threat Horizon:</span>
            <span className="text-sky-300 font-semibold font-mono">+{peakLeadTimeHours}h Valid Offset</span>
          </div>

          <div className="flex justify-between items-center py-1 hairline-b">
            <span className="text-slate-400">Active Threshold (τ):</span>
            <span className="text-white">{activeThreshold.toFixed(1)} {activeDef.unit}</span>
          </div>

          <div className="flex justify-between items-center py-1 hairline-b">
            <span className="text-slate-400">Peak Projected Value:</span>
            <span className="text-white font-bold text-sm">
              {peakValue.toFixed(1)} {activeDef.unit}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 hairline-b">
            <span className="text-slate-400">Threshold Delta (Δ):</span>
            <span className={`font-bold ${isExceeded ? 'text-rose-400' : 'text-slate-400'}`}>
              {isExceeded ? '+' : ''}
              {(peakValue - activeThreshold).toFixed(1)} {activeDef.unit}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Persistence Exceeded:</span>
            <span className="text-white font-semibold">
              {durationExceededCount} of {requiredPeriods} consecutive required
            </span>
          </div>
        </div>
      </div>

      {/* Operational Taxonomy Reference */}
      <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 space-y-1 mt-4">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
          <span>STATUS TAXONOMY</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">MONITOR:</strong> Sub-threshold boundary.{' '}
          <strong className="text-slate-300">DEVELOPING:</strong> 1–2 systems trigger.{' '}
          <strong className="text-slate-300">DETECTED:</strong> Multi-system consensus.{' '}
          <strong className="text-emerald-400">CONFIRMED:</strong> Strictly assigned when verified by empirical observation ground truth.
        </p>
      </div>
    </div>
  );
};
