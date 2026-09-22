import { 
  ForecastProvider, 
  ForecastQuery, 
  ProviderValidationResult 
} from './ForecastProvider';
import { 
  ForecastRecord, 
  ForecastSourceId, 
  ForecastSourceMetadata, 
  WeatherVariable, 
  Season,
  WeatherRegime
} from '../types';
import { getStationById } from '../data/stations';
import { QualityControlEngine } from '../qc/QualityControl';

export class OpenMeteoLiveProvider implements ForecastProvider {
  public readonly id: ForecastSourceId;
  private modelQueryKey: string;

  constructor(sourceId: ForecastSourceId) {
    this.id = sourceId;
    // Map internal source to Open-Meteo model names
    switch (sourceId) {
      case 'ECMWF':
        this.modelQueryKey = 'ecmwf_ifs025';
        break;
      case 'GFS':
        this.modelQueryKey = 'gfs_seamless';
        break;
      case 'ICON':
        this.modelQueryKey = 'icon_seamless';
        break;
      case 'GRAPHCAST':
      default:
        // DeepMind GraphCast is not directly hosted on Open-Meteo ensemble;
        // Use high-resolution AIFS/ECMWF surrogate with AI error profile
        this.modelQueryKey = 'ecmwf_aifs025';
        break;
    }
  }

  public getMetadata(): ForecastSourceMetadata {
    return {
      id: this.id,
      name: `${this.id} (Live via Open-Meteo)`,
      institution: 'WMO / National Weather Services via Open-Meteo API',
      type: this.id === 'GRAPHCAST' ? 'AI' : 'NWP',
      resolutionKm: this.id === 'ECMWF' ? 9.0 : 13.0,
      updateCycleHours: 6,
      description: 'Real-time live multi-model operational NWP telemetry stream.',
      color: '#06B6D4'
    };
  }

  public isLive(): boolean {
    return true;
  }

  public getAvailableVariables(): WeatherVariable[] {
    return [
      'temperature_2m',
      'precipitation',
      'wind_speed_10m',
      'relative_humidity_2m',
      'surface_pressure'
    ];
  }

  public getLeadTimes(): number[] {
    return [0, 6, 12, 24, 48, 72, 120, 168];
  }

  public validateResponse(data: unknown): ProviderValidationResult {
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Response is not an object'], recordsParsed: 0 };
    }
    const d = data as any;
    if (!d.hourly || !d.hourly.time) {
      return { valid: false, errors: ['Response missing hourly time array'], recordsParsed: 0 };
    }
    return { valid: true, errors: [], recordsParsed: d.hourly.time.length };
  }

  public async getForecast(query: ForecastQuery): Promise<ForecastRecord[]> {
    const station = getStationById(query.stationId);
    const lat = query.latitude || station.latitude;
    const lon = query.longitude || station.longitude;

    // Open-Meteo hourly parameter mapping
    const hourlyParams = [
      'temperature_2m',
      'precipitation',
      'wind_speed_10m',
      'relative_humidity_2m',
      'surface_pressure'
    ].join(',');

    const url = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&models=${this.modelQueryKey}&forecast_days=7&timezone=UTC`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      const val = this.validateResponse(json);
      if (!val.valid) {
        throw new Error(`Validation failed: ${val.errors.join(', ')}`);
      }

      return this.parseOpenMeteoPayload(json, station, query.variables);
    } catch (err) {
      console.warn(`[OpenMeteoLiveProvider] Live fetch failed for ${this.id}, falling back:`, err);
      throw err;
    }
  }

  private parseOpenMeteoPayload(
    payload: any, 
    station: any, 
    requestedVars: WeatherVariable[]
  ): ForecastRecord[] {
    const records: ForecastRecord[] = [];
    const hourly = payload.hourly;
    const times: string[] = hourly.time;
    const now = new Date();

    // Map lead time hours: 0, 6, 12, 24, 48, 72, 120, 168
    const targetLeads = [0, 6, 12, 24, 48, 72, 120, 168];

    for (const lead of targetLeads) {
      if (lead >= times.length) continue;
      const targetTimeStr = times[lead];

      for (const variable of requestedVars) {
        // Look for model specific key in payload (e.g., `temperature_2m_${this.modelQueryKey}` or `temperature_2m`)
        let rawVal = 0;
        const specificKey = `${variable}_${this.modelQueryKey}`;
        if (hourly[specificKey] && hourly[specificKey][lead] !== undefined) {
          rawVal = hourly[specificKey][lead];
        } else if (hourly[variable] && hourly[variable][lead] !== undefined) {
          rawVal = hourly[variable][lead];
        }

        const qc = QualityControlEngine.validate(variable, rawVal);
        const finalVal = qc.correctedValue !== undefined ? qc.correctedValue : rawVal;

        records.push({
          id: `${this.id}_LIVE_${station.id}_${variable}_+${lead}h`,
          timestamp: targetTimeStr,
          initializationTime: times[0],
          leadTimeHours: lead,
          latitude: station.latitude,
          longitude: station.longitude,
          stationId: station.id,
          region: station.region,
          season: 'SON',
          weatherRegime: 'Normal', // Will be classified by ContextEngine
          forecastSource: this.id,
          variable,
          forecastValue: Number(finalVal.toFixed(2)),
          observationValue: undefined, // Future live forecasts have no observed ground truth yet
          isVerified: false,
          qcPassed: qc.passed
        });
      }
    }

    return records;
  }
}
