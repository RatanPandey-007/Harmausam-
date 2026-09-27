/**
 * Extreme-Event Detection & Evaluation Domain Types
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Implements strict, scientifically honest typing for:
 * - Configurable event definitions with transparent prototype provenance
 * - Forecast event detection across NWP models and blended baselines
 * - Observation event detection (strictly null-safe, zero fake substitution)
 * - Temporal event grouping and duration calculation
 * - Spatiotemporal event matching
 * - Rigorous contingency classification (TP, FP, FN, TN)
 * - Safe zero-denominator metric representations (Precision, Recall, F1)
 * - Evidence-based multi-source consensus with Phase 5 dispersion
 */

import { ForecastSourceId, WeatherVariable, StationLocation } from '../types';

export type ExtremeEventCategory =
  | 'extreme_temperature_high'
  | 'extreme_temperature_low'
  | 'heavy_precipitation'
  | 'extreme_wind';

export type EvaluationMethodId =
  | ForecastSourceId
  | 'EQUAL_WEIGHT'
  | 'FIXED_WEIGHT'
  | 'ADAPTIVE_BLEND';

export type EventStatus =
  | 'MONITOR'
  | 'DEVELOPING'
  | 'DETECTED'
  | 'CONFIRMED'
  | 'ENDED'
  | 'DETECTED_OBS_PENDING';

export type ContingencyClassification =
  | 'TRUE_POSITIVE'
  | 'FALSE_POSITIVE'
  | 'FALSE_NEGATIVE'
  | 'TRUE_NEGATIVE';

/** Centralized, configurable extreme event definition */
export interface ExtremeEventDefinition {
  eventType: string; // e.g. "Heatwave", "Heavy rainfall", "High wind", "Extreme Cold"
  category: ExtremeEventCategory;
  variable: WeatherVariable;
  threshold: number;
  unit: string;
  operator: '>=' | '<=';
  minimumDurationHours: number; // Configurable duration threshold (hours)
  source: string; // e.g. "Prototype threshold"
  description: string;
  wmoStandardReference?: string;
}

/** Individual forecast event detection result at a specific timestep */
export interface DetectedForecastEvent {
  sourceId: EvaluationMethodId;
  forecastInitialization: string; // ISO-8601 UTC
  validTime: string; // ISO-8601 UTC
  leadTimeHours: number;
  station: StationLocation;
  variable: WeatherVariable;
  value: number;
  threshold: number;
  eventType: string;
  eventDetected: boolean;
  deltaAboveThreshold: number;
}

/** Observation event detection result at a specific timestamp */
export interface DetectedObservationEvent {
  observationTimestamp: string; // ISO-8601 UTC
  station: StationLocation;
  variable: WeatherVariable;
  observedValue: number | null;
  threshold: number;
  eventType: string;
  eventDetected: boolean | null; // null if observation is unavailable
  observationSource: string;
  verificationStatus: 'AVAILABLE' | 'UNAVAILABLE';
  unavailabilityReason?: string;
}

/** Coherent grouped event over consecutive timesteps */
export interface GroupedEvent {
  eventId: string;
  eventType: string;
  method: EvaluationMethodId | 'OBSERVATION';
  station: StationLocation;
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
  durationHours: number | null;
  durationStatus: 'CALCULATED' | 'UNAVAILABLE_RESOLUTION';
  peakValue: number;
  threshold: number;
  leadTimeHours: number;
  status: EventStatus;
  timestepCount: number;
  severityRisk: 'Information' | 'Watch' | 'Elevated Risk' | 'High Risk';
}

/** Paired forecast vs observed event match */
export interface MatchedEventPair {
  forecastEventId: string;
  observedEventId: string | null;
  forecastMethod: EvaluationMethodId;
  station: StationLocation;
  eventType: string;
  leadTimeHours: number;
  validTime: string;
  predictedValue: number;
  observedValue: number | null;
  threshold: number;
  matchStatus: 'MATCHED' | 'UNMATCHED';
  timeDifferenceHours: number | null;
  classification: ContingencyClassification;
  observationAvailable: boolean;
}

/** 2x2 Contingency table counts */
export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  sampleCount: number;
}

/**
 * Standard contingency metrics.
 * Uses `number | null` so zero denominators safely resolve to `null` / "Not available",
 * avoiding misleading 0% or NaN values.
 */
export interface ContingencyMetrics {
  precision: number | null; // TP / (TP + FP)
  recall: number | null; // TP / (TP + FN) - Probability of Detection (POD)
  f1: number | null; // 2 * P * R / (P + R)
  threatScore: number | null; // CSI: TP / (TP + FP + FN)
  falseAlarmRatio: number | null; // FAR: FP / (TP + FP)
  sampleCount: number;
  evaluationStart: string; // ISO-8601 UTC
  evaluationEnd: string; // ISO-8601 UTC
  isAvailable: boolean;
  dataLimitationNote?: string;
}

/** Metrics stratified across discrete forecast horizons */
export interface EventLeadTimeMetrics {
  leadTimeHours: number;
  confusionMatrix: ConfusionMatrix;
  metrics: ContingencyMetrics;
}

/** Multi-source consensus evidence for an event */
export interface MultiSourceEventConsensus {
  totalSources: number;
  supportingSourceCount: number;
  sourceValues: Record<ForecastSourceId, number | null>;
  sourceExceedance: Record<ForecastSourceId, boolean>;
  adaptiveWeights: Record<ForecastSourceId, number>;
  modelSpread: number | null; // Phase 5 dispersion sigma
  blendValue: number;
  threshold: number;
  consensusRatio: number; // e.g. 0.75 for 3/4
  evidenceSummary: string; // e.g. "3 of 3 forecast sources exceed the configured threshold."
}

/** Complete multi-method event evaluation output */
export interface MethodEventEvaluation {
  method: EvaluationMethodId;
  label: string;
  confusionMatrix: ConfusionMatrix;
  metrics: ContingencyMetrics;
  byLeadTime: EventLeadTimeMetrics[];
}
