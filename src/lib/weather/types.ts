/**
 * Centralized Weather Data Architecture — Types & Domain Models
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements decoupled, production-grade meteorological research contracts:
 * - Deterministic & multi-model NWP / AI forecast representations
 * - Ground truth observational verification schemas
 * - Empirical uncertainty and cross-model disagreement structures
 * - Strict provenance and quality control telemetry (explicit demonstration flag)
 */

export type ForecastSourceId = 'ECMWF' | 'GFS' | 'ICON' | 'GRAPHCAST';

export type ForecastSourceType = 'NWP' | 'AI' | 'ENSEMBLE' | 'OBSERVATION' | 'STATISTICAL_BLEND';

export type WeatherVariable =
  | 'temperature_2m'
  | 'precipitation'
  | 'wind_speed_10m'
  | 'relative_humidity_2m'
  | 'surface_pressure';

export type WeatherRegime =
  | 'Normal'
  | 'Heavy Rainfall'
  | 'Convective / Rapid Change'
  | 'Heatwave'
  | 'High Wind'
  | 'Extreme Cold';

export type Season = 'DJF' | 'MAM' | 'JJA' | 'SON';

/** Scientific metadata defining an NWP or AI forecast source */
export interface SourceMetadata {
  id: ForecastSourceId;
  name: string;
  institution: string;
  type: ForecastSourceType;
  resolutionKm: number;
  updateCycleHours: number;
  gridCoordinateSystem: string; // e.g. "WGS84 0.1° Regular Gaussian"
  description: string;
  color: string;
  isDemonstration: boolean;
}

export interface ForecastSource extends SourceMetadata {
  active: boolean;
  baseLatencyMinutes?: number;
}

/** Complete lineage and data provenance record */
export interface DataProvenance {
  sourceId: ForecastSourceId;
  provider: string; // e.g. "MockWeatherProvider (Historical Benchmark)", "Open-Meteo Multi-Model"
  retrievalTimestamp: string; // ISO-8601 UTC
  forecastInitTimestamp: string; // ISO-8601 UTC (cycle run, e.g. 00Z)
  validTimestamp: string; // ISO-8601 UTC (target valid time)
  leadTimeHours: number;
  variable: WeatherVariable;
  unit: string;
  horizontalResolutionKm: number;
  isDemonstration: boolean;
}

/** Quality control diagnostics for a single reading */
export interface DataQuality {
  isValid: boolean;
  flags: string[]; // e.g. "PHYSICAL_BOUNDS_PASS", "STEP_CHANGE_WARN", "CLIMATOLOGY_CONSISTENT"
  completenessScore: number; // 0.0 to 1.0
  latencyMs?: number;
  checkResults: {
    physicalLimitsPassed: boolean;
    rateOfChangePassed: boolean;
    persistencePassed: boolean;
  };
}

/** Individual forecast point */
export interface ForecastPoint {
  id: string;
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  value: number;
  forecastValue?: number; // Alias for value to maximize pipeline interoperability
  observationValue?: number; // Verified ground truth when available (never fabricated)
  unit: string;
  leadTimeHours: number;
  timestamp: string; // ISO-8601 UTC valid time
  initializationTime: string; // ISO-8601 UTC init time
  sourceId: ForecastSourceId;
  provider?: string; // Specific provider organization (e.g. "ECMWF", "NOAA", "DWD")
  model?: string; // Specific model name (e.g. "IFS", "GFS", "ICON")
  metadata?: Record<string, any>; // Provider-specific telemetry & parameters
  quality: DataQuality;
  provenance: DataProvenance;
  qcPassed: boolean;
  isDemonstration: boolean;
}

/** Time series trajectory for a specific model source, station, and variable */
export interface ForecastSeries {
  sourceId: ForecastSourceId;
  stationId: string;
  variable: WeatherVariable;
  points: ForecastPoint[];
  leadTimes: number[];
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
  isDemonstration: boolean;
}

/** Multi-model forecast snapshot aligned at a specific valid time / lead horizon */
export interface ForecastSnapshot {
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  leadTimeHours: number;
  validTimestamp: string; // ISO-8601 UTC
  sources: Record<ForecastSourceId, ForecastPoint>;
  observedTruth?: Observation;
  isDemonstration: boolean;
}

/** Ground truth empirical observation (SYNOP / METAR / AWS) */
export interface Observation {
  id: string;
  stationId: string;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO-8601 UTC
  variable: WeatherVariable;
  value: number;
  unit: string;
  source: string; // e.g. "SYNOP", "METAR", "IMD_AWS", "NOAA_ISD"
  stationElevationMeters?: number;
  quality: DataQuality;
  retrievalTimestamp: string;
  isDemonstration: boolean;
}

/** Dynamic weight assigned to an individual model by the blending intelligence */
export interface ModelWeight {
  sourceId: ForecastSourceId;
  weight: number; // normalized [0.0, 1.0], sum = 1.0
  confidence: number; // [0.0, 1.0]
  historicalRmseInRegime: number;
  leadTimeDegradationPenalty: number;
  recentPerformanceScore: number;
  disagreementPenalty: number;
  supportingFactors: string[];
  activeRegime: WeatherRegime;
  leadTimeHours: number;
}

/** Quantified cross-model disagreement across the ensemble/multi-model pool */
export interface DisagreementMetric {
  variable: WeatherVariable;
  leadTimeHours: number;
  standardDeviation: number; // σ of forecasts
  maxPairwiseDifference: number; // max(model_i - model_j)
  range: [number, number]; // [min, max]
  level: 'Low' | 'Moderate' | 'High' | 'Severe';
  agreementRatio: number; // [0.0, 1.0]
}

/** Multi-tier uncertainty interval estimation */
export interface UncertaintyEstimate {
  variable: WeatherVariable;
  leadTimeHours: number;
  mean: number;
  median: number;
  stdDev: number; // σ
  lower90: number; // 5th percentile
  upper90: number; // 95th percentile
  spreadSkillRatio?: number;
  confidenceScore: number; // 0 - 100%
  confidenceTier: 'High' | 'Moderate' | 'Low';
  epistemicSpread: number; // model structure disagreement
}

/** Continuous & categorical verification against ground truth */
export interface VerificationResult {
  variable: WeatherVariable;
  leadTimeHours?: number;
  regime?: WeatherRegime;
  sampleCount: number;
  mae: number;
  rmse: number;
  bias: number; // Mean Bias Error
  errorVariance: number;
  brierScore?: number;
  crps?: number;
  threatScore?: number;
  isDemonstration: boolean;
}

export type ProviderOperationalStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'ERROR' | 'DEMO' | 'NOT_CONNECTED';

/** Status and operational health of a provider */
export interface ProviderHealthStatus {
  source: ForecastSourceId | 'OBSERVATION_NETWORK' | 'AGGREGATOR';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'DEMO_DATA';
  operationalStatus?: ProviderOperationalStatus;
  providerName?: string;
  model?: string;
  endpoint?: string;
  latencyMs: number;
  lastSuccessfulSync: string; // ISO-8601 UTC
  errorMessage?: string;
  consecutiveFailures: number;
  dataFreshnessMinutes: number;
  isDemonstration: boolean;
}

/** Query parameters for point forecasts */
export interface ForecastQuery {
  stationId: string;
  latitude: number;
  longitude: number;
  variables: WeatherVariable[];
  sourceIds?: ForecastSourceId[];
  leadTimeHours?: number;
  leadTimesHours?: number[];
  signal?: AbortSignal;
}

/** Query parameters for forecast time-series trajectories */
export interface ForecastSeriesQuery {
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  sourceIds?: ForecastSourceId[];
  leadTimes?: number[];
  signal?: AbortSignal;
}

/** Query parameters for multi-model snapshot */
export interface SnapshotQuery {
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  leadTimeHours: number;
  signal?: AbortSignal;
}

/** Query parameters for ground truth observation */
export interface ObservationQuery {
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  timestamp?: string; // target time (ISO-8601 UTC)
  signal?: AbortSignal;
}

export interface StationLocation {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  climateZone: string;
  climatology: {
    tempMean: number;
    tempStd: number;
    precipAnnualMm: number;
    windMeanMs: number;
  };
}

/** Query parameters for historical observation series */
export interface ObservationHistoryQuery {
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  startTimestamp: string;
  endTimestamp: string;
  signal?: AbortSignal;
}

/** Weather Context & Diagnostic Signals */
export interface WeatherContext {
  stationId: string;
  timestamp: string;
  leadTimeHours: number;
  season: Season;
  variable: WeatherVariable;
  detectedRegime: WeatherRegime;
  regimeSignals: {
    name: string;
    value: string;
    threshold: string;
    triggered: boolean;
  }[];
  thermodynamicIndicators: {
    capeEstimate?: number; // J/kg
    precipIntensity3h?: number; // mm
    tempAnomalyClimo?: number; // °C
    windShearProxy?: number; // m/s
    diurnalVariation?: number;
  };
  modelDisagreementSpread: number;
  disagreementLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  recentSourceErrors?: Record<ForecastSourceId, number>;
}



