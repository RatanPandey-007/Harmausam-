/**
 * Centralized Weather Data Architecture — Provider Contracts
 * Harmausam Meteorological Intelligence Platform
 *
 * Establishes formal abstraction interfaces for:
 * - Deterministic/ensemble/AI weather forecast retrieval
 * - Empirical ground truth observation network ingestion
 * - Operational health and latency monitoring
 */

import {
  ForecastPoint,
  ForecastSeries,
  ForecastSnapshot,
  Observation,
  ProviderHealthStatus,
  ForecastQuery,
  ForecastSeriesQuery,
  SnapshotQuery,
  ObservationQuery,
  ObservationHistoryQuery,
} from './types';

/**
 * Interface contract for all meteorological forecasting sources
 * (NWP models, AI autoregressive models, statistical baselines, mock testbeds)
 */
export interface WeatherProvider {
  /** Descriptive identifier of the provider */
  readonly name: string;

  /**
   * Scientific integrity flag: True if data originates from benchmark/synthetic demonstration sets,
   * false ONLY if ingested from genuine operational APIs/data streams.
   */
  readonly isDemonstration: boolean;

  /** Check if provider is operational and reachable */
  isAvailable(): Promise<boolean>;

  /** Fetch point forecasts for requested station and variables */
  getForecast(query: ForecastQuery): Promise<ForecastPoint[]>;

  /** Fetch continuous time series trajectory for a variable and station */
  getForecastSeries(query: ForecastSeriesQuery): Promise<ForecastSeries>;

  /** Fetch synchronized multi-model snapshot across sources at a specific lead horizon */
  getSnapshot(query: SnapshotQuery): Promise<ForecastSnapshot>;

  /** Telemetry and health check */
  getHealth(): Promise<ProviderHealthStatus>;
}

/**
 * Interface contract for ground truth observational systems
 * (SYNOP meteorological stations, METAR aviation reports, Automatic Weather Stations (AWS))
 */
export interface ObservationProvider {
  /** Descriptive identifier of the observational network */
  readonly name: string;

  /** Scientific integrity flag */
  readonly isDemonstration: boolean;

  /** Check if observational network is reachable */
  isAvailable(): Promise<boolean>;

  /** Fetch discrete empirical ground truth observation for a station */
  getObservation(query: ObservationQuery): Promise<Observation | null>;

  /** Fetch chronological observation history for verification windows */
  getObservationHistory(query: ObservationHistoryQuery): Promise<Observation[]>;

  /** Observation network health and data freshness */
  getHealth(): Promise<ProviderHealthStatus>;
}
