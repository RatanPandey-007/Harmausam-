/**
 * Equal-Weight Baseline Engine (1/N Arithmetic Multi-Model Mean)
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Implements the standard operational benchmark ensemble average:
 * - F_EW = (1 / M_valid) * sum(F_i)
 * - Excludes missing or null values dynamically (missing is NEVER treated as 0)
 * - Renormalizes weights over available valid sources to sum exactly to 1.0
 */

import { ForecastSourceId } from '../types';

export interface EqualWeightResult {
  value: number | null;
  weights: Record<ForecastSourceId, number>;
  validSourceCount: number;
}

export class EqualWeightEngine {
  /**
   * Compute equal-weight mean across valid forecast sources
   */
  public static compute(
    forecasts: Record<ForecastSourceId, number | null | undefined>
  ): EqualWeightResult {
    const allSources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
    const validSources: ForecastSourceId[] = [];

    for (const src of allSources) {
      const v = forecasts[src];
      if (v !== null && v !== undefined && !isNaN(v) && isFinite(v)) {
        validSources.push(src);
      }
    }

    const m = validSources.length;
    const weights: Record<ForecastSourceId, number> = {
      ECMWF: 0,
      GFS: 0,
      ICON: 0,
      GRAPHCAST: 0,
    };

    if (m === 0) {
      return {
        value: null,
        weights,
        validSourceCount: 0,
      };
    }

    const equalWeight = Number((1.0 / m).toFixed(4));
    let sumVal = 0;

    for (const src of validSources) {
      weights[src] = equalWeight;
      sumVal += forecasts[src]!;
    }

    // Fix floating point rounding on weights sum
    const weightSum = validSources.reduce((acc, src) => acc + weights[src], 0);
    const delta = 1.0 - weightSum;
    if (Math.abs(delta) > 0.00001 && validSources.length > 0) {
      weights[validSources[0]] = Number((weights[validSources[0]] + delta).toFixed(4));
    }

    return {
      value: Number((sumVal / m).toFixed(2)),
      weights,
      validSourceCount: m,
    };
  }
}
