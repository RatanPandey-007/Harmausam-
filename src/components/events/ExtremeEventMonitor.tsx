import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Info,
  Sliders,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Calendar,
  BarChart3,
  ExternalLink,
  Target
} from 'lucide-react';
import { 
  ExtremeEventAlert, 
  StationLocation, 
  BlendedForecastResult,
  VerificationComparison,
  WeatherVariable,
  ForecastSourceId
} from '../../core/types';
import { ActiveTab } from '../layout/Navbar';
import { 
  ExtremeEventEngine, 
  EVENT_THRESHOLDS, 
  EventThresholdDefinition,
  HistoricalEventCase 
} from '../../core/events/ExtremeEventEngine';
import { ExtremeEventMap } from './ExtremeEventMap';

interface ExtremeEventMonitorProps {
  alerts: ExtremeEventAlert[];
  station: StationLocation;
  setStation?: (st: StationLocation) => void;
  timeSeriesTrajectory?: BlendedForecastResult[];
  verification?: VerificationComparison;
  isDemonstrationData: boolean;
  onNavigate?: (tab: ActiveTab) => void;
  setSelectedVariable?: (v: WeatherVariable) => void;
}

export const ExtremeEventMonitor: React.FC<ExtremeEventMonitorProps> = ({
  alerts,
  station,
  setStation,
  timeSeriesTrajectory = [],
  verification,
  isDemonstrationData,
  onNavigate,
  setSelectedVariable,
}) => {
  // Selected Event Category
  const [selectedEventType, setSelectedEventType] = useState<ExtremeEventAlert['eventType']>('Heatwave');

  // Configurable Thresholds State (customizable per category)
  const activeDef = useMemo(() => {
    return EVENT_THRESHOLDS.find(d => d.eventType === selectedEventType) || EVENT_THRESHOLDS[0];
  }, [selectedEventType]);

  const [thresholdsByEvent, setThresholdsByEvent] = useState<Record<ExtremeEventAlert['eventType'], number>>({
    'Heatwave': 38.0,
    'Heavy rainfall': 18.0,
    'High wind': 17.2,
    'Extreme Cold': -5.0
  });

  const activeThreshold = thresholdsByEvent[selectedEventType] ?? activeDef.defaultThreshold;

  // Duration Logic (N consecutive timesteps)
  const [durationPeriods, setDurationPeriods] = useState<number>(1);

  // Selected Historical Case for Inspection
  const [inspectedCaseId, setInspectedCaseId] = useState<string | null>(null);

  // 1. Evaluate Network Statuses for Map
  const networkStatuses = useMemo(() => {
    return ExtremeEventEngine.scanNetworkStations(selectedEventType, activeThreshold);
  }, [selectedEventType, activeThreshold]);

  // 2. Trajectory Event Progression Analysis
  const trajectoryAnalysis = useMemo(() => {
    return ExtremeEventEngine.evaluateTrajectoryEvents(
      timeSeriesTrajectory,
      selectedEventType,
      activeThreshold,
      durationPeriods
    );
  }, [timeSeriesTrajectory, selectedEventType, activeThreshold, durationPeriods]);

  // 3. Historical Verification Dataset Evaluation
  const verificationResult = useMemo(() => {
    const dataPoints = verification?.dataPoints ?? [];
    return ExtremeEventEngine.evaluateHistoricalEvents(
      dataPoints,
      selectedEventType,
      activeThreshold,
      durationPeriods
    );
  }, [verification?.dataPoints, selectedEventType, activeThreshold, durationPeriods]);

  // Selected Case Object
  const inspectedCase = useMemo(() => {
    if (!inspectedCaseId) return verificationResult.cases[0] || null;
    return verificationResult.cases.find(c => c.id === inspectedCaseId) || verificationResult.cases[0] || null;
  }, [inspectedCaseId, verificationResult.cases]);

  // Handle station change
  const handleStationSelect = (st: StationLocation) => {
    if (setStation) {
      setStation(st);
    }
  };

  // Severity Badge Helper
  const renderSeverityBadge = (severity: ExtremeEventAlert['severityRisk'], status?: string) => {
    switch (severity) {
      case 'High Risk':
        return (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-rose-500/40 text-rose-300 bg-rose-500/10 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>HIGH RISK • {status || 'DETECTED'}</span>
          </span>
        );
      case 'Elevated Risk':
        return (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 bg-amber-500/10 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>ELEVATED • {status || 'DEVELOPING'}</span>
          </span>
        );
      case 'Watch':
        return (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-yellow-500/40 text-yellow-300 bg-yellow-500/10 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>WATCH • {status || 'MONITOR'}</span>
          </span>
        );
      case 'Information':
      default:
        return (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-white/20 text-slate-300 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>SUB-THRESHOLD • MONITOR</span>
          </span>
        );
    }
  };

  // Current primary step at peak or +48h
  const primaryStep = useMemo(() => {
    return timeSeriesTrajectory.find(t => t.leadTimeHours === trajectoryAnalysis.peakLeadTimeHours) ||
      timeSeriesTrajectory.find(t => t.leadTimeHours === 48) ||
      timeSeriesTrajectory[0];
  }, [timeSeriesTrajectory, trajectoryAnalysis.peakLeadTimeHours]);

  return (
    <div className="space-y-10 py-2">
      
      {/* 1. RESEARCH MISSION HEADLINE & HONESTY BANNER */}
      <div className="space-y-3 hairline-b pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10">
              OPERATIONAL EVENT DETECTION & VERIFICATION
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isDemonstrationData 
                ? 'border-amber-500/30 text-amber-300 bg-amber-500/10' 
                : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
            }`}>
              {isDemonstrationData ? 'DEMONSTRATION DATA • HISTORICAL TEST CASE' : 'LIVE OPERATIONAL STREAM'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>MONITORED STATION:</span>
            <strong className="text-white">{station.name}</strong>
          </div>
        </div>

        <div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
            EXTREME EVENTS
          </h2>
          <p className="text-lg sm:text-xl font-medium text-slate-300 mt-1 font-sans">
            Detecting weather conditions that matter most.
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-3xl leading-relaxed">
          Harmausam evaluates forecast signals for unusual weather conditions and compares detected events against observations. The system strictly distinguishes forecast warning signals from confirmed, observed ground occurrences using multi-source consensus, configurable threshold persistence, and publication-grade contingency verification.
        </p>
      </div>

      {/* 2. EVENT CATEGORY TABS & CONFIGURABLE THRESHOLD / DURATION ENGINE */}
      <div className="p-5 rounded-lg border border-white/10 bg-[#0D0F15] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 hairline-b pb-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {EVENT_THRESHOLDS.map((def) => {
              const isActive = selectedEventType === def.eventType;
              return (
                <button
                  key={def.eventType}
                  onClick={() => {
                    setSelectedEventType(def.eventType);
                    if (setSelectedVariable) {
                      setSelectedVariable(def.variable);
                    }
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                  <span>{def.eventType.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Context Indicator */}
          <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
            <span>PARAMETER:</span>
            <span className="text-white font-semibold">{activeDef.variable}</span>
            <span className="text-slate-500">|</span>
            <span>WMO CODE:</span>
            <span className="text-slate-300">{station.id}</span>
          </div>
        </div>

        {/* Threshold & Duration Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
          {/* A. Configurable Threshold Tier Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>EVENT THRESHOLD (τ):</span>
              </span>
              <strong className="text-white font-mono">{activeThreshold.toFixed(1)} {activeDef.unit}</strong>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {activeDef.selectableThresholds.map((t) => {
                const isSelected = activeThreshold === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      setThresholdsByEvent(prev => ({ ...prev, [selectedEventType]: t.value }));
                    }}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-mono text-left transition-colors border ${
                      isSelected
                        ? 'border-white bg-white/15 text-white font-bold'
                        : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <div>{t.value.toFixed(1)} {activeDef.unit}</div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{t.label.split(' (')[1]?.replace(')', '') || 'Preset'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Configurable Duration Persistence Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>DURATION FILTER (N TIMESTEPS):</span>
              </span>
              <strong className="text-white font-mono">{durationPeriods} {durationPeriods === 1 ? 'Period' : 'Consecutive'}</strong>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { periods: 1, label: 'Instantaneous (1 step)', desc: '>=1 forecast step' },
                { periods: 2, label: 'Sustained (2 steps)', desc: '>=6h continuous' },
                { periods: 3, label: 'Persistent (3 steps)', desc: '>=12h continuous' }
              ].map((d) => {
                const isSelected = durationPeriods === d.periods;
                return (
                  <button
                    key={d.periods}
                    onClick={() => setDurationPeriods(d.periods)}
                    className={`px-2 py-1.5 rounded text-[11px] font-mono text-center transition-colors border ${
                      isSelected
                        ? 'border-white bg-white/15 text-white font-bold'
                        : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <div>N = {d.periods}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{d.periods === 1 ? 'Single' : `${d.periods * 3}h+`}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] font-mono text-slate-500 leading-tight">
              Eliminates transient model spikes by requiring consecutive threshold exceedance.
            </p>
          </div>

          {/* C. Meteorological Standard Reference */}
          <div className="space-y-1.5 p-3 rounded bg-black/40 border border-white/5 text-[11px] font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Info className="w-3 h-3 text-slate-400" />
              <span>METEOROLOGICAL DEFINITION</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {activeDef.description}
            </p>
            <div className="text-[10px] text-slate-400 hairline-t pt-1.5">
              REF: {activeDef.wmoStandardReference}
            </div>
          </div>
        </div>
      </div>

      {/* 3. METEOROLOGICAL EVENT MAP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="uppercase tracking-widest text-[10px]">GEOSPATIAL EVENT OBSERVATION MATRIX</span>
          </div>
          <span>CLICK ANY STATION PIN TO FOCUS EVENT DOSSIER</span>
        </div>

        <ExtremeEventMap
          selectedStation={station}
          onSelectStation={handleStationSelect}
          networkStatuses={networkStatuses}
          eventType={selectedEventType}
          activeThreshold={activeThreshold}
          unit={activeDef.unit}
          leadTimeHours={48}
        />
      </div>

      {/* 4. ACTIVE SELECTED EVENT DOSSIER & MULTI-MODEL CONSENSUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Event Overview Card */}
        <div className="p-6 rounded-lg border border-white/10 bg-[#0D0F15] space-y-5">
          <div className="flex items-center justify-between hairline-b pb-4">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                EVENT DOSSIER
              </div>
              <h3 className="text-xl font-bold text-white font-sans mt-0.5">
                {selectedEventType}
              </h3>
            </div>
            {renderSeverityBadge(trajectoryAnalysis.severityRisk, trajectoryAnalysis.status)}
          </div>

          {/* Core Event Metrics */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 hairline-b">
              <span className="text-slate-400">Monitoring Target:</span>
              <span className="text-white font-semibold">{station.name}</span>
            </div>

            <div className="flex justify-between items-center py-1 hairline-b">
              <span className="text-slate-400">Event Status:</span>
              <span className="text-white font-bold">{trajectoryAnalysis.status}</span>
            </div>

            <div className="flex justify-between items-center py-1 hairline-b">
              <span className="text-slate-400">Peak Threat Window:</span>
              <span className="text-white font-semibold">+{trajectoryAnalysis.peakLeadTimeHours}h Horizon</span>
            </div>

            <div className="flex justify-between items-center py-1 hairline-b">
              <span className="text-slate-400">Configured Threshold (τ):</span>
              <span className="text-white">{activeThreshold.toFixed(1)} {activeDef.unit}</span>
            </div>

            <div className="flex justify-between items-center py-1 hairline-b">
              <span className="text-slate-400">Peak Forecast Value:</span>
              <span className="text-white font-bold text-sm">
                {trajectoryAnalysis.peakValue.toFixed(1)} {activeDef.unit}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 hairline-b">
              <span className="text-slate-400">Threshold Exceedance (Δ):</span>
              <span className={`font-bold ${
                (trajectoryAnalysis.peakValue - activeThreshold) >= 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {(trajectoryAnalysis.peakValue - activeThreshold) >= 0 ? '+' : ''}
                {(trajectoryAnalysis.peakValue - activeThreshold).toFixed(1)} {activeDef.unit}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Consecutive Periods Exceeded:</span>
              <span className="text-white font-semibold">
                {trajectoryAnalysis.durationExceededCount} of {durationPeriods} required
              </span>
            </div>
          </div>

          {/* Operational Honesty Notice */}
          <div className="p-3 rounded bg-white/5 border border-white/5 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>STATUS TAXONOMY</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              <strong>MONITOR:</strong> Sub-threshold boundary. <strong>DEVELOPING:</strong> 1-2 systems trigger. <strong>DETECTED:</strong> Multi-system consensus. <strong>CONFIRMED:</strong> Strictly assigned when verified by empirical observation ground truth.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Multi-Source Consensus Table & Disagreement Analysis */}
        <div className="lg:col-span-2 p-6 rounded-lg border border-white/10 bg-[#0D0F15] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-b pb-4">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                MULTI-SOURCE EVENT CONSENSUS (+{trajectoryAnalysis.peakLeadTimeHours}H)
              </div>
              <h3 className="text-lg font-bold text-white font-sans">
                Forecast System Exceedance & Weight Contribution
              </h3>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center space-x-2">
              <span>MODEL SPREAD:</span>
              <strong className="text-white">±{primaryStep.modelSpread.toFixed(2)} {activeDef.unit}</strong>
            </div>
          </div>

          {/* Consensus Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="hairline-b text-[10px] text-slate-400 uppercase">
                  <th className="py-2 pr-3">Forecast System</th>
                  <th className="py-2 px-3 text-right">Projected Value</th>
                  <th className="py-2 px-3 text-right">Delta vs Threshold</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 pl-3 text-right">Applied Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { id: 'ECMWF' as ForecastSourceId, name: 'ECMWF IFS 9km', val: primaryStep.individualForecasts.ECMWF, w: primaryStep.adaptiveWeights.ECMWF?.weight ?? 0.35 },
                  { id: 'GFS' as ForecastSourceId, name: 'NCEP GFS 13km', val: primaryStep.individualForecasts.GFS, w: primaryStep.adaptiveWeights.GFS?.weight ?? 0.25 },
                  { id: 'ICON' as ForecastSourceId, name: 'DWD ICON 13km', val: primaryStep.individualForecasts.ICON, w: primaryStep.adaptiveWeights.ICON?.weight ?? 0.25 },
                  { id: 'GRAPHCAST' as ForecastSourceId, name: 'GraphCast AI 0.25°', val: primaryStep.individualForecasts.GRAPHCAST, w: primaryStep.adaptiveWeights.GRAPHCAST?.weight ?? 0.15 },
                ].map((m) => {
                  const isCold = selectedEventType === 'Extreme Cold';
                  const exceeds = isCold ? m.val <= activeThreshold : m.val >= activeThreshold;
                  const delta = m.val - activeThreshold;

                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 pr-3 text-white font-semibold">
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200 font-bold">
                        {m.val.toFixed(1)} {activeDef.unit}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${
                        delta >= 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)} {activeDef.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          exceeds 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                            : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}>
                          {exceeds ? 'EXCEEDED' : 'SUB-THRESHOLD'}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right text-slate-300">
                        {(m.w * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}

                {/* Baselines & Adaptive Blend Rows */}
                <tr className="bg-white/5 font-semibold hairline-t">
                  <td className="py-2.5 pr-3 text-slate-300">
                    Equal-Weight Ensemble (1/N)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-200">
                    {primaryStep.equalWeightForecast.toFixed(1)} {activeDef.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {(primaryStep.equalWeightForecast - activeThreshold) >= 0 ? '+' : ''}
                    {(primaryStep.equalWeightForecast - activeThreshold).toFixed(1)} {activeDef.unit}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      {(selectedEventType === 'Extreme Cold' ? primaryStep.equalWeightForecast <= activeThreshold : primaryStep.equalWeightForecast >= activeThreshold) ? 'EXCEEDED' : 'SUB-THRESHOLD'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right text-slate-400">
                    25.0% each
                  </td>
                </tr>

                <tr className="bg-white/10 font-bold">
                  <td className="py-2.5 pr-3 text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Adaptive Context Blend</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-white text-sm">
                    {primaryStep.adaptiveBlendedForecast.toFixed(1)} {activeDef.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sky-400">
                    {(primaryStep.adaptiveBlendedForecast - activeThreshold) >= 0 ? '+' : ''}
                    {(primaryStep.adaptiveBlendedForecast - activeThreshold).toFixed(1)} {activeDef.unit}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      (selectedEventType === 'Extreme Cold' ? primaryStep.adaptiveBlendedForecast <= activeThreshold : primaryStep.adaptiveBlendedForecast >= activeThreshold)
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50'
                        : 'bg-white/10 text-slate-300'
                    }`}>
                      {(selectedEventType === 'Extreme Cold' ? primaryStep.adaptiveBlendedForecast <= activeThreshold : primaryStep.adaptiveBlendedForecast >= activeThreshold) ? 'EXCEEDED' : 'SUB-THRESHOLD'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right text-white">
                    100.0% (Adaptive)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Model Agreement Explanation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-black/40 border border-white/5 text-xs font-mono text-slate-400">
            <div>
              <span>CONSENSUS EVIDENCE:</span>{' '}
              <strong className="text-white">
                {Object.values(primaryStep.individualForecasts).filter(v => 
                  selectedEventType === 'Extreme Cold' ? v <= activeThreshold : v >= activeThreshold
                ).length} of 4
              </strong>{' '}
              operational forecasting systems exceed the configured threshold at +{trajectoryAnalysis.peakLeadTimeHours}h lead time.
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('blending')}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center space-x-1 whitespace-nowrap self-end sm:self-center"
              >
                <span>INSPECT BLENDING WEIGHTS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 5. HORIZONTAL EVENT TIMELINE */}
      <div className="p-6 rounded-lg border border-white/10 bg-[#0D0F15] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 hairline-b pb-4">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              TEMPORAL PROGRESSION TRAJECTORY
            </div>
            <h3 className="text-lg font-bold text-white font-sans">
              Forecast Horizon & Threat Evolution (+0h to +168h)
            </h3>
          </div>

          <div className="text-xs font-mono text-slate-400">
            CRITICAL THRESHOLD: <strong className="text-white">{activeThreshold.toFixed(1)} {activeDef.unit}</strong>
          </div>
        </div>

        {/* Step-by-Step Horizontal Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
          {trajectoryAnalysis.timeline.map((step) => {
            const isPeak = step.leadTimeHours === trajectoryAnalysis.peakLeadTimeHours;
            const delta = step.value - activeThreshold;

            let stageBadgeBg = 'bg-white/5 text-slate-400';
            if (step.stage === 'Peak') stageBadgeBg = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
            else if (step.stage === 'Developing') stageBadgeBg = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
            else if (step.stage === 'Ending') stageBadgeBg = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';

            return (
              <div
                key={step.leadTimeHours}
                className={`p-3 rounded border font-mono text-xs space-y-2 transition-all ${
                  isPeak 
                    ? 'border-white bg-[#141724] ring-1 ring-white/20' 
                    : step.exceeds
                    ? 'border-white/20 bg-white/5'
                    : 'border-white/5 bg-black/30'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">+{step.leadTimeHours}h</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${stageBadgeBg}`}>
                    {step.stage}
                  </span>
                </div>

                <div className="text-center py-1">
                  <div className="text-base font-bold text-white font-mono">
                    {step.value.toFixed(1)}{activeDef.unit}
                  </div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${
                    delta >= 0 ? 'text-rose-400' : 'text-slate-500'
                  }`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)} Δ
                  </div>
                </div>

                {/* Ground Truth Observation Marker if Available */}
                {step.observation !== undefined ? (
                  <div className="hairline-t pt-1.5 text-[10px] text-slate-400 flex justify-between">
                    <span>OBS:</span>
                    <strong className="text-emerald-400">{step.observation.toFixed(1)}{activeDef.unit}</strong>
                  </div>
                ) : (
                  <div className="hairline-t pt-1.5 text-[9px] text-slate-600 text-center uppercase">
                    Pending Valid
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. SCIENTIFIC EVENT VERIFICATION (CONFUSION MATRIX & PRECISION / RECALL / F1) */}
      <div className="p-6 rounded-lg border border-white/10 bg-[#0D0F15] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-b pb-4">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              HISTORICAL BENCHMARK VERIFICATION SUITE
            </div>
            <h3 className="text-xl font-bold text-white font-sans">
              Contingency Evaluation & Detection Reliability
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Evaluated across N = {verificationResult.sampleCount} time-aligned verified forecast/observation pairs.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            SPLIT: <strong className="text-white">Strict Chronological Test Benchmark</strong>
          </div>
        </div>

        {/* Verification Analytical Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Precision */}
          <div className="p-4 rounded border border-white/10 bg-black/40 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              PRECISION (PPV)
            </div>
            <div className="text-2xl font-bold text-white">
              {(verificationResult.precision * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              TP / (TP + FP) — Of events predicted, how many actually occurred?
            </div>
          </div>

          {/* Recall / POD */}
          <div className="p-4 rounded border border-white/10 bg-black/40 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              RECALL (POD)
            </div>
            <div className="text-2xl font-bold text-white">
              {(verificationResult.recall * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              TP / (TP + FN) — Of observed events, how many were detected?
            </div>
          </div>

          {/* F1 Score */}
          <div className="p-4 rounded border border-white/10 bg-black/40 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              F1 SCORE
            </div>
            <div className="text-2xl font-bold text-white">
              {verificationResult.f1.toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Harmonic mean of precision and recall.
            </div>
          </div>

          {/* Critical Success Index (CSI) */}
          <div className="p-4 rounded border border-white/10 bg-black/40 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              CRITICAL SUCCESS INDEX (CSI)
            </div>
            <div className="text-2xl font-bold text-white">
              {verificationResult.csi.toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              TP / (TP + FP + FN) — Standard meteorological threat score.
            </div>
          </div>
        </div>

        {/* 2x2 CONFUSION MATRIX & LEAD TIME BREAKDOWN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* A. 2x2 Contingency Confusion Matrix */}
          <div className="p-5 rounded border border-white/10 bg-black/40 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 hairline-b pb-3">
              <span className="font-bold text-white uppercase tracking-wider">
                2×2 EVENT CONTINGENCY MATRIX
              </span>
              <span>THRESHOLD: τ = {activeThreshold.toFixed(1)}{activeDef.unit}</span>
            </div>

            {/* Matrix Visual Grid */}
            <div className="space-y-3 font-mono text-xs">
              {/* Header Label: Observed */}
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

                {/* TN (Correct Negative) */}
                <div className="p-3 rounded border border-white/10 bg-[#0C0E14] text-center space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">TRUE NEGATIVE (TN)</div>
                  <div className="text-xl font-bold text-slate-200">{verificationResult.tn}</div>
                  <div className="text-[10px] text-slate-500">
                    {verificationResult.sampleCount > 0 ? ((verificationResult.tn / verificationResult.sampleCount) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                {/* FN (Miss) */}
                <div className="p-3 rounded border border-rose-500/30 bg-rose-500/10 text-center space-y-1">
                  <div className="text-[10px] text-rose-300 uppercase">MISS (FN)</div>
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

                {/* FP (False Alarm) */}
                <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10 text-center space-y-1">
                  <div className="text-[10px] text-amber-300 uppercase">FALSE ALARM (FP)</div>
                  <div className="text-xl font-bold text-amber-400">{verificationResult.fp}</div>
                  <div className="text-[10px] text-amber-300">
                    {verificationResult.sampleCount > 0 ? ((verificationResult.fp / verificationResult.sampleCount) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                {/* TP (Hit) */}
                <div className="p-3 rounded border border-emerald-500/40 bg-emerald-500/10 text-center space-y-1">
                  <div className="text-[10px] text-emerald-300 uppercase">HIT (TP)</div>
                  <div className="text-xl font-bold text-emerald-400">{verificationResult.tp}</div>
                  <div className="text-[10px] text-emerald-300">
                    {verificationResult.sampleCount > 0 ? ((verificationResult.tp / verificationResult.sampleCount) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Marginal Summary */}
            <div className="hairline-t pt-3 flex justify-between text-[11px] font-mono text-slate-400">
              <div>Total Predicted Events: <strong className="text-white">{verificationResult.tp + verificationResult.fp}</strong></div>
              <div>Total Observed Events: <strong className="text-white">{verificationResult.tp + verificationResult.fn}</strong></div>
            </div>
          </div>

          {/* B. Event Detection Performance by Lead Time */}
          <div className="p-5 rounded border border-white/10 bg-black/40 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 hairline-b pb-3">
              <span className="font-bold text-white uppercase tracking-wider">
                DETECTION SKILL BY LEAD TIME
              </span>
              <span>+6H TO +168H HORIZON</span>
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
                        {(lt.precision * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {(lt.recall * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 pl-2 text-right text-white font-bold">
                        {lt.f1.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] font-mono text-slate-500 leading-normal hairline-t pt-2">
              Note: Extreme event skill decays as lead time increases due to numerical dispersion and ensemble divergence at longer horizons.
            </p>
          </div>

        </div>

        {/* C. Performance by Weather Regime */}
        <div className="p-4 rounded border border-white/10 bg-black/40 space-y-3">
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
                      {(rg.precision * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">
                      {(rg.recall * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 pl-2 text-right text-white font-bold">
                      {rg.f1.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. CHRONOLOGICAL EVENT HISTORY & CASE INSPECTOR */}
      <div className="p-6 rounded-lg border border-white/10 bg-[#0D0F15] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 hairline-b pb-4">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              CHRONOLOGICAL EVENT LOG
            </div>
            <h3 className="text-lg font-bold text-white font-sans">
              Evaluated Significant Weather Events & Ground Outcomes
            </h3>
          </div>

          <div className="text-xs font-mono text-slate-400">
            SHOWING TOP {verificationResult.cases.length} EVALUATED CASES
          </div>
        </div>

        {/* Case List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="hairline-b text-[10px] text-slate-400 uppercase">
                <th className="py-2 pr-3">Timestamp</th>
                <th className="py-2 px-3">Lead</th>
                <th className="py-2 px-3">Synoptic Regime</th>
                <th className="py-2 px-3 text-right">Predicted (Blend)</th>
                <th className="py-2 px-3 text-right">Observed (Truth)</th>
                <th className="py-2 px-3 text-center">Consensus</th>
                <th className="py-2 px-3 text-center">Outcome</th>
                <th className="py-2 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {verificationResult.cases.map((c) => {
                const isSelected = inspectedCase?.id === c.id;

                let badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white/5 text-slate-400">CORRECT NEGATIVE</span>;
                if (c.classification === 'TRUE_POSITIVE') {
                  badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">HIT (TP)</span>;
                } else if (c.classification === 'FALSE_POSITIVE') {
                  badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">FALSE ALARM (FP)</span>;
                } else if (c.classification === 'FALSE_NEGATIVE') {
                  badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">MISS (FN)</span>;
                }

                return (
                  <tr 
                    key={c.id} 
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                    onClick={() => setInspectedCaseId(c.id)}
                  >
                    <td className="py-2.5 pr-3 text-slate-300">
                      {new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: '2-digit' })}{' '}
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-white font-semibold">
                      +{c.leadTimeHours}h
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {c.regime}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">
                      {c.predictedValue.toFixed(1)} {activeDef.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      {c.observedValue.toFixed(1)} {activeDef.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {c.consensusCount} / 4 systems
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {badge}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedCaseId(c.id);
                        }}
                        className="text-[10px] text-sky-400 hover:text-sky-300 uppercase font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Inspector of Selected Case */}
        {inspectedCase && (
          <div className="p-4 rounded border border-white/10 bg-black/60 space-y-3 font-mono text-xs hairline-t pt-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-white uppercase">CASE INSPECTOR: {inspectedCase.id}</span>
              <span>VALID TIME: {new Date(inspectedCase.timestamp).toUTCString()}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-2.5 rounded bg-white/5">
                <div className="text-[10px] text-slate-400">ECMWF 9km</div>
                <div className="text-sm font-bold text-white">{inspectedCase.ecmwfValue.toFixed(1)} {activeDef.unit}</div>
              </div>
              <div className="p-2.5 rounded bg-white/5">
                <div className="text-[10px] text-slate-400">GFS 13km</div>
                <div className="text-sm font-bold text-white">{inspectedCase.gfsValue.toFixed(1)} {activeDef.unit}</div>
              </div>
              <div className="p-2.5 rounded bg-white/5">
                <div className="text-[10px] text-slate-400">ICON 13km</div>
                <div className="text-sm font-bold text-white">{inspectedCase.iconValue.toFixed(1)} {activeDef.unit}</div>
              </div>
              <div className="p-2.5 rounded bg-white/5">
                <div className="text-[10px] text-slate-400">GraphCast AI</div>
                <div className="text-sm font-bold text-white">{inspectedCase.graphcastValue.toFixed(1)} {activeDef.unit}</div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 hairline-t pt-2">
              <div>
                Prediction Delta vs Observed Truth: <strong className="text-white">
                  {(inspectedCase.predictedValue - inspectedCase.observedValue).toFixed(2)} {activeDef.unit}
                </strong>
              </div>
              <div className="text-slate-300">
                Ground Outcome Status: <strong className="text-white">{inspectedCase.classification}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. CROSS-SECTION ACTION LINKS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-white/10 bg-[#0D0F15] font-mono text-xs">
        <div>
          <div className="text-white font-bold">INTEGRATED METEOROLOGICAL PIPELINE</div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Extreme event signals are directly derived from the contextual blending engine and verified against the SYNOP benchmark.
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('blending')}
                className="px-3.5 py-2 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <span>INSPECT BLENDING WEIGHTS</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('verification')}
                className="px-3.5 py-2 rounded bg-white text-black hover:bg-slate-200 font-bold flex items-center space-x-1.5 transition-colors"
              >
                <span>VIEW VERIFICATION LAB</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
