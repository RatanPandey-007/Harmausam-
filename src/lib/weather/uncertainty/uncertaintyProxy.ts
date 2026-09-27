/**
 * Conservative Uncertainty Proxy Engine
 * Harmausam Meteorological Intelligence Platform — Phase 5
 *
 * Implements a scientifically conservative uncertainty proxy derived from:
 * 1. Historical contextual error scale (MAE / RMSE from Phase 4)
 * 2. Multi-model dispersion (spread sigma from Phase 5)
 *
 * Strict Rule: Never labels this a "90% confidence interval" or "predictive certainty"
 * unless calibrated with rigorous probabilistic verification (e.g. PIT histograms / CRPS).
 */

import { UncertaintyProxy } from './types';

export interface UncertaintyProxyInput {
  blendedValue: number;
  historicalMae: number;
  modelSpread: number | null;
  unit?: string;
  variableName?: string;
}

export class UncertaintyProxyEngine {
  /**
   * Generates a conservative, transparent uncertainty proxy
   */
  public static generate(input: UncertaintyProxyInput): UncertaintyProxy {
    const { blendedValue, historicalMae, modelSpread, unit = '°C' } = input;

    // Use contextual historical error scale (MAE) as the primary error scale factor
    // When model spread is elevated, combine spread with historical error scale
    const spreadComponent = modelSpread !== null ? modelSpread * 0.5 : 0;
    const effectiveScale = Number((historicalMae + spreadComponent).toFixed(2));

    const lowerBound = Number((blendedValue - effectiveScale).toFixed(2));
    const upperBound = Number((blendedValue + effectiveScale).toFixed(2));

    const note = modelSpread !== null
      ? `Uncertainty proxy [${lowerBound}${unit}, ${upperBound}${unit}] derived from contextual historical MAE (${historicalMae.toFixed(
          2
        )}${unit}) and model dispersion (σ=${modelSpread.toFixed(
          2
        )}${unit}). This is an empirical error scale proxy, NOT a calibrated Gaussian confidence interval.`
      : `Uncertainty proxy [${lowerBound}${unit}, ${upperBound}${unit}] derived from contextual historical MAE (${historicalMae.toFixed(
          2
        )}${unit}). Single-source regime; inter-model dispersion unavailable.`;

    return {
      centerValue: blendedValue,
      proxyBounds: [lowerBound, upperBound],
      errorScale: effectiveScale,
      scaleType: 'CONTEXTUAL_HISTORICAL_MAE',
      methodologyNote: note,
      isCalibratedProbability: false,
    };
  }
}
