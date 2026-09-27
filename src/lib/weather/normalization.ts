/**
 * Centralized Weather Data Architecture — Normalization Utilities
 * Harmausam Meteorological Intelligence Platform
 *
 * Provides deterministic, pure-function transformations for:
 * - UTC timestamp harmonization (ISO-8601 strict)
 * - SI & meteorological unit conversion (Kelvin, Celsius, Pa, hPa, m/s, mm)
 * - Geographic coordinate validation & canonical WGS84 normalization
 * - Meteorologically sound physical bounding and quality control flagging
 * - Forecast source identifier normalization
 */

import { WeatherVariable, ForecastSourceId } from './types';

/** Standard canonical units used across the Harmausam research platform */
export const CANONICAL_UNITS: Record<WeatherVariable, string> = {
  temperature_2m: '°C',
  precipitation: 'mm',
  wind_speed_10m: 'm/s',
  relative_humidity_2m: '%',
  surface_pressure: 'hPa',
};

/** Climatological physical atmospheric bounds for QC validation */
export const PHYSICAL_ATMOSPHERIC_BOUNDS: Record<
  WeatherVariable,
  { min: number; max: number; unit: string; description: string }
> = {
  temperature_2m: {
    min: -90.0, // World record low ~ -89.2°C (Vostok Station)
    max: 60.0,  // World record high ~ 56.7°C (Furnace Creek)
    unit: '°C',
    description: '2-meter Ambient Air Temperature',
  },
  precipitation: {
    min: 0.0,
    max: 500.0, // Extreme convective 3h/24h ceiling
    unit: 'mm',
    description: 'Liquid Equivalent Precipitation Accumulation',
  },
  wind_speed_10m: {
    min: 0.0,
    max: 120.0, // Category 5 / Super Typhoon gust limit (~113 m/s record)
    unit: 'm/s',
    description: '10-meter Horizontal Wind Velocity',
  },
  relative_humidity_2m: {
    min: 0.0,
    max: 100.0,
    unit: '%',
    description: 'Relative Humidity at 2 meters',
  },
  surface_pressure: {
    min: 800.0,  // Deepest tropical cyclone eye ~870 hPa, high plateau limit
    max: 1085.0, // Siberian high maximum ~1084.8 hPa
    unit: 'hPa',
    description: 'Surface Barometric Atmospheric Pressure',
  },
};

/**
 * Harmonize any input date/timestamp to canonical ISO-8601 UTC string.
 * Format: YYYY-MM-DDTHH:mm:ss.000Z
 */
export function normalizeTimestamp(input: string | number | Date): string {
  if (!input) {
    return new Date().toISOString();
  }

  let date: Date;

  if (typeof input === 'number') {
    // Detect unix timestamp in seconds vs milliseconds
    date = input < 1e11 ? new Date(input * 1000) : new Date(input);
  } else if (input instanceof Date) {
    date = input;
  } else {
    const trimmed = input.trim();
    // Normalize space between date and time to 'T' for robust ISO-8601 parsing (e.g. Meteostat API format)
    const isoString = trimmed.includes(' ') && !trimmed.includes('T')
      ? trimmed.replace(' ', 'T')
      : trimmed;

    // If string does not have timezone indicator (no Z, no +/-, and no GMT), assume UTC
    if (!isoString.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(isoString)) {
      date = new Date(`${isoString}Z`);
    } else {
      date = new Date(isoString);
    }
  }

  if (isNaN(date.getTime())) {
    throw new Error(`[Normalization] Invalid timestamp representation: "${input}"`);
  }

  return date.toISOString();
}

/**
 * Normalizes input values from arbitrary meteorological provider units to canonical SI units.
 */
export function normalizeUnit(value: number, fromUnit: string, toUnit: string): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return NaN;
  }

  const from = fromUnit.trim().toLowerCase();
  const to = toUnit.trim().toLowerCase();

  if (from === to) {
    return value;
  }

  // --- Temperature Conversions ---
  // Kelvin -> Celsius
  if ((from === 'k' || from === 'kelvin') && (to === '°c' || to === 'c' || to === 'celsius')) {
    return value - 273.15;
  }
  // Celsius -> Kelvin
  if ((from === '°c' || from === 'c' || from === 'celsius') && (to === 'k' || to === 'kelvin')) {
    return value + 273.15;
  }
  // Fahrenheit -> Celsius
  if ((from === '°f' || from === 'f' || from === 'fahrenheit') && (to === '°c' || to === 'c' || to === 'celsius')) {
    return (value - 32) * (5 / 9);
  }
  // Celsius -> Fahrenheit
  if ((from === '°c' || from === 'c' || from === 'celsius') && (to === '°f' || to === 'f' || to === 'fahrenheit')) {
    return (value * 9) / 5 + 32;
  }

  // --- Pressure Conversions ---
  // Pa -> hPa
  if ((from === 'pa' || from === 'pascal') && (to === 'hpa' || to === 'mb' || to === 'millibar')) {
    return value / 100;
  }
  // hPa -> Pa
  if ((from === 'hpa' || from === 'mb' || from === 'millibar') && (to === 'pa' || to === 'pascal')) {
    return value * 100;
  }
  // inHg -> hPa
  if (from === 'inhg' && (to === 'hpa' || to === 'mb')) {
    return value * 33.863886666667;
  }

  // --- Wind Velocity Conversions ---
  // km/h -> m/s
  if ((from === 'km/h' || from === 'kmh' || from === 'kph') && (to === 'm/s' || to === 'ms')) {
    return value / 3.6;
  }
  // m/s -> km/h
  if ((to === 'km/h' || to === 'kmh' || to === 'kph') && (from === 'm/s' || from === 'ms')) {
    return value * 3.6;
  }
  // knots -> m/s
  if ((from === 'kt' || from === 'knot' || from === 'knots') && (to === 'm/s' || to === 'ms')) {
    return value * 0.514444;
  }
  // mph -> m/s
  if ((from === 'mph' || from === 'mi/h') && (to === 'm/s' || to === 'ms')) {
    return value * 0.44704;
  }

  // --- Precipitation Conversions ---
  // inches -> mm
  if ((from === 'in' || from === 'inch' || from === 'inches') && (to === 'mm' || to === 'millimeter')) {
    return value * 25.4;
  }
  // mm -> inches
  if ((from === 'mm' || from === 'millimeter') && (to === 'in' || to === 'inch' || to === 'inches')) {
    return value / 25.4;
  }

  // Fallback: If no direct conversion matched, return original value to avoid data destruction
  return value;
}

/**
 * Validates and normalizes latitude and longitude coordinates into standard WGS84 range.
 * Converts 0°..360° longitude grid system (common in GFS/ECMWF NWP grids) to canonical -180°..+180°.
 */
export function normalizeCoordinates(
  lat: number,
  lon: number
): { latitude: number; longitude: number; isValid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return { latitude: 0, longitude: 0, isValid: false, error: 'Coordinates contain NaN or non-numeric values' };
  }

  // Latitude must strictly be within [-90, +90]
  if (lat < -90 || lat > 90) {
    return {
      latitude: Math.max(-90, Math.min(90, lat)),
      longitude: lon,
      isValid: false,
      error: `Latitude ${lat} is out of valid bounds [-90, 90]`,
    };
  }

  // Handle 0°..360° coordinate longitude wrapping to [-180, +180]
  let normalizedLon = lon;
  if (normalizedLon > 180 && normalizedLon <= 360) {
    normalizedLon = normalizedLon - 360;
  } else if (normalizedLon < -180) {
    normalizedLon = ((normalizedLon + 180) % 360) - 180;
  } else if (normalizedLon > 180) {
    normalizedLon = ((normalizedLon - 180) % 360) + 180;
  }

  return {
    latitude: Math.round(lat * 100000) / 100000,
    longitude: Math.round(normalizedLon * 100000) / 100000,
    isValid: true,
  };
}

/**
 * Validates whether a normalized value falls within meteorologically physically possible limits.
 */
export function validatePhysicalBounds(
  variable: WeatherVariable,
  value: number
): { isValid: boolean; flags: string[]; reason?: string } {
  const bounds = PHYSICAL_ATMOSPHERIC_BOUNDS[variable];
  if (!bounds) {
    return { isValid: true, flags: ['NO_KNOWN_BOUNDS'] };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return {
      isValid: false,
      flags: ['VALUE_IS_NAN'],
      reason: `${variable} reading is NaN`,
    };
  }

  if (value < bounds.min) {
    return {
      isValid: false,
      flags: ['PHYSICAL_MIN_VIOLATION'],
      reason: `${variable} value (${value} ${bounds.unit}) is below physical limit (${bounds.min} ${bounds.unit})`,
    };
  }

  if (value > bounds.max) {
    return {
      isValid: false,
      flags: ['PHYSICAL_MAX_VIOLATION'],
      reason: `${variable} value (${value} ${bounds.unit}) is above physical limit (${bounds.max} ${bounds.unit})`,
    };
  }

  return {
    isValid: true,
    flags: ['PHYSICAL_LIMITS_PASS'],
  };
}

/**
 * Normalizes provider model source strings into the canonical ForecastSourceId enum.
 */
export function normalizeSourceId(input: string): ForecastSourceId {
  const cleaned = (input || '').trim().toLowerCase().replace(/[-_\s]/g, '');

  if (cleaned.includes('ecmwf') || cleaned === 'ifs') {
    return 'ECMWF';
  }
  if (cleaned.includes('gfs') || cleaned.includes('ncep')) {
    return 'GFS';
  }
  if (cleaned.includes('icon') || cleaned.includes('dwd')) {
    return 'ICON';
  }
  if (cleaned.includes('graphcast') || cleaned.includes('deepmind')) {
    return 'GRAPHCAST';
  }

  // Default fallback to ECMWF with a warning log
  console.warn(`[Normalization] Unrecognized forecast source identifier: "${input}". Falling back to 'ECMWF'.`);
  return 'ECMWF';
}
