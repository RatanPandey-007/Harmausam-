import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  FileText,
  Compass
} from 'lucide-react';
import { 
  ExtremeEventAlert, 
  StationLocation 
} from '../../core/types';

interface ExtremeEventMonitorProps {
  alerts: ExtremeEventAlert[];
  station: StationLocation;
  isDemonstrationData: boolean;
}

export const ExtremeEventMonitor: React.FC<ExtremeEventMonitorProps> = ({
  alerts,
  station,
  isDemonstrationData,
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    alerts.length > 0 ? alerts[0].id : null
  );

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];

  const getSeverityBadge = (severity: ExtremeEventAlert['severityRisk']) => {
    switch (severity) {
      case 'High Risk':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-rose-500/40 text-rose-300 bg-rose-500/10">HIGH RISK</span>;
      case 'Elevated Risk':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 bg-amber-500/10">ELEVATED RISK</span>;
      case 'Watch':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-yellow-500/40 text-yellow-300 bg-yellow-500/10">WATCH</span>;
      case 'Information':
      default:
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-white/20 text-slate-300">ADVISORY</span>;
    }
  };

  return (
    <div className="space-y-12 py-4">
      
      {/* 1. NASA Mission Alert Headline */}
      <div className="space-y-2 hairline-b pb-8">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          OPERATIONAL HAZARD BULLETIN
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
          Extreme Weather Monitoring
        </h2>
        <p className="text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
          Probabilistic multi-model threshold exceedance analysis for severe convective downpours, thermal heatwaves, gale-force winds, and freezing conditions.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 rounded border border-white/10 bg-[#0D0F15] text-center space-y-3">
          <div className="w-10 h-10 rounded-full border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white font-sans">
            No Hazardous Conditions Detected
          </h3>
          <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
            All blended parameters for {station.name} remain safely below high-risk meteorological thresholds over the next 7 days.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Hazards List */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase px-1">
              ACTIVE HAZARD ADVISORIES ({alerts.length})
            </div>

            {alerts.map((alert) => {
              const isSelected = alert.id === selectedAlert?.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-4 rounded border transition-colors cursor-pointer ${
                    isSelected 
                      ? 'border-white bg-[#141722]' 
                      : 'border-white/10 bg-[#0D0F15] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white font-sans">{alert.eventType}</span>
                    {getSeverityBadge(alert.severityRisk)}
                  </div>

                  <div className="mt-3 text-xs font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Exceedance Prob:</span>
                      <span className="text-white font-bold">{alert.probabilityOfExceedance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Model Agreement:</span>
                      <span className="text-slate-300">{Math.round(alert.modelAgreementRatio * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Threat:</span>
                      <span className="text-slate-300">
                        {new Date(alert.timeWindow.peak).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operational Dossier & Advisory Bulletin */}
          {selectedAlert && (
            <div className="lg:col-span-2 p-6 rounded border border-white/10 bg-[#0D0F15] space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-b pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-2xl font-bold text-white font-sans">
                      {selectedAlert.eventType}
                    </h3>
                    {getSeverityBadge(selectedAlert.severityRisk)}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    {selectedAlert.location.name} • {selectedAlert.location.latitude.toFixed(2)}°N, {selectedAlert.location.longitude.toFixed(2)}°E
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  <div>Onset: <strong className="text-white">{new Date(selectedAlert.timeWindow.onset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                  <div>Peak: <strong className="text-white">{new Date(selectedAlert.timeWindow.peak).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                </div>
              </div>

              {/* Threshold Exceedance Overview */}
              <div className="p-4 rounded bg-white/5 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Parameter Evaluated:</span>
                  <span className="text-white font-semibold">{selectedAlert.thresholdExceeded.variable}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Critical Exceedance Threshold:</span>
                  <span className="text-white font-bold">{selectedAlert.thresholdExceeded.thresholdValue} {selectedAlert.thresholdExceeded.unit}</span>
                </div>
                <div className="flex justify-between text-slate-300 hairline-t pt-2">
                  <span>Adaptive Blended Forecast Value:</span>
                  <span className="text-white font-bold text-sm">
                    {selectedAlert.thresholdExceeded.blendedForecastValue.toFixed(1)} {selectedAlert.thresholdExceeded.unit}
                  </span>
                </div>
              </div>

              {/* Meteorological Evidence Signals */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  METEOROLOGICAL SIGNALS CHECKLIST
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {selectedAlert.evidenceFeatures.map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-white/5 text-slate-300 flex items-start space-x-2">
                      <span className="text-slate-400">•</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Consensus Grid */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  INDIVIDUAL SYSTEM EXCEEDANCE
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs text-center">
                  {Object.entries(selectedAlert.individualExceedance).map(([src, exceeds]) => (
                    <div key={src} className={`p-2 rounded border ${
                      exceeds 
                        ? 'border-white/30 bg-white/10 text-white font-bold' 
                        : 'border-white/5 bg-white/5 text-slate-500'
                    }`}>
                      <div>{src}</div>
                      <div className="text-[10px] uppercase mt-0.5">{exceeds ? 'TRIGGERED' : 'SUB-THRESHOLD'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Advisory Bulletin */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  RAW OPERATIONAL BULLETIN
                </div>
                <pre className="p-4 rounded bg-black/60 border border-white/5 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedAlert.meteorologicalBulletin}
                </pre>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
