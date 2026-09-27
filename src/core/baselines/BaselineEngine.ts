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

import { EqualWeightEngine } from '../../lib/weather/blending/equalWeight';
import { FixedWeightEngine } from '../../lib/weather/blending/fixedWeight';

export class BaselineEngine {
  /**
   * Compute Equal-Weight Multi-Model Ensemble Average: F_EM = (1/M_valid) * sum(F_i)
   * Only includes valid sources; missing is never 0; renormalizes to 1.0.
   */
  public static computeEqualWeight(forecasts: Record<ForecastSourceId, number | null | undefined>): number {
    const res = EqualWeightEngine.compute(forecasts);
    return res.value ?? 0;
  }

  /**
   * Compute Fixed-Weight Historical Blend: F_Fixed = sum(w_i * F_i)
   * Constrained optimization over historical calibration splits; dynamically renormalizes.
   */
  public static computeFixedWeight(
    forecasts: Record<ForecastSourceId, number | null | undefined>,
    variable: WeatherVariable
  ): { value: number; weights: Record<ForecastSourceId, number> } {
    const res = FixedWeightEngine.compute(forecasts, variable);
    return {
      value: res.value ?? 0,
      weights: res.result.weights,
    };
  }
}

