import { WeatherVariable, QCResult } from '../types';

export interface PhysicalLimit {
  min: number;
  max: number;
  maxDeltaPerHour: number;
  unit: string;
}

export const PHYSICAL_LIMITS: Record<WeatherVariable, PhysicalLimit> = {
  temperature_2m: {
    min: -75.0, // °C (Earth record -89.2°C at Vostok, -75 is realistic operational bound)
    max: 58.0,  // °C
    maxDeltaPerHour: 12.0, // °C/hr
    unit: '°C'
  },
  precipitation: {
    min: 0.0,
    max: 350.0, // mm (3-hourly accumulated extreme)
    maxDeltaPerHour: 150.0,
    unit: 'mm'
  },
  wind_speed_10m: {
    min: 0.0,
    max: 110.0, // m/s (~400 km/h, Cat 5 cyclone max gusts)
    maxDeltaPerHour: 35.0,
    unit: 'm/s'
  },
  relative_humidity_2m: {
    min: 0.0,
    max: 100.0, // %
    maxDeltaPerHour: 50.0,
    unit: '%'
  },
  surface_pressure: {
    min: 870.0, // hPa (Typhoon Tip record low 870 hPa)
    max: 1085.0,// hPa (Agata Siberia record high 1083.8 hPa)
    maxDeltaPerHour: 20.0,
    unit: 'hPa'
  }
};

/**
 * Quality Control Engine for Meteorological Forecast & Observational Data
 */
export class QualityControlEngine {
  /**
   * Run multi-stage physical and sanity checks on a variable
   */
  public static validate(
    variable: WeatherVariable,
    value: number,
    previousValue?: number,
    elevationDeltaMeters: number = 0
  ): QCResult {
    const limits = PHYSICAL_LIMITS[variable];
    const flags: string[] = [];
    let corrected = value;
    let passed = true;

    // 1. NaN or Infinite check
    if (isNaN(value) || !isFinite(value)) {
      return {
        passed: false,
        flags: ['QC_INVALID_NUMBER'],
        originalValue: value,
        correctedValue: limits.min
      };
    }

    // 2. Physical range bounds
    if (value < limits.min) {
      flags.push(`QC_BELOW_PHYSICAL_MIN: ${value} < ${limits.min} ${limits.unit}`);
      corrected = limits.min;
      passed = false;
    } else if (value > limits.max) {
      flags.push(`QC_ABOVE_PHYSICAL_MAX: ${value} > ${limits.max} ${limits.unit}`);
      corrected = limits.max;
      passed = false;
    }

    // 3. Temporal spike rate check (if prior timestep available)
    if (previousValue !== undefined && !isNaN(previousValue)) {
      const delta = Math.abs(value - previousValue);
      if (delta > limits.maxDeltaPerHour) {
        flags.push(`QC_EXCESSIVE_RATE_OF_CHANGE: delta ${delta.toFixed(1)} > ${limits.maxDeltaPerHour}`);
        // Flag for analyst scrutiny, but retain bounded value
      }
    }

    // 4. Elevation Lapse-Rate sanity adjustment
    // Standard tropospheric lapse rate: 6.5 °C / 1000m
    if (variable === 'temperature_2m' && Math.abs(elevationDeltaMeters) > 50) {
      const lapseCorrection = -(elevationDeltaMeters / 1000.0) * 6.5;
      corrected = Number((corrected + lapseCorrection).toFixed(2));
      flags.push(`QC_LAPSE_ADJUSTED: ${elevationDeltaMeters}m (${lapseCorrection > 0 ? '+' : ''}${lapseCorrection.toFixed(2)}°C)`);
    }

    // 5. Barometric hypsometric formula for pressure elevation adjustment
    if (variable === 'surface_pressure' && Math.abs(elevationDeltaMeters) > 50) {
      // Hydrostatic approximation: ~1 hPa per 8.3m near sea level
      const pCorrection = -(elevationDeltaMeters / 8.3);
      corrected = Number((corrected + pCorrection).toFixed(1));
      flags.push(`QC_PRESSURE_ELEVATION_ADJUSTED: ${elevationDeltaMeters}m (${pCorrection.toFixed(1)} hPa)`);
    }

    if (flags.length === 0) {
      flags.push('QC_PASSED_CLEAN');
    }

    return {
      passed,
      flags,
      originalValue: value,
      correctedValue: corrected !== value ? corrected : undefined
    };
  }
}
