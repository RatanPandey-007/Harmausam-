/**
 * Skill Metrics & Verification Error Functions
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Implements deterministic meteorological error evaluation:
 * - Mean Absolute Error (MAE)
 * - Root Mean Square Error (RMSE)
 * - Mean Bias Error (MBE / Bias)
 * - Sample Dispersion (Standard Deviation across model forecasts)
 * - Chronological sample validation with strict null exclusion (never 0-filled)
 */

export interface MetricEvaluationResult {
  sampleCount: number;
  mae: number;
  rmse: number;
  bias: number;
  variance: number;
}

/**
 * Filter paired forecast-observation vectors, strictly eliminating any null,
 * undefined, or non-finite values without synthetic imputation.
 */
export function filterValidPairs(
  forecasts: (number | null | undefined)[],
  observations: (number | null | undefined)[]
): { validForecasts: number[]; validObservations: number[] } {
  const minLen = Math.min(forecasts.length, observations.length);
  const validForecasts: number[] = [];
  const validObservations: number[] = [];

  for (let i = 0; i < minLen; i++) {
    const f = forecasts[i];
    const o = observations[i];
    if (
      f !== null &&
      f !== undefined &&
      !isNaN(f) &&
      isFinite(f) &&
      o !== null &&
      o !== undefined &&
      !isNaN(o) &&
      isFinite(o)
    ) {
      validForecasts.push(f);
      validObservations.push(o);
    }
  }

  return { validForecasts, validObservations };
}

/**
 * Calculate Mean Absolute Error (MAE): (1/N) * sum(|f_i - o_i|)
 */
export function calculateMAE(
  forecasts: (number | null | undefined)[],
  observations: (number | null | undefined)[]
): number {
  const { validForecasts, validObservations } = filterValidPairs(forecasts, observations);
  const n = validForecasts.length;
  if (n === 0) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.abs(validForecasts[i] - validObservations[i]);
  }
  return Number((sum / n).toFixed(3));
}

/**
 * Calculate Root Mean Square Error (RMSE): sqrt((1/N) * sum((f_i - o_i)^2))
 */
export function calculateRMSE(
  forecasts: (number | null | undefined)[],
  observations: (number | null | undefined)[]
): number {
  const { validForecasts, validObservations } = filterValidPairs(forecasts, observations);
  const n = validForecasts.length;
  if (n === 0) return 0;

  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const diff = validForecasts[i] - validObservations[i];
    sumSq += diff * diff;
  }
  return Number(Math.sqrt(sumSq / n).toFixed(3));
}

/**
 * Calculate Mean Bias Error (MBE / Bias): (1/N) * sum(f_i - o_i)
 * Positive = Overforecasting, Negative = Underforecasting
 */
export function calculateBias(
  forecasts: (number | null | undefined)[],
  observations: (number | null | undefined)[]
): number {
  const { validForecasts, validObservations } = filterValidPairs(forecasts, observations);
  const n = validForecasts.length;
  if (n === 0) return 0;

  let sumDiff = 0;
  for (let i = 0; i < n; i++) {
    sumDiff += validForecasts[i] - validObservations[i];
  }
  return Number((sumDiff / n).toFixed(3));
}

/**
 * Comprehensive continuous metric evaluation for a paired series
 */
export function evaluateSeriesMetrics(
  forecasts: (number | null | undefined)[],
  observations: (number | null | undefined)[]
): MetricEvaluationResult {
  const { validForecasts, validObservations } = filterValidPairs(forecasts, observations);
  const n = validForecasts.length;
  if (n === 0) {
    return { sampleCount: 0, mae: 0, rmse: 0, bias: 0, variance: 0 };
  }

  let sumAbs = 0;
  let sumSq = 0;
  let sumDiff = 0;

  for (let i = 0; i < n; i++) {
    const diff = validForecasts[i] - validObservations[i];
    sumAbs += Math.abs(diff);
    sumSq += diff * diff;
    sumDiff += diff;
  }

  const meanBias = sumDiff / n;
  const mse = sumSq / n;
  const variance = Math.max(0, mse - meanBias * meanBias);

  return {
    sampleCount: n,
    mae: Number((sumAbs / n).toFixed(3)),
    rmse: Number(Math.sqrt(mse).toFixed(3)),
    bias: Number(meanBias.toFixed(3)),
    variance: Number(variance.toFixed(3)),
  };
}

/**
 * Sample Dispersion / Standard Deviation across multi-model forecast values
 * sigma = sqrt((1 / (M - 1)) * sum((y_m - mean)^2))
 */
export function calculateSampleDispersion(values: (number | null | undefined)[]): number {
  const valid = values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
  const m = valid.length;
  if (m <= 1) return 0;

  const mean = valid.reduce((acc, v) => acc + v, 0) / m;
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (m - 1);
  return Number(Math.sqrt(variance).toFixed(2));
}

/**
 * Calculate Weighted Blend Value: sum(w_i * y_i)
 */
export function calculateWeightedMean(
  values: Record<string, number | null | undefined>,
  weights: Record<string, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, val] of Object.entries(values)) {
    if (val !== null && val !== undefined && !isNaN(val) && isFinite(val)) {
      const w = weights[key] ?? 0;
      weightedSum += val * w;
      totalWeight += w;
    }
  }

  if (totalWeight <= 0) return 0;
  return Number((weightedSum / totalWeight).toFixed(2));
}
