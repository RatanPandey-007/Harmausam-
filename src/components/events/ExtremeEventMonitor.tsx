import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Download, 
  Compass,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ExtremeEventAlert, 
  StationLocation 
} from '../../core/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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

  const getRiskBadge = (severity: ExtremeEventAlert['severityRisk']) => {
    switch (severity) {
      case 'High Risk':
        return <Badge variant="danger" className="text-xs font-mono uppercase">HIGH RISK</Badge>;
      case 'Elevated Risk':
        return <Badge variant="warning" className="text-xs font-mono uppercase">ELEVATED RISK</Badge>;
      case 'Watch':
        return <Badge variant="warning" className="text-xs font-mono uppercase">WATCH</Badge>;
      case 'Information':
      default:
        return <Badge variant="secondary" className="text-xs font-mono uppercase">INFORMATION</Badge>;
    }
  };

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];

  return (
    <div className="space-y-6">
      
      {/* Operational Protocol Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Operational Extreme Event Early Warning System</h2>
              <Badge variant="scientific" className="text-xs">
                WMO Multi-Hazard Protocol
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Monitors probabilistic multi-model exceedance: <span className="text-cyan-300">Heavy Rainfall</span>, <span className="text-cyan-300">Heatwave</span>, <span className="text-cyan-300">High Wind Gale</span>, <span className="text-cyan-300">Sub-Zero Freeze</span>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={alerts.length > 0 ? 'warning' : 'success'} className="font-mono text-xs py-1 px-2.5">
              {alerts.length > 0 ? `${alerts.length} HAZARD CONDITIONS DETECTED` : 'ALL VARIABLES NOMINAL'}
            </Badge>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card className="border-slate-800 bg-[#0E1422] p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Severe Weather Alerts Triggered</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-mono">
            Multi-model blended forecasts for {station.name} remain safely below high-risk meteorological thresholds for the next 7 days.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Alerts Feed List */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block px-1">
              Active Hazard Bulletins ({alerts.length})
            </span>

            {alerts.map((alert) => {
              const isSelected = alert.id === selectedAlert?.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/30' 
                      : 'bg-[#0E1422] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">{alert.eventType}</span>
                    {getRiskBadge(alert.severityRisk)}
                  </div>

                  <div className="text-xs font-mono text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Exceedance Prob:</span>
                      <span className="text-amber-400 font-bold">{alert.probabilityOfExceedance}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Model Agreement:</span>
                      <span className="text-slate-200">{Math.round(alert.modelAgreementRatio * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confidence:</span>
                      <span className="text-cyan-300">{alert.confidence}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Alert Dossier & Meteorological Bulletin */}
          {selectedAlert && (
            <Card className="lg:col-span-2 border-slate-800 bg-[#0E1422]">
              <CardHeader className="border-b border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{selectedAlert.eventType} Alert Dossier</span>
                      </CardTitle>
                      {getRiskBadge(selectedAlert.severityRisk)}
                    </div>
                    <CardDescription className="font-mono mt-1 text-xs">
                      Location: {selectedAlert.location.name} ({selectedAlert.location.latitude.toFixed(2)}°N, {selectedAlert.location.longitude.toFixed(2)}°E)
                    </CardDescription>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-400">
                    <div>Valid Onset: {new Date(selectedAlert.timeWindow.onset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-cyan-300">Peak Threat: {new Date(selectedAlert.timeWindow.peak).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', weekday: 'short' })}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                
                {/* Critical Threshold Bar */}
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Critical Variable Exceeded:</span>
                    <span className="text-slate-200 font-semibold">{selectedAlert.thresholdExceeded.variable}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-slate-400">Hazard Critical Threshold:</span>
                    <span className="text-amber-400 font-bold">{selectedAlert.thresholdExceeded.thresholdValue} {selectedAlert.thresholdExceeded.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono border-t border-slate-800/80 pt-2">
                    <span className="text-slate-300 font-semibold">Adaptive Blended Forecast:</span>
                    <span className="text-rose-400 font-extrabold text-base">
                      {selectedAlert.thresholdExceeded.blendedForecastValue.toFixed(1)} {selectedAlert.thresholdExceeded.unit}
                    </span>
                  </div>
                </div>

                {/* Evidence Features Checklist */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                    Supporting Meteorological Evidence Signals:
                  </h4>
                  <div className="space-y-2 font-mono text-xs">
                    {selectedAlert.evidenceFeatures.map((ev, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-slate-300 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Consensus Exceedance breakdown */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Individual System Exceedance Consensus:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    {Object.entries(selectedAlert.individualExceedance).map(([src, exceeds]) => (
                      <div 
                        key={src} 
                        className={`p-2 rounded text-center border ${
                          exceeds 
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="block font-semibold">{src}</span>
                        <span className="text-[10px]">{exceeds ? 'EXCEEDED' : 'Sub-threshold'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meteorological Official Bulletin (Preformatted for Operational Dissemination) */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Operational Early Warning Advisory (Raw Bulletin)</span>
                  </h4>
                  <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedAlert.meteorologicalBulletin}
                  </pre>
                </div>

              </CardContent>
            </Card>
          )}

        </div>
      )}

    </div>
  );
};
