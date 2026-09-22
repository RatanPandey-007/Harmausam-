import { 
  ForecastSourceId, 
  ForecastSourceMetadata, 
  WeatherVariable, 
  ForecastRecord, 
  QCResult 
} from '../types';

export interface ForecastQuery {
  latitude: number;
  longitude: number;
  stationId: string;
  variables: WeatherVariable[];
  initializationTime?: string;
  leadTimesHours?: number[];
}

export interface ProviderValidationResult {
  valid: boolean;
  errors: string[];
  recordsParsed: number;
}

/**
 * ForecastProvider Interface
 * Required abstraction allowing traditional NWP, AI neural models,
 * multi-model ensembles, and observational datasets to be added seamlessly.
 */
export interface ForecastProvider {
  /** Unique provider / source identifier */
  readonly id: ForecastSourceId;
  
  /** Metadata describing resolution, update frequency, and origin */
  getMetadata(): ForecastSourceMetadata;
  
  /** Retrieve forecast records for given location and parameters */
  getForecast(query: ForecastQuery): Promise<ForecastRecord[]>;
  
  /** List of meteorological variables supported by this provider */
  getAvailableVariables(): WeatherVariable[];
  
  /** Lead time range in hours supported by this provider (e.g. 0 to 168) */
  getLeadTimes(): number[];
  
  /** Validate raw payload from source against meteorological standards */
  validateResponse(data: unknown): ProviderValidationResult;

  /** Health / connection status */
  isLive(): boolean;
}
