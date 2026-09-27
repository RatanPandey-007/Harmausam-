/**
 * Blending Types & Domain Contracts
 * Harmausam Meteorological Intelligence Platform — Phase 4
 */

import { ForecastSourceId, WeatherVariable, WeatherRegime, StationLocation } from '../types';
import { FallbackHierarchyLevel, SkillRecord } from '../skill/historicalSkill';
import { BlendingContext } from '../context/contextEngine';

export interface SourceWeightDetail {
  sourceId: ForecastSourceId;
  weight: number; // [0.0, 1.0], sum = 1.0
  percentage: number; // 0-100%
  historicalMae: number;
  historicalRmse: number;
  sampleCount: number;
  confidence: number; // 0.0 - 1.0
  activePenalty: number;
  reasons: string[];
}

export interface AdaptiveWeightResult {
  weights: Record<ForecastSourceId, SourceWeightDetail>;
  hierarchyLevel: FallbackHierarchyLevel;
  effectiveSampleCount: number;
  activeRegime: WeatherRegime;
  leadTimeHours: number;
  explanation: string;
  isFallback: boolean;
}

export interface FixedWeightResult {
  weights: Record<ForecastSourceId, number>;
  trainingWindow: {
    startDate: string;
    endDate: string;
    sampleSize: number;
  };
  regularization: string;
  isRenormalized: boolean;
}

export interface BlendedForecastOutput {
  variable: WeatherVariable;
  timestamp: string;
  leadTimeHours: number;
  station: StationLocation;
  context: BlendingContext;

  // 4 Research Baselines
  individualForecasts: Record<ForecastSourceId, number | null>;
  equalWeightForecast: number | null;
  fixedWeightForecast: number | null;
  adaptiveBlendedForecast: number | null;

  // Weight allocations
  equalWeights: Record<ForecastSourceId, number>;
  fixedWeights: Record<ForecastSourceId, number>;
  adaptiveWeights: Record<ForecastSourceId, SourceWeightDetail>;

  // Metadata & Fallback Tracking
  hierarchyLevel: FallbackHierarchyLevel;
  effectiveSampleCount: number;
  explanation: string;

  // Uncertainty & Disagreement
  modelSpread: number;
  uncertaintyInterval: {
    lower90: number;
    upper90: number;
    stdDev: number;
  };
  confidenceIndicator: number; // 0-100%
  confidenceTier: 'High' | 'Moderate' | 'Low';

  // Ground Truth Verification (if verified test observation is available)
  observationValue?: number | null;
  baselineErrors?: {
    ecmwfError?: number | null;
    gfsError?: number | null;
    iconError?: number | null;
    graphcastError?: number | null;
    equalWeightError?: number | null;
    fixedWeightError?: number | null;
    adaptiveError?: number | null;
  };

  // Phase 5 Disagreement & Uncertainty Diagnostics
  disagreement?: import('../uncertainty/types').ModelDisagreement;
  uncertaintyProxy?: import('../uncertainty/types').UncertaintyProxy;
  uncertaintyExplanation?: import('../uncertainty/types').UncertaintyExplanation;
}

