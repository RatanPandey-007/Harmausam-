import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Layers, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  ExtremeEventAlert, 
  StationLocation, 
  BlendedForecastResult,
  VerificationComparison,
  WeatherVariable
} from '../../core/types';
import { ActiveTab } from '../layout/Navbar';
import { 
  ExtremeEventEngine, 
  EVENT_THRESHOLDS, 
  EventThresholdDefinition 
} from '../../core/events/ExtremeEventEngine';
import { ExtremeEventMap } from './ExtremeEventMap';
import { EventCommandHeader } from './EventCommandHeader';
import { EventThresholdControls } from './EventThresholdControls';
import { EventDossierPanel } from './EventDossierPanel';
import { EventConsensusTable } from './EventConsensusTable';
import { EventTimelineRail } from './EventTimelineRail';
import { EventContingencyMatrix } from './EventContingencyMatrix';
import { EventCaseInspector } from './EventCaseInspector';
import { PrismaHero } from '@/components/ui/prisma-hero';

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
  alerts: _alerts,
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

  // Configurable Thresholds State
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

  // Current primary step at peak or +48h
  const primaryStep = useMemo(() => {
    return timeSeriesTrajectory.find(t => t.leadTimeHours === trajectoryAnalysis.peakLeadTimeHours) ||
      timeSeriesTrajectory.find(t => t.leadTimeHours === 48) ||
      timeSeriesTrajectory[0] || {
        timestamp: new Date().toISOString(),
        leadTimeHours: 48,
        adaptiveBlendedForecast: 0,
        equalWeightForecast: 0,
        individualForecasts: { ECMWF: 0, GFS: 0, ICON: 0, GRAPHCAST: 0 },
        adaptiveWeights: {
          ECMWF: { sourceId: 'ECMWF', weight: 0.35, recentSkillScore: 0.8 },
          GFS: { sourceId: 'GFS', weight: 0.25, recentSkillScore: 0.75 },
          ICON: { sourceId: 'ICON', weight: 0.25, recentSkillScore: 0.75 },
          GRAPHCAST: { sourceId: 'GRAPHCAST', weight: 0.15, recentSkillScore: 0.7 }
        },
        modelSpread: 1.5,
        context: {
          stationId: station.id,
          regionType: 'Plains',
          season: 'Monsoon',
          leadTimeHours: 48,
          detectedRegime: 'Convective Monsoon',
          variable: activeDef.variable
        }
      };
  }, [timeSeriesTrajectory, trajectoryAnalysis.peakLeadTimeHours, station.id, activeDef.variable]);

  return (
    <div className="space-y-10 py-2 select-none">
      
      {/* 0. Cinematic PrismaHero Section */}
      <PrismaHero
        onSelectCategory={(cat) => {
          setSelectedEventType(cat);
          const def = EVENT_THRESHOLDS.find(d => d.eventType === cat);
          if (def && setSelectedVariable) {
            setSelectedVariable(def.variable);
          }
        }}
      />

      {/* Primary Operational Research & Monitoring Console */}
      <div id="event-monitoring-console" className="space-y-10 pt-2">
        {/* 1. Operational Command Header */}
        <EventCommandHeader
        station={station}
        isDemonstrationData={isDemonstrationData}
        selectedEventType={selectedEventType}
        severityRisk={trajectoryAnalysis.severityRisk}
        status={trajectoryAnalysis.status}
      />

      {/* 2. Tactical Threshold & Duration Persistence Controls */}
      <EventThresholdControls
        selectedEventType={selectedEventType}
        onSelectEventType={setSelectedEventType}
        activeDef={activeDef}
        activeThreshold={activeThreshold}
        onSelectThreshold={(val) => {
          setThresholdsByEvent(prev => ({ ...prev, [selectedEventType]: val }));
        }}
        durationPeriods={durationPeriods}
        onChangeDuration={setDurationPeriods}
        onSetVariable={setSelectedVariable}
        stationCode={station.id}
      />

      {/* 3. Meteorological Event Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="uppercase tracking-widest text-[10px] font-semibold">GEOSPATIAL EVENT OBSERVATION MATRIX</span>
          </div>
          <span className="text-[11px] text-slate-500">CLICK ANY PIN TO FOCUS STATION DOSSIER</span>
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

      {/* 4. Active Selected Event Dossier & Multi-Model Consensus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EventDossierPanel
          selectedEventType={selectedEventType}
          severityRisk={trajectoryAnalysis.severityRisk}
          status={trajectoryAnalysis.status}
          station={station}
          peakLeadTimeHours={trajectoryAnalysis.peakLeadTimeHours}
          activeThreshold={activeThreshold}
          activeDef={activeDef}
          peakValue={trajectoryAnalysis.peakValue}
          durationExceededCount={trajectoryAnalysis.durationExceededCount}
          requiredPeriods={durationPeriods}
        />

        <div className="lg:col-span-2">
          <EventConsensusTable
            primaryStep={primaryStep}
            peakLeadTimeHours={trajectoryAnalysis.peakLeadTimeHours}
            activeDef={activeDef}
            activeThreshold={activeThreshold}
            selectedEventType={selectedEventType}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* 5. Horizontal Event Threat Evolution Timeline */}
      <EventTimelineRail
        timeline={trajectoryAnalysis.timeline}
        peakLeadTimeHours={trajectoryAnalysis.peakLeadTimeHours}
        activeThreshold={activeThreshold}
        activeDef={activeDef}
      />

      {/* Data Limitation Notice Banner (Section 27) */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-black/40 text-xs font-mono text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400/80" />
          <span>DATA INTEGRITY NOTICE: Event verification is limited by observation availability.</span>
        </div>
        <span className="text-[11px] text-slate-500">
          {verificationResult.sampleCount < 10 
            ? 'Insufficient historical events for reliable Precision/Recall/F1.' 
            : `Verified across N=${verificationResult.sampleCount} ground observations.`}
        </span>
      </div>

      {/* 6. Scientific Event Verification (2x2 Matrix & Skill Tables) */}
      <EventContingencyMatrix
        verificationResult={verificationResult}
        activeThreshold={activeThreshold}
        activeDef={activeDef}
      />

      {/* 7. Chronological Event History & Case Inspector */}
      <EventCaseInspector
        cases={verificationResult.cases}
        inspectedCase={inspectedCase}
        onSelectCase={setInspectedCaseId}
        activeDef={activeDef}
      />

      {/* 8. Cross-Section Action Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-white/10 bg-[#0D0F15] font-mono text-xs">
        <div>
          <div className="text-white font-bold tracking-wide">INTEGRATED METEOROLOGICAL PIPELINE</div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Extreme event warning signals are derived from the contextual blending engine and verified against the SYNOP benchmark.
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('blending')}
                className="px-3.5 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <span>INSPECT BLENDING WEIGHTS</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('verification')}
                className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-slate-200 font-bold flex items-center space-x-1.5 transition-colors"
              >
                <span>VIEW VERIFICATION LAB</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      </div>
    </div>
  );
};
