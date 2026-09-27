import React, { useState } from 'react';
import { 
  StationLocation, 
  WeatherVariable, 
  BlendedForecastResult 
} from '../../core/types';
import { ActiveTab } from '../layout/Navbar';
import { MethodologyHeader } from './MethodologyHeader';
import { ScrollRevealText } from '../ui/scroll-reveal-text';
import { MainMethodologyPipeline } from './MainMethodologyPipeline';
import { PipelineStageCards } from './PipelineStageCards';
import { ClosedLearningLoop } from './ClosedLearningLoop';
import { BaselineComparison } from './BaselineComparison';
import { ScientificIntegrityRules } from './ScientificIntegrityRules';
import { DataToDecisionTrace } from './DataToDecisionTrace';
import { MethodologyNavigation } from './MethodologyNavigation';

export interface MethodologySectionProps {
  station: StationLocation;
  selectedVariable: WeatherVariable;
  currentResult: BlendedForecastResult;
  isDemonstrationData: boolean;
  onNavigate?: (tab: ActiveTab) => void;
}

export const MethodologySection: React.FC<MethodologySectionProps> = ({
  station,
  selectedVariable,
  currentResult,
  isDemonstrationData,
  onNavigate,
}) => {
  const [activeStageId, setActiveStageId] = useState<string>('stage-01');

  return (
    <div className="space-y-12 py-2 select-none">
      
      {/* 1. Header with 30-second executive summary & status legend (Section 3 & 20) */}
      <MethodologyHeader 
        isDemonstrationData={isDemonstrationData}
      />

      {/* Editorial Scroll-Driven Scientific Thesis Statement */}
      <ScrollRevealText
        label="CORE METEOROLOGICAL THESIS"
        subtext="Harmausam dynamically aligns physics-based NWP systems and deep autoregressive models, optimizing trust based on active weather regimes."
      >
        Forecasting the atmosphere is not about trusting a single model. It is about understanding when each source deserves more trust.
      </ScrollRevealText>

      {/* 2. Interactive 10-Stage Centerpiece Pipeline (Section 4) */}
      <MainMethodologyPipeline 
        activeStageId={activeStageId}
        onSelectStage={setActiveStageId}
      />

      {/* 3. Detailed Stage Breakdown Cards (Sections 5 to 14) */}
      <PipelineStageCards 
        activeStageId={activeStageId}
      />

      {/* 4. The Closed Learning Loop (Section 15) */}
      <ClosedLearningLoop />

      {/* 5. 4-Tier Baseline Benchmark Comparison (Section 16) */}
      <BaselineComparison 
        onNavigate={onNavigate}
      />

      {/* 6. Scientific Integrity Tenets: What Harmausam does NOT assume (Section 17) */}
      <ScientificIntegrityRules />

      {/* 7. End-to-End Data to Decision Provenance Chain (Section 18) */}
      <DataToDecisionTrace />

      {/* 8. Cross-Section Operational Navigation (Section 19) */}
      <MethodologyNavigation 
        onNavigate={onNavigate}
      />

    </div>
  );
};
