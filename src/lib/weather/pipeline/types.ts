/**
 * Research Pipeline Domain Types & Interfaces
 * Harmausam Meteorological Intelligence Platform — Phase 7 (Final Phase)
 *
 * Defines rigorous data contracts for:
 * - End-to-end research pipeline configuration
 * - Fair baseline comparison results on common evaluation cohorts
 * - Lead-time and context-stratified evaluations
 * - Transparent scientific audits (weights, uncertainty, extreme events, leakage)
 * - Traceable provenance, data quality telemetry, and operational status
 */

import {
  ForecastSourceId,
  WeatherVariable,
  StationLocation,
} from '../types';
import {
  ExtremeEventDefinition,
  MatchedEventPair,
  MethodEventEvaluation,
} from '../events/types';
import { ModelDisagreement, UncertaintyProxy } from '../uncertainty/types';
import { BlendedForecastOutput } from '../blending/types';

export type BaselineMethodId =
  | 'ECMWF'
  | 'GFS'
  | 'ICON'
  | 'EQUAL_WEIGHT'
  | 'FIXED_WEIGHT'
  | 'ADAPTIVE_BLEND';

export interface DataPeriodBoundary {
  start: string; // ISO 8601 string
  end: string;   // ISO 8601 string
}

export interface ResearchPipelineConfig {
  runId?: string;
  station: StationLocation;
  variable: WeatherVariable;
  leadTimesHours: number[];
  useLiveData: boolean;
  trainingPeriod: DataPeriodBoundary;
  validationPeriod: DataPeriodBoundary;
  evaluationPeriod: DataPeriodBoundary;
  extremeEventTypes: string[];
  customThresholds?: Record<string, number>;
  minSampleSize: number;
  eventMatchingWindowHours: number;
}

export interface BaselineMetricRecord {
  method: BaselineMethodId;
  methodLabel: string;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  sampleCount: number;
  validSampleCount: number;
  excludedSampleCount: number;
  exclusionReasons: string[];
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
}

export interface ExtremeEventMetricRecord {
  method: BaselineMethodId;
  methodLabel: string;
  eventType: string;
  threshold: number;
  unit: string;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number | null; // null if TP + FP === 0
  recall: number | null;    // null if TP + FN === 0
  f1: number | null;        // null if precision === null || recall === null || precision + recall === 0
  threatScore: number | null; // CSI: TP / (TP + FP + FN), null if denom === 0
  eventCount: number;
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
}

export interface LeadTimePerformanceRecord {
  leadTimeHours: number;
  sampleCount: number;
  methods: Record<
    BaselineMethodId,
    {
      mae: number | null;
      rmse: number | null;
      bias: number | null;
      sampleCount: number;
    }
  >;
}

export interface ContextPerformanceRecord {
  dimension: 'region' | 'season' | 'leadTime' | 'regime';
  category: string;
  sampleCount: number;
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA';
  methods?: Record<
    BaselineMethodId,
    {
      mae: number | null;
      rmse: number | null;
      bias: number | null;
    }
  >;
}

export interface DataQualityReport {
  sourceAvailability: Record<ForecastSourceId, 'AVAILABLE' | 'UNAVAILABLE' | 'DEMO'>;
  totalForecastRecords: number;
  missingRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  alignedRecords: number;
  observationCount: number;
  observationAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL';
  forecastCoveragePercent: number;
  leadTimeCoverageHours: number[];
  notes: string[];
}

export interface WeightAuditSummary {
  passed: boolean;
  sumCheckPassed: boolean;
  nonNegativePassed: boolean;
  auditedCount: number;
  violations: string[];
}

export interface UncertaintyAuditSummary {
  passed: boolean;
  noFakeProbabilities: boolean;
  empiricalScaleUsed: boolean;
  validSpreadCount: number;
  violations: string[];
}

export interface ExtremeEventAuditSummary {
  passed: boolean;
  zeroDenominatorSafe: boolean;
  matchingValid: boolean;
  auditedCount: number;
  violations: string[];
}

export interface LeakageAuditSummary {
  passed: boolean;
  strictSeparation: boolean;
  trainingEvaluationDisjoint: boolean;
  violations: string[];
}

export interface AuditReport {
  weightsAudit: WeightAuditSummary;
  uncertaintyAudit: UncertaintyAuditSummary;
  extremeEventAudit: ExtremeEventAuditSummary;
  leakageAudit: LeakageAuditSummary;
  overallStatus: 'AUDIT_PASSED' | 'AUDIT_FAILED';
}

export interface ImplementationStatus {
  dataIngestion: 'LIVE' | 'DEMO';
  alignment: 'LIVE';
  qualityControl: 'LIVE';
  historicalSkill: 'LIVE' | 'INSUFFICIENT_DATA';
  adaptiveBlending: 'LIVE' | 'INSUFFICIENT_DATA';
  uncertainty: 'LIVE / PROXY / INSUFFICIENT DATA';
  extremeEvents: 'LIVE / INSUFFICIENT DATA';
  verification: 'LIVE / INSUFFICIENT DATA';
  automation: 'LIVE';
  graphCast: 'DEMO / SURROGATE / NOT_CONNECTED';
}

export interface ResearchProvenance {
  pipelineVersion: string;
  runId: string;
  executionTimestamp: string;
  station: StationLocation;
  variable: WeatherVariable;
  trainingPeriod: DataPeriodBoundary;
  validationPeriod: DataPeriodBoundary;
  evaluationPeriod: DataPeriodBoundary;
  sources: Array<{
    sourceId: ForecastSourceId;
    model: string;
    status: string;
    provider: string;
  }>;
  observations: {
    source: string;
    status: string;
    temporalCoverage: string;
  };
  methodConfiguration: {
    weighting: string;
    adaptiveParameters: {
      temperature: number;
      learningRate: number;
      windowDays: number;
    };
    eventMatchingWindowHours: number;
  };
}

export interface FinalResearchEvaluation {
  runId: string;
  generatedAt: string;
  config: ResearchPipelineConfig;
  dataCoverage: {
    trainingPeriod: DataPeriodBoundary;
    validationPeriod: DataPeriodBoundary;
    evaluationPeriod: DataPeriodBoundary;
    forecastSources: ForecastSourceId[];
    observationSource: string;
    variables: WeatherVariable[];
    stations: StationLocation[];
  };
  dataQuality: DataQualityReport;
  auditReport: AuditReport;
  baselineResults: BaselineMetricRecord[];
  adaptiveResults: {
    metrics: BaselineMetricRecord;
    averageWeights: Record<ForecastSourceId, number>;
    fallbackDistribution: Record<string, number>;
    activeContextSummary: string;
  };
  uncertaintyResults: {
    averageSpread: number | null;
    maxSpread: number | null;
    highDisagreementSteps: number;
    methodologyNote: string;
  };
  extremeEventResults: ExtremeEventMetricRecord[];
  leadTimeResults: LeadTimePerformanceRecord[];
  contextResults: ContextPerformanceRecord[];
  provenance: ResearchProvenance;
  limitations: string[];
  implementationStatus: ImplementationStatus;
  success: boolean;
}

export type ResearchPipelineResult = FinalResearchEvaluation;
