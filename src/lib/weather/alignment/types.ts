/**
 * Centralized Weather Data Architecture — Data Alignment & QC Types
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements domain models for:
 * - Deterministic multi-model time & lead-time alignment
 * - Comprehensive Quality Control (QC) classifications
 * - Empirical observation pairing (strictly isolated from forecast initialization)
 * - Complete data provenance, completeness diagnostics, and missing value tracking
 */

import {
  ForecastSourceId,
  WeatherVariable,
  Observation,
} from '../types';

/**
 * Quality control classification category for individual records
 */
export type QCClassification =
  | 'VALID'       // Passed all physical limits, unit, and chronological checks
  | 'MISSING'     // Explicitly absent or null in provider stream (preserved as null)
  | 'INVALID'     // Physically impossible (e.g. T > 60°C, P < 0 mm, Wind < 0 m/s)
  | 'DUPLICATE'   // Exact duplicate record identified for same source, valid time, and lead
  | 'SUSPICIOUS'; // Rate-of-change spike or conflicting duplicate values flagged for review

/**
 * Detailed QC diagnostic inspection record
 */
export interface QCInspection {
  status: QCClassification;
  flags: string[];
  reasons: string[];
  originalValue?: number | null;
  normalizedValue?: number | null;
  unit: string;
}

/**
 * Synchronized multi-model state at a single common valid time and lead horizon
 */
export interface AlignedTimestep {
  validTime: string; // Canonical ISO-8601 UTC timestamp
  leadTimeHours: number; // Discrete lead time bucket (validTime - initTime)
  values: Record<ForecastSourceId, number | null>; // Missing sources stored strictly as null
  qc: Record<ForecastSourceId, QCInspection>;
  observedTruth: Observation | null; // Empirical verified ground truth (never filled with forecast)
  modelSpread?: number; // Standard deviation across available valid models
}

/**
 * Quantitative data completeness metrics per forecast source
 */
export interface SourceCompleteness {
  sourceId: ForecastSourceId;
  expectedCount: number;
  receivedCount: number;
  validCount: number;
  missingCount: number;
  duplicateCount: number;
  invalidCount: number;
  suspiciousCount: number;
  completenessPct: number; // Derived strictly from actual data: (validCount / expectedCount) * 100
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'ERROR';
}

/**
 * Diagnostic alignment summary for downstream explainability and system monitoring
 */
export interface AlignmentDiagnostic {
  sourceId: ForecastSourceId;
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'ERROR';
  alignmentPct: number;
  missingTimestampsCount: number;
  missingTimestamps: string[];
  latencyMs?: number;
}

/**
 * Fully aligned, quality-controlled multi-model dataset ready for downstream intelligence
 */
export interface AlignmentResult {
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  unit: string;
  commonTimestamps: string[]; // Timestamps available across all active forecast sources
  commonLeadTimes: number[]; // Discrete lead horizons (+0h, +6h, +12h, +24h, ...)
  timesteps: AlignedTimestep[];
  missingSourcesByTimestamp: Record<string, ForecastSourceId[]>;
  completeness: Record<ForecastSourceId, SourceCompleteness>;
  diagnostics: Record<ForecastSourceId, AlignmentDiagnostic>;
  alignedAt: string; // ISO-8601 UTC timestamp of alignment execution
}

/**
 * Query options for executing multi-model data alignment
 */
export interface AlignmentPipelineOptions {
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  targetLeadTimes?: number[];
  toleranceDeltaDegrees?: number; // Spatial alignment tolerance (default: 0.2°)
  signal?: AbortSignal;
}
