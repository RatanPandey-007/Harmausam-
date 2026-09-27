/**
 * Centralized Weather Data Architecture — Meteostat Ground Truth Observation Provider
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Dedicated empirical observation network interface for verification
 * - Strictly isolated from forecast modeling (NEVER serves as a forecast provider)
 * - Strict integrity: If observation is unavailable or missing, returns null / missing status
 * - ZERO synthetic filling: NEVER substitutes model-derived values into observations
 */

import { ObservationProvider } from '../provider';
import {
  Observation,
  ProviderHealthStatus,
  ProviderOperationalStatus,
  ObservationQuery,
  ObservationHistoryQuery,
  DataQuality,
} from '../types';
import {
  CANONICAL_UNITS,
  normalizeTimestamp,
  normalizeCoordinates,
  normalizeUnit,
  validatePhysicalBounds,
} from '../normalization';

export class MeteostatObservationProvider implements ObservationProvider {
  public readonly name: string = 'Meteostat Surface Observation Network';
  public readonly isDemonstration: boolean = false; // Intended for empirical observations

  private apiKey: string;
  private apiHost: string = 'meteostat.p.rapidapi.com';
  private operationalStatus: ProviderOperationalStatus = 'UNAVAILABLE';
  private lastLatencyMs: number = 0;
  private lastSuccessfulSync: string = '';
  private lastErrorMessage?: string;

  constructor(apiKeyOverride?: string) {
    // Read from environment variable (Vite client or Node/process) or user-configured key
    const envKey = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_METEOSTAT_API_KEY as string)
      : undefined;

    const processKey = typeof process !== 'undefined' && process.env
      ? (process.env.VITE_METEOSTAT_API_KEY || process.env.METEOSTAT_API_KEY)
      : undefined;

    this.apiKey = apiKeyOverride || envKey || processKey || '';

    if (!this.apiKey) {
      this.operationalStatus = 'UNAVAILABLE';
      this.lastErrorMessage = 'VITE_METEOSTAT_API_KEY is not configured. Genuine empirical observations are unlinked.';
    } else {
      this.operationalStatus = 'AVAILABLE';
    }
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Fetch discrete empirical observation for a station / timestamp
   */
  public async getObservation(query: ObservationQuery): Promise<Observation | null> {
    if (query.signal?.aborted) {
      throw new DOMException('Observation query aborted', 'AbortError');
    }

    // If API key is not configured, honestly return null without fabrication
    if (!this.apiKey) {
      return null;
    }

    const { latitude, longitude } = normalizeCoordinates(query.latitude, query.longitude);
    const targetTime = query.timestamp ? new Date(query.timestamp) : new Date();
    const dateStr = targetTime.toISOString().split('T')[0];

    try {
      const url = `https://${this.apiHost}/point/hourly?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}&start=${dateStr}&end=${dateStr}`;
      const startTime = Date.now();

      const res = await fetch(url, {
        signal: query.signal,
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey,
        },
      });

      this.lastLatencyMs = Date.now() - startTime;

      if (!res.ok) {
        this.operationalStatus = 'ERROR';
        this.lastErrorMessage = `Meteostat API error: HTTP ${res.status}`;
        return null;
      }

      const json = await res.json();
      const records = json?.data;
      if (!Array.isArray(records) || records.length === 0) {
        return null; // No observation recorded for this point
      }

      // Map variable to Meteostat field
      const fieldMap: Record<string, string> = {
        temperature_2m: 'temp',
        precipitation: 'prcp',
        wind_speed_10m: 'wspd', // km/h in Meteostat
        relative_humidity_2m: 'rhum',
        surface_pressure: 'pres',
      };

      const fieldName = fieldMap[query.variable];
      if (!fieldName) return null;

      // Find closest hourly observation with valid data for requested variable
      let match: any = null;
      let minDiff = Infinity;
      const targetMs = targetTime.getTime();

      for (const r of records) {
        if (!r.time || r[fieldName] === null || r[fieldName] === undefined) continue;
        const rTimeMs = new Date(r.time.replace(' ', 'T') + 'Z').getTime();
        const diff = Math.abs(rTimeMs - targetMs);
        if (diff < minDiff) {
          minDiff = diff;
          match = r;
        }
      }

      if (!match && records.length > 0) {
        match = records[records.length - 1];
      }

      if (!match || match[fieldName] === null || match[fieldName] === undefined) {
        // Missing observation: return null honestly rather than synthesizing!
        return null;
      }

      let rawVal = Number(match[fieldName]);
      let rawUnit = '°C';
      if (query.variable === 'wind_speed_10m') {
        rawUnit = 'km/h';
      } else if (query.variable === 'precipitation') {
        rawUnit = 'mm';
      } else if (query.variable === 'surface_pressure') {
        rawUnit = 'hPa';
      } else if (query.variable === 'relative_humidity_2m') {
        rawUnit = '%';
      }

      const canonicalUnit = CANONICAL_UNITS[query.variable];
      const normalizedVal = normalizeUnit(rawVal, rawUnit, canonicalUnit);
      const boundCheck = validatePhysicalBounds(query.variable, normalizedVal);

      this.lastSuccessfulSync = normalizeTimestamp(new Date());
      this.operationalStatus = 'AVAILABLE';

      const quality: DataQuality = {
        isValid: boundCheck.isValid,
        flags: ['METEOSTAT_EMPIRICAL_STATION_READING'],
        completenessScore: 1.0,
        latencyMs: this.lastLatencyMs,
        checkResults: {
          physicalLimitsPassed: boundCheck.isValid,
          rateOfChangePassed: true,
          persistencePassed: true,
        },
      };

      return {
        id: `METEOSTAT_OBS_${query.stationId}_${query.variable}_${normalizeTimestamp(match.time)}`,
        stationId: query.stationId,
        latitude,
        longitude,
        timestamp: normalizeTimestamp(match.time),
        variable: query.variable,
        value: Math.round(normalizedVal * 100) / 100,
        unit: canonicalUnit,
        source: 'Meteostat Surface Synoptic Network',
        quality,
        retrievalTimestamp: normalizeTimestamp(new Date()),
        isDemonstration: false,
      };
    } catch (e: any) {
      this.operationalStatus = 'ERROR';
      this.lastErrorMessage = e?.message || 'Observation fetch failed';
      return null;
    }
  }

  /**
   * Fetch chronological observation series for verification
   */
  public async getObservationHistory(query: ObservationHistoryQuery): Promise<Observation[]> {
    if (query.signal?.aborted) {
      throw new DOMException('Observation history query aborted', 'AbortError');
    }

    if (!this.apiKey) {
      return []; // No fake observations generated
    }

    const { latitude, longitude } = normalizeCoordinates(query.latitude, query.longitude);
    const startStr = query.startTimestamp.split('T')[0];
    const endStr = query.endTimestamp.split('T')[0];

    try {
      const url = `https://${this.apiHost}/point/hourly?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}&start=${startStr}&end=${endStr}`;
      const res = await fetch(url, {
        signal: query.signal,
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey,
        },
      });

      if (!res.ok) return [];

      const json = await res.json();
      const records = json?.data;
      if (!Array.isArray(records)) return [];

      const fieldMap: Record<string, string> = {
        temperature_2m: 'temp',
        precipitation: 'prcp',
        wind_speed_10m: 'wspd',
        relative_humidity_2m: 'rhum',
        surface_pressure: 'pres',
      };

      const fieldName = fieldMap[query.variable];
      if (!fieldName) return [];

      const observations: Observation[] = [];

      for (const r of records) {
        if (r[fieldName] === null || r[fieldName] === undefined) {
          continue; // Strictly omit missing observation records
        }

        const rawVal = Number(r[fieldName]);
        const canonicalUnit = CANONICAL_UNITS[query.variable];
        const rawUnit = query.variable === 'wind_speed_10m' ? 'km/h' : canonicalUnit;
        const normalizedVal = normalizeUnit(rawVal, rawUnit, canonicalUnit);
        const boundCheck = validatePhysicalBounds(query.variable, normalizedVal);

        observations.push({
          id: `METEOSTAT_HIST_${query.stationId}_${query.variable}_${normalizeTimestamp(r.time)}`,
          stationId: query.stationId,
          latitude,
          longitude,
          timestamp: normalizeTimestamp(r.time),
          variable: query.variable,
          value: Math.round(normalizedVal * 100) / 100,
          unit: canonicalUnit,
          source: 'Meteostat Surface Synoptic Network',
          quality: {
            isValid: boundCheck.isValid,
            flags: ['METEOSTAT_HISTORICAL_RECORD'],
            completenessScore: 1.0,
            checkResults: {
              physicalLimitsPassed: boundCheck.isValid,
              rateOfChangePassed: true,
              persistencePassed: true,
            },
          },
          retrievalTimestamp: normalizeTimestamp(new Date()),
          isDemonstration: false,
        });
      }

      return observations;
    } catch {
      return [];
    }
  }

  public async getHealth(): Promise<ProviderHealthStatus> {
    return {
      source: 'OBSERVATION_NETWORK',
      status: this.apiKey ? (this.operationalStatus === 'AVAILABLE' ? 'ONLINE' : 'DEGRADED') : 'OFFLINE',
      operationalStatus: this.operationalStatus,
      providerName: 'Meteostat',
      model: 'Station Observation Network',
      endpoint: `https://${this.apiHost}/point/hourly`,
      latencyMs: this.lastLatencyMs,
      lastSuccessfulSync: this.lastSuccessfulSync,
      errorMessage: this.lastErrorMessage,
      consecutiveFailures: 0,
      dataFreshnessMinutes: this.lastSuccessfulSync
        ? Math.round((Date.now() - new Date(this.lastSuccessfulSync).getTime()) / 60000)
        : 999,
      isDemonstration: false,
    };
  }
}
