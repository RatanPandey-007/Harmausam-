import React from 'react';
import { ShieldAlert, MapPin, Activity, Radio, AlertTriangle } from 'lucide-react';
import { StationLocation, ExtremeEventAlert } from '../../core/types';

interface EventCommandHeaderProps {
  station: StationLocation;
  isDemonstrationData: boolean;
  selectedEventType: ExtremeEventAlert['eventType'];
  severityRisk: ExtremeEventAlert['severityRisk'];
  status: string;
}

export const EventCommandHeader: React.FC<EventCommandHeaderProps> = ({
  station,
  isDemonstrationData,
  selectedEventType,
  severityRisk,
  status,
}) => {
  return (
    <div className="space-y-4 hairline-b pb-8">
      {/* Top Operational Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#10141E] border border-sky-500/25 text-sky-300">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="font-bold tracking-wider text-[11px] uppercase">OPERATIONAL HAZARD WATCH</span>
          </div>

          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded border tracking-wider uppercase font-semibold ${
              isDemonstrationData
                ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
            }`}
          >
            {isDemonstrationData ? 'DEMONSTRATION BENCHMARK • SYNOP VERIFIED' : 'LIVE OPERATIONAL STREAM'}
          </span>
        </div>

        {/* Station Telemetry Indicator */}
        <div className="flex items-center space-x-2 text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-md">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px]">TARGET:</span>
          <strong className="text-white text-xs">{station.name}</strong>
          <span className="text-slate-500">|</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {station.latitude > 0 ? `${station.latitude.toFixed(2)}°N` : `${Math.abs(station.latitude).toFixed(2)}°S`},{' '}
            {station.longitude > 0 ? `${station.longitude.toFixed(2)}°E` : `${Math.abs(station.longitude).toFixed(2)}°W`}
          </span>
        </div>
      </div>

      {/* Main Headline & Mission Definition */}
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans uppercase">
              EXTREME EVENTS
            </h2>
            <p className="text-base sm:text-lg font-medium text-slate-300 mt-1 font-sans">
              High-consequence meteorological event detection, consensus, and verification.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-400 text-[11px]">ACTIVE THREAT PROFILE:</span>
            <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
              {selectedEventType}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-3xl leading-relaxed">
          Operational monitoring console evaluating deterministic and neural forecasting signals for severe weather thresholds. Harmausam strictly distinguishes predictive warning signals from empirical ground observations using multi-system exceedance consensus, configurable temporal duration criteria, and contingency verification.
        </p>
      </div>
    </div>
  );
};
