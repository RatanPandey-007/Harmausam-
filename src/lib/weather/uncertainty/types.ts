/**
 * Model Disagreement & Uncertainty Diagnostics — Types & Contracts
 * Harmausam Meteorological Intelligence Platform — Phase 5
 *
 * Implements domain models for:
 * 1. Multi-model consensus & forecast dispersion (spread, standard deviation)
 * 2. Context-indexed historical disagreement distributions
 * 3. Conservative, non-misleading uncertainty proxies (distinguished from predictive certainty)
 * 4. Factual "Why is this forecast uncertain?" explanations
 * 5. Spread-vs-error verification telemetry
 */

import { ForecastSourceId, WeatherVariable, WeatherRegime, Season, StationLocation } from '../types';

export type DisagreementClassification = 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' | 'UNKNOWN';

export type DisagreementStatus =
  | 'COMPUTED'
  | 'UNAVAILABLE_SINGLE_SOURCE'
  | 'UNAVAILABLE_NO_DATA';

/**
 * Multi-model disagreement & forecast dispersion evaluation at a single timestep
 */
export interface ModelDisagreement {
  timestamp: string; // ISO-8601 UTC target valid time
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  leadTimeHours: number;

  // Quantitative dispersion metrics (computed strictly over valid sources)
  validSourceCount: number;
  mean: number | null;
  minimum: number | null;
  maximum: number | null;
  range: number | null; // max - min
  standardDeviation: number | null; // sample standard deviation sigma

  // Source-level resolution
  sourceValues: Record<ForecastSourceId, number | null>;
  sourceMetadata: Record<
    ForecastSourceId,
    { name: string; institution: string; isDemonstration: boolean }
  >;

  // Contextual classification vs historical baseline
  disagreementLevel: DisagreementClassification;
  classificationReason: string;
  status: DisagreementStatus;

  // Lineage & Provenance
  provenance: {
    calculationMethod: string;
    sampleSizeUsed: number;
    timestampComputed: string;
  };
}

/**
 * Historical spread distribution baseline across context dimensions
 */
export interface HistoricalDisagreement {
  variable: WeatherVariable;
  region: string;
  season: Season;
  leadTimeHours: number;
  weatherRegime: WeatherRegime;

  meanSpread: number;
  medianSpread: number;
  spreadStdDev: number;
  sampleCount: number;

  trainingStart: string;
  trainingEnd: string;
  provenance: string;
}

/**
 * Conservative uncertainty proxy (explicitly not a calibrated probability or confidence interval)
 */
export interface UncertaintyProxy {
  centerValue: number; // Blended point estimate
  proxyBounds: [number, number]; // [lower, upper] empirical error bounds
  errorScale: number; // Scale metric (e.g. contextual MAE or RMSE)
  scaleType: 'CONTEXTUAL_HISTORICAL_MAE' | 'CONTEXTUAL_HISTORICAL_RMSE' | 'MODEL_SPREAD_PROXY';
  methodologyNote: string;
  isCalibratedProbability: false; // Explicit declaration that this is NOT a Gaussian confidence interval
}

/**
 * Factual diagnostic explanation ("Why is this forecast uncertain?")
 */
export interface UncertaintyExplanation {
  primaryFactor: string;
  supportingEvidence: string[];
  context: {
    region: string;
    season: Season;
    leadTimeHours: number;
    weatherRegime: WeatherRegime;
  };
  sourceSpread: number | null;
  historicalComparison: {
    status: DisagreementClassification;
    currentSpread: number | null;
    historicalMeanSpread: number | null;
    historicalMedianSpread: number | null;
    sampleCount: number;
  };
  dataQuality: {
    validSourceCount: number;
    missingSources: ForecastSourceId[];
    hasSufficientHistoricalSamples: boolean;
  };
  summary: string;
}

/**
 * Empirical paired observation data point for spread vs forecast error relationship analysis
 */
export interface SpreadVsErrorPoint {
  timestamp: string;
  leadTimeHours: number;
  spread: number; // Model dispersion sigma
  forecastError: number; // Absolute error |blend - observation|
  sourceCount: number;
  context: {
    region: string;
    season: Season;
    regime: WeatherRegime;
    variable: WeatherVariable;
  };
}
