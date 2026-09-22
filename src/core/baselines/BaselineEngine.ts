import { ForecastSourceId, WeatherVariable } from '../types';

/**
 * Historical precomputed optimal fixed weights derived from linear regression
 * over standard multi-year training splits (no temporal lookahead).
 */
export const HISTORICAL_FIXED_WEIGHTS: Record<WeatherVariable, Record<ForecastSourceId, number>> = {
  temperature_2m: {
    ECMWF: 0.38,
    GFS: 0.28,
    ICON: 0.18,
    GRAPHCAST: 0.16
  },
  precipitation: {
    ECMWF: 0.42,
    GFS: 0.24,
    ICON: 0.24,
    GRAPHCAST: 0.10 // AI models traditionally struggle more with convective precip extremes
  },
  wind_speed_10m: {
    ECMWF: 0.36,
    GFS: 0.26,
    ICON: 0.26,
    GRAPHCAST: 0.12
  },
  relative_humidity_2m: {
    ECMWF: 0.34,
    GFS: 0.28,
    ICON: 0.24,
    GRAPHCAST: 0.14
  },
  surface_pressure: {
    ECMWF: 0.36,
    GFS: 0.28,
    ICON: 0.20,
    GRAPHCAST: 0.16
  }
};

export class BaselineEngine {
  /**
   * Compute Equal-Weight Multi-Model Ensemble Average: F_EM = (1/M) * sum(F_i)
   */
  public static computeEqualWeight(forecasts: Record<ForecastSourceId, number>): number {
    const values = Object.values(forecasts);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return Number((sum / values.length).toFixed(2));
  }

  /**
   * Compute Fixed-Weight Historical Blend: F_Fixed = sum(w_i * F_i)
   */
  public static computeFixedWeight(
    forecasts: Record<ForecastSourceId, number>,
    variable: WeatherVariable
  ): { value: number; weights: Record<ForecastSourceId, number> } {
    const weights = HISTORICAL_FIXED_WEIGHTS[variable] || {
      ECMWF: 0.25,
      GFS: 0.25,
      ICON: 0.25,
      GRAPHCAST: 0.25
    };

    let blended = 0;
    let weightSum = 0;

    for (const [source, val] of Object.entries(forecasts) as [ForecastSourceId, number][]) {
      const w = weights[source] ?? 0.25;
      blended += val * w;
      weightSum += w;
    }

    const finalVal = weightSum > 0 ? blended / weightSum : 0;
    return {
      value: Number(finalVal.toFixed(2)),
      weights
    };
  }
}
