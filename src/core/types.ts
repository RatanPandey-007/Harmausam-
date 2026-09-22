/**
 * Core Types for Harmausam Weather Forecast Blending System
 * 
 * Implements data structures for multi-model NWP & AI forecasts,
 * quality control, weather regimes, dynamic weights, and verification metrics.
 */

export type ForecastSourceId = 'ECMWF' | 'GFS' | 'ICON' | 'GRAPHCAST';

export type ForecastSourceType = 'NWP' | 'AI' | 'ENSEMBLE' | 'OBSERVATION';

export interface ForecastSourceMetadata {
  id: ForecastSourceId;
  name: string;
  institution: string;
  type: ForecastSourceType;
  resolutionKm: number;
  updateCycleHours: number;
  description: string;
  color: string;
}

export type WeatherVariable = 
  | 'temperature_2m' 
  | 'precipitation' 
  | 'wind_speed_10m' 
  | 'relative_humidity_2m' 
  | 'surface_pressure';

export interface VariableMetadata {
  id: WeatherVariable;
  name: string;
  unit: string;
  symbol: string;
  physicalMin: number;
  physicalMax: number;
  typicalSpread: number;
  description: string;
}

export type WeatherRegime = 
  | 'Normal'
  | 'Heavy Rainfall'
  | 'Convective / Rapid Change'
  | 'Heatwave'
  | 'High Wind'
  | 'Extreme Cold';

export type Season = 'DJF' | 'MAM' | 'JJA' | 'SON'; // Climatological seasons

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

/** Single forecast data point */
export interface ForecastRecord {
  id: string;
  timestamp: string; // ISO-8601 target valid time
  initializationTime: string; // Model cycle init time (e.g., 00Z)
  leadTimeHours: number; // e.g. 0, 6, 12, 24, 48, 72, 120, 168
  latitude: number;
  longitude: number;
  stationId: string;
  region: string;
  season: Season;
  weatherRegime: WeatherRegime;
  forecastSource: ForecastSourceId;
  variable: WeatherVariable;
  forecastValue: number;
  observationValue?: number; // Verified ground truth when available (never fabricated)
  isVerified: boolean;
  qcPassed: boolean;
}

/** Quality Control Diagnostics */
export interface QCResult {
  passed: boolean;
  flags: string[];
  originalValue: number;
  correctedValue?: number;
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
  recentSourceErrors?: Record<ForecastSourceId, number>; // recent 24-48h RMSE
}

/** Source Weight Assignment Output */
export interface SourceWeight {
  source: ForecastSourceId;
  weight: number; // normalized (0.0 to 1.0)
  confidence: number; // 0.0 to 1.0
  historicalRmseInRegime: number;
  leadTimeDegradationPenalty: number;
  recentPerformanceScore: number;
  disagreementPenalty: number;
  supportingFactors: string[];
}

/** Output of Blending Engines */
export interface BlendedForecastResult {
  variable: WeatherVariable;
  timestamp: string;
  leadTimeHours: number;
  station: StationLocation;
  context: WeatherContext;
  
  // Baselines
  individualForecasts: Record<ForecastSourceId, number>;
  equalWeightForecast: number;
  fixedWeightForecast: number;
  adaptiveBlendedForecast: number;
  
  // Weights applied
  adaptiveWeights: Record<ForecastSourceId, SourceWeight>;
  fixedWeights: Record<ForecastSourceId, number>;
  
  // Uncertainty & Disagreement
  modelSpread: number;
  uncertaintyInterval: {
    lower90: number;
    upper90: number;
    stdDev: number;
  };
  confidenceIndicator: number; // 0-100%
  confidenceTier: 'High' | 'Moderate' | 'Low';
  
  // Ground truth verification (if verified test point)
  observationValue?: number;
  errors?: {
    ecmwfError?: number;
    gfsError?: number;
    iconError?: number;
    graphcastError?: number;
    equalWeightError?: number;
    fixedWeightError?: number;
    adaptiveError?: number;
  };
}

/** Extreme Event Alert Definition */
export interface ExtremeEventAlert {
  id: string;
  eventType: 'Heavy rainfall' | 'Heatwave' | 'High wind' | 'Extreme Cold';
  location: StationLocation;
  timeWindow: {
    onset: string;
    peak: string;
    clear: string;
  };
  severityRisk: 'Information' | 'Watch' | 'Elevated Risk' | 'High Risk';
  probabilityOfExceedance: number; // 0-100%
  thresholdExceeded: {
    variable: WeatherVariable;
    thresholdValue: number;
    unit: string;
    blendedForecastValue: number;
  };
  modelAgreementRatio: number; // e.g. 3 of 4 models agree
  individualExceedance: Record<ForecastSourceId, boolean>;
  confidence: number; // 0-100%
  evidenceFeatures: string[];
  meteorologicalBulletin: string;
}

/** Verification Metrics for Continuous Variables */
export interface ContinuousMetrics {
  sampleCount: number;
  mae: number;
  rmse: number;
  bias: number; // Mean Bias Error
  spreadSkillRatio?: number;
  errorVariance: number;
}

/** Verification Metrics for Categorical/Event Probabilities */
export interface CategoricalMetrics {
  sampleCount: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctNegatives: number;
  precision: number;
  recall: number; // POD
  f1: number;
  criticalSuccessIndex: number; // CSI (Threat Score)
  brierScore: number;
}

export interface VerifiedDataPoint {
  timestamp: string;
  leadTimeHours: number;
  regime: WeatherRegime;
  observation: number;
  ecmwf: number;
  gfs: number;
  icon: number;
  graphcast: number;
  equalWeight: number;
  fixedWeight: number;
  adaptiveBlend: number;
}

/** Comparative Verification Leaderboard */
export interface VerificationComparison {
  variable: WeatherVariable;
  evaluationWindow: string;
  splitMethod: string; // 'Strict Chronological (Time-Aware)'
  sampleSize: number;
  dataPoints?: VerifiedDataPoint[];
  models: {
    name: string;
    id: string;
    type: 'INDIVIDUAL' | 'EQUAL_WEIGHT' | 'FIXED_WEIGHT' | 'ADAPTIVE_BLEND';
    continuous: ContinuousMetrics;
    categorical?: CategoricalMetrics;
    skillScoreVsEqualWeight: number; // % improvement in RMSE over Equal-Weight
  }[];
  leadTimeDegradation: {
    leadTimeHours: number;
    ecmwfRmse: number;
    gfsRmse: number;
    iconRmse: number;
    graphcastRmse: number;
    equalWeightRmse: number;
    adaptiveRmse: number;
  }[];
  regimePerformance: {
    regime: WeatherRegime;
    sampleCount: number;
    equalWeightRmse: number;
    adaptiveRmse: number;
    relativeImprovementPct: number;
    bestModel: string;
  }[];
}

/** Explainability Factor Decomposition */
export interface ExplanationBreakdown {
  variable: WeatherVariable;
  leadTimeHours: number;
  regime: WeatherRegime;
  baseHistoricalWeights: Record<ForecastSourceId, number>;
  regimeAdjustment: Record<ForecastSourceId, number>;
  leadTimeAdjustment: Record<ForecastSourceId, number>;
  recentPerformanceAdjustment: Record<ForecastSourceId, number>;
  disagreementPenalty: Record<ForecastSourceId, number>;
  finalNormalizedWeights: Record<ForecastSourceId, number>;
  naturalLanguageSummary: string[];
  counterfactualComparison?: {
    originalRegime: WeatherRegime;
    counterfactualRegime: WeatherRegime;
    weightShifts: Record<ForecastSourceId, { before: number; after: number; delta: number }>;
    forecastShift: { before: number; after: number; delta: number };
  };
}

/** System Ingestion & Provider Health */
export interface ProviderHealthStatus {
  providerId: ForecastSourceId;
  name: string;
  status: 'ONLINE' | 'DEMO_DATA' | 'DISCONNECTED';
  latencyMs: number;
  lastIngestionTime: string;
  totalRecordsIngested: number;
  qcPassRate: number; // percentage
  missingDataPct: number;
  activeCycle: string;
}
