import React from 'react';
import { 
  StationLocation, 
  WeatherVariable, 
  BlendedForecastResult, 
  ExplanationBreakdown, 
  VerificationComparison, 
  ProviderHealthStatus 
} from '../../core/types';
import { ActiveTab } from '../layout/Navbar';
import { DiagnosticHeader } from './DiagnosticHeader';
import { DiagnosticSummary } from './DiagnosticSummary';
import { DiagnosticFlowPipeline } from './DiagnosticFlowPipeline';
import { WhyTheseWeights } from './WhyTheseWeights';
import { ContextFactors } from './ContextFactors';
import { ModelDisagreementPanel } from './ModelDisagreementPanel';
import { CausalExplainabilityTimeline } from './CausalExplainabilityTimeline';
import { ReliabilityTrendChart } from './ReliabilityTrendChart';
import { DriftAndQualityMonitor } from './DriftAndQualityMonitor';
import { CrossSectionNavigation } from './CrossSectionNavigation';

export interface ExplainabilityStudioProps {
  currentResult: BlendedForecastResult;
  timeSeriesTrajectory?: BlendedForecastResult[];
  verification?: VerificationComparison;
  providerHealth?: ProviderHealthStatus[];
  explanation: ExplanationBreakdown;
  station: StationLocation;
  setStation: (station: StationLocation) => void;
  selectedVariable: WeatherVariable;
  setSelectedVariable: (v: WeatherVariable) => void;
  leadTimeHours: number;
  setLeadTimeHours: (h: number) => void;
  isDemonstrationData: boolean;
  onNavigate?: (tab: ActiveTab) => void;
}

export const ExplainabilityStudio: React.FC<ExplainabilityStudioProps> = ({
  currentResult,
  verification,
  providerHealth,
  explanation,
  station,
  setStation,
  selectedVariable,
  setSelectedVariable,
  leadTimeHours,
  setLeadTimeHours,
  isDemonstrationData,
  onNavigate,
}) => {
  return (
    <div className="space-y-10 py-2 select-none">
      
      {/* 1. Page Header & Operational Status (Section 3) */}
      <DiagnosticHeader
        isDemonstrationData={isDemonstrationData}
      />

      {/* 2. Diagnostic Summary & Operational Filter Toolbar (Section 4 & 16) */}
      <DiagnosticSummary
        station={station}
        setStation={setStation}
        selectedVariable={selectedVariable}
        setSelectedVariable={setSelectedVariable}
        leadTimeHours={leadTimeHours}
        setLeadTimeHours={setLeadTimeHours}
        currentResult={currentResult}
      />

      {/* 3. Diagnostic Flow Pipeline (Section 15) */}
      <DiagnosticFlowPipeline />

      {/* 4. "Why These Weights?" Section (Section 5 & 6) */}
      <WhyTheseWeights
        weights={currentResult.adaptiveWeights}
        context={currentResult.context}
        selectedVariable={selectedVariable}
        isDemonstrationData={isDemonstrationData}
      />

      {/* 5. Context Used By The Blender (Section 7) */}
      <ContextFactors
        station={station}
        context={currentResult.context}
      />

      {/* 6. Model Disagreement & Forecast Uncertainty Panels (Section 8 & 9) */}
      <ModelDisagreementPanel
        currentResult={currentResult}
        selectedVariable={selectedVariable}
        isDemonstrationData={isDemonstrationData}
      />

      {/* 7. "What Changed The Forecast?" Causal Sequence & Counterfactual Simulator (Section 14) */}
      <CausalExplainabilityTimeline
        context={currentResult.context}
        weights={currentResult.adaptiveWeights}
        individualForecasts={currentResult.individualForecasts}
        explanation={explanation}
        isDemonstrationData={isDemonstrationData}
      />

      {/* 8. Source Reliability Over Time Line Chart (Section 10) */}
      <ReliabilityTrendChart
        selectedVariable={selectedVariable}
        verification={verification}
        isDemonstrationData={isDemonstrationData}
      />

      {/* 9. Forecast Drift, Data Quality & Source Health Monitors (Section 11, 12, 13) */}
      <DriftAndQualityMonitor
        providerHealth={providerHealth}
        isDemonstrationData={isDemonstrationData}
      />

      {/* 10. Cross-Section Operational Navigation (Section 17) */}
      <CrossSectionNavigation
        onNavigate={onNavigate}
      />

    </div>
  );
};
