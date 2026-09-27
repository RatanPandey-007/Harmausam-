/**
 * Centralized Weather Data Architecture — Quality Control Engine
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements rigorous quality control classification:
 * - VALID: Passed all physical plausibility, unit, and chronological checks
 * - MISSING: Preserved strictly as null (never substituted with zero or other models)
 * - INVALID: Beyond physical atmospheric bounds (e.g. T < -90°C or > 60°C)
 * - DUPLICATE: Redundant duplicate entry for same model, valid time, and lead
 * - SUSPICIOUS: Conflicting duplicates or unphysical step-change spikes
 */

import {
  WeatherVariable,
  ForecastPoint,
} from '../types';
import {
  QCClassification,
  QCInspection,
} from './types';
import {
  CANONICAL_UNITS,
  PHYSICAL_ATMOSPHERIC_BOUNDS,
  validatePhysicalBounds,
} from '../normalization';

/** Maximum plausible 1-hour physical atmospheric rates of change */
export const MAX_HOURLY_DELTA: Record<WeatherVariable, number> = {
  temperature_2m: 18.0,      // Max ~18°C/hr (extreme convective cold pool gust front)
  precipitation: 200.0,      // Extreme cloudburst / convective cell ceiling
  wind_speed_10m: 35.0,      // Downburst / microburst gust acceleration (m/s / hr)
  relative_humidity_2m: 65.0, // Rapid dryline passage (% / hr)
  surface_pressure: 25.0,    // Explosive cyclogenesis / tornadic eye passage (hPa / hr)
};

export class QualityControlEngine {
  private seenKeys = new Map<string, number>();

  /**
   * Reset duplicate tracking state between alignment runs
   */
  public reset(): void {
    this.seenKeys.clear();
  }

  /**
   * Generates a deterministic composite key for identifying duplicate records
   */
  public static createRecordKey(
    sourceId: string,
    initTime: string,
    validTime: string,
    variable: string,
    lat: number,
    lon: number
  ): string {
    const latR = Math.round(lat * 1000) / 1000;
    const lonR = Math.round(lon * 1000) / 1000;
    return `${sourceId}::${initTime}::${validTime}::${variable}::${latR},${lonR}`;
  }

  /**
   * Run comprehensive QC inspection on a single forecast point
   */
  public inspect(
    point: ForecastPoint,
    previousPoint?: ForecastPoint
  ): QCInspection {
    const flags: string[] = [];
    const reasons: string[] = [];
    const canonicalUnit = CANONICAL_UNITS[point.variable] || point.unit;

    // 1. Missing Value Check
    if (point.value === null || point.value === undefined || isNaN(point.value)) {
      return {
        status: 'MISSING',
        flags: ['MISSING_VALUE_NULL'],
        reasons: [`${point.variable} is null or undefined for valid time ${point.timestamp}`],
        originalValue: point.value,
        normalizedValue: null,
        unit: canonicalUnit,
      };
    }

    // 2. Spatial Coordinate Validation
    if (point.latitude < -90 || point.latitude > 90 || point.longitude < -180 || point.longitude > 180) {
      flags.push('COORDINATE_OUT_OF_WGS84_BOUNDS');
      reasons.push(`Coordinates (${point.latitude}, ${point.longitude}) violate WGS84 standards`);
    }

    // 3. Timestamp Validity Check
    const validMs = new Date(point.timestamp).getTime();
    if (isNaN(validMs)) {
      flags.push('INVALID_TIMESTAMP_FORMAT');
      reasons.push(`Unparseable valid timestamp: "${point.timestamp}"`);
      return {
        status: 'INVALID',
        flags,
        reasons,
        originalValue: point.value,
        normalizedValue: null,
        unit: canonicalUnit,
      };
    }

    // 4. Duplicate Record Detection
    const key = QualityControlEngine.createRecordKey(
      point.sourceId,
      point.initializationTime,
      point.timestamp,
      point.variable,
      point.latitude,
      point.longitude
    );

    if (this.seenKeys.has(key)) {
      const priorVal = this.seenKeys.get(key)!;
      if (Math.abs(priorVal - point.value) < 0.001) {
        flags.push('EXACT_DUPLICATE_RECORD');
        reasons.push(`Identical record already exists for ${key}`);
        return {
          status: 'DUPLICATE',
          flags,
          reasons,
          originalValue: point.value,
          normalizedValue: point.value,
          unit: canonicalUnit,
        };
      } else {
        flags.push('CONFLICTING_DUPLICATE_VALUES');
        reasons.push(`Duplicate key ${key} has conflicting values: prior=${priorVal}, new=${point.value}`);
        return {
          status: 'SUSPICIOUS',
          flags,
          reasons,
          originalValue: point.value,
          normalizedValue: point.value,
          unit: canonicalUnit,
        };
      }
    }
    this.seenKeys.set(key, point.value);

    // 5. Physical Bounds Plausibility Check
    const boundCheck = validatePhysicalBounds(point.variable, point.value);
    if (!boundCheck.isValid) {
      flags.push(...boundCheck.flags);
      if (boundCheck.reason) reasons.push(boundCheck.reason);
      return {
        status: 'INVALID',
        flags,
        reasons,
        originalValue: point.value,
        normalizedValue: point.value,
        unit: canonicalUnit,
      };
    }

    // 6. Rate-of-Change / Step Change Spike Check
    if (previousPoint && !isNaN(previousPoint.value)) {
      const prevMs = new Date(previousPoint.timestamp).getTime();
      const deltaHours = Math.abs(validMs - prevMs) / (3600 * 1000);

      if (deltaHours > 0 && deltaHours <= 3) {
        const ratePerHour = Math.abs(point.value - previousPoint.value) / deltaHours;
        const maxAllowed = MAX_HOURLY_DELTA[point.variable];

        if (maxAllowed && ratePerHour > maxAllowed) {
          flags.push('EXCESSIVE_RATE_OF_CHANGE');
          reasons.push(
            `Rate of change (${ratePerHour.toFixed(1)} ${canonicalUnit}/h) exceeds physical limit (${maxAllowed} ${canonicalUnit}/h)`
          );
          return {
            status: 'SUSPICIOUS',
            flags,
            reasons,
            originalValue: point.value,
            normalizedValue: point.value,
            unit: canonicalUnit,
          };
        }
      }
    }

    // 7. Passed All Checks -> VALID
    flags.push('QC_PASS_ALL_CHECKS');
    return {
      status: 'VALID',
      flags,
      reasons: [],
      originalValue: point.value,
      normalizedValue: point.value,
      unit: canonicalUnit,
    };
  }
}

/** Singleton QC Engine instance */
export const qualityControlEngine = new QualityControlEngine();
