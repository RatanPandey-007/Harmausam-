import { 
  ForecastSourceId, 
  WeatherVariable, 
  WeatherRegime, 
  SourceWeight 
} from '../types';

export interface UncertaintyEvaluation {
  modelSpread: number; // raw ensemble standard deviation
  weightedSpread: number;
  totalStdDev: number; // epistemic + aleatoric
  uncertaintyInterval: {
    lower90: number;
    upper90: number;
    stdDev: number;
  };
  confidenceIndicator: number; // 0-100%
  confidenceTier: 'High' | 'Moderate' | 'Low';
  disagreementLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  methodologyNotes: string[];
}

/** Typical spread normalization scale by variable */
export const TYPICAL_SPREAD_REFERENCE: Record<WeatherVariable, number> = {
  temperature_2m: 2.5, // °C
  precipitation: 6.0,  // mm/3h
  wind_speed_10m: 3.0, // m/s
  relative_humidity_2m: 12.0, // %
  surface_pressure: 3.5 // hPa
};

/** Aleatoric regime-dependent residual uncertainty */
export const REGIME_ALEATORIC_NOISE: Record<WeatherVariable, Record<WeatherRegime, number>> = {
  temperature_2m: {
    'Normal': 0.6,
    'Heatwave': 0.9,
    'Convective / Rapid Change': 1.4,
    'Heavy Rainfall': 1.1,
    'High Wind': 1.0,
    'Extreme Cold': 0.8
  },
  precipitation: {
    'Normal': 0.8,
    'Heavy Rainfall': 3.5,
    'Convective / Rapid Change': 5.2,
    'Heatwave': 0.4,
    'High Wind': 2.8,
    'Extreme Cold': 1.2
  },
  wind_speed_10m: {
    'Normal': 0.7,
    'High Wind': 2.0,
    'Convective / Rapid Change': 2.5,
    'Heavy Rainfall': 1.6,
    'Heatwave': 0.6,
    'Extreme Cold': 1.0
  },
  relative_humidity_2m: {
    'Normal': 4.0,
    'Convective / Rapid Change': 8.5,
    'Heavy Rainfall': 6.0,
    'Heatwave': 4.5,
    'High Wind': 5.5,
    'Extreme Cold': 5.0
  },
  surface_pressure: {
    'Normal': 0.8,
    'High Wind': 1.8,
    'Convective / Rapid Change': 2.2,
    'Heavy Rainfall': 1.5,
    'Heatwave': 0.7,
    'Extreme Cold': 1.0
  }
};

export class UncertaintyEngine {
  /**
   * Quantify epistemic model disagreement, aleatoric atmospheric variance,
   * 90% confidence intervals, and calibrated confidence score.
   */
  public static evaluate(
    forecasts: Record<ForecastSourceId, number>,
    weights: Record<ForecastSourceId, SourceWeight>,
    blendedValue: number,
    variable: WeatherVariable,
    regime: WeatherRegime
  ): UncertaintyEvaluation {
    const values = Object.values(forecasts);
    const n = values.length;
    const notes: string[] = [];

    if (n === 0) {
      return {
        modelSpread: 0,
        weightedSpread: 0,
        totalStdDev: 1,
        uncertaintyInterval: { lower90: blendedValue, upper90: blendedValue, stdDev: 1 },
        confidenceIndicator: 50,
        confidenceTier: 'Moderate',
        disagreementLevel: 'Low',
        methodologyNotes: ['No forecast values available.']
      };
    }

    // 1. Raw Ensemble Spread (Standard Deviation across models)
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const rawSpread = Math.sqrt(variance);

    // 2. Weighted Epistemic Disagreement
    let weightedVarSum = 0;
    for (const [src, val] of Object.entries(forecasts) as [ForecastSourceId, number][]) {
      const w = weights[src]?.weight ?? (1 / n);
      weightedVarSum += w * Math.pow(val - blendedValue, 2);
    }
    const weightedSpread = Math.sqrt(weightedVarSum);

    // 3. Aleatoric Unresolvable Atmospheric Chaos
    const aleatoricNoise = REGIME_ALEATORIC_NOISE[variable]?.[regime] ?? 1.0;

    // 4. Combined Total Predictive Standard Deviation S = sqrt(sigma_epistemic^2 + sigma_aleatoric^2)
    const totalStdDev = Math.sqrt(Math.pow(weightedSpread, 2) + Math.pow(aleatoricNoise, 2));

    // 5. 90% Confidence Interval (Z_0.95 = 1.645)
    const z90 = 1.645;
    const lower90 = Number((blendedValue - z90 * totalStdDev).toFixed(2));
    const upper90 = Number((blendedValue + z90 * totalStdDev).toFixed(2));

    // 6. Calibrated Confidence Indicator (tied strictly to spread vs climatological typical spread)
    const typicalSpread = TYPICAL_SPREAD_REFERENCE[variable] || 3.0;
    // Ratio of observed spread to expected spread
    const spreadRatio = rawSpread / typicalSpread;

    // Confidence decreases linearly with spread ratio and regime complexity
    const rawConfidence = Math.max(0.05, Math.min(0.98, 1.0 - (spreadRatio * 0.45) - (aleatoricNoise / (typicalSpread * 2.5))));
    const confidenceIndicator = Math.round(rawConfidence * 100);

    // Confidence Tier
    let confidenceTier: UncertaintyEvaluation['confidenceTier'] = 'Moderate';
    if (confidenceIndicator >= 75) confidenceTier = 'High';
    else if (confidenceIndicator < 45) confidenceTier = 'Low';

    // Disagreement Level
    let disagreementLevel: UncertaintyEvaluation['disagreementLevel'] = 'Low';
    if (spreadRatio >= 1.8) disagreementLevel = 'Severe';
    else if (spreadRatio >= 1.2) disagreementLevel = 'High';
    else if (spreadRatio >= 0.7) disagreementLevel = 'Moderate';

    notes.push(`Raw ensemble spread: σ = ${rawSpread.toFixed(2)} across ${n} models.`);
    notes.push(`Weighted epistemic spread: σ_w = ${weightedSpread.toFixed(2)}.`);
    notes.push(`Aleatoric regime residual for ${regime}: σ_res = ${aleatoricNoise.toFixed(2)}.`);
    notes.push(`Confidence interval (90%): [${lower90}, ${upper90}] (Z=1.645, total σ=${totalStdDev.toFixed(2)}).`);

    return {
      modelSpread: Number(rawSpread.toFixed(2)),
      weightedSpread: Number(weightedSpread.toFixed(2)),
      totalStdDev: Number(totalStdDev.toFixed(2)),
      uncertaintyInterval: {
        lower90,
        upper90,
        stdDev: Number(totalStdDev.toFixed(2))
      },
      confidenceIndicator,
      confidenceTier,
      disagreementLevel,
      methodologyNotes: notes
    };
  }
}
