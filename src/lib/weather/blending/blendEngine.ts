/**
 * Multi-Baseline Blend Orchestration Engine
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Implements simultaneous calculation of all 4 research baselines:
 * 1. Raw Individual Sources (ECMWF, GFS, ICON, GraphCast Demo)
 * 2. Equal-Weight Ensemble Mean (1/N valid sources)
 * 3. Fixed-Weight Constrained Historical OLS
 * 4. Adaptive Context-Aware Softmax Blend
 *
 * Derives empirical ensemble spread, 90% uncertainty intervals,
 * and out-of-sample ground truth verification errors.
 */

import { ForecastSourceId, WeatherVariable, StationLocation } from '../types';
import { BlendingContext } from '../context/contextEngine';
import { calculateSampleDispersion } from '../skill/metrics';
import { EqualWeightEngine } from './equalWeight';
import { FixedWeightEngine } from './fixedWeight';
import { AdaptiveWeightEngine } from './adaptiveWeight';
import { WeightExplanationGenerator } from './weightExplanation';
import { BlendedForecastOutput } from './types';
import { DisagreementEngine } from '../uncertainty/disagreementEngine';
import { historicalDisagreementStore } from '../uncertainty/historicalDisagreementStore';
import { UncertaintyProxyEngine } from '../uncertainty/uncertaintyProxy';
import { UncertaintyExplanationGenerator } from '../uncertainty/uncertaintyExplanation';


export interface BlendComputeInput {
  variable: WeatherVariable;
  timestamp: string;
  leadTimeHours: number;
  station: StationLocation;
  context: BlendingContext;
  individualForecasts: Record<ForecastSourceId, number | null | undefined>;
  observationValue?: number | null;
  unit?: string;
}

export class BlendEngine {
  /**
   * Compute full multi-baseline forecast result
   */
  public static compute(input: BlendComputeInput): BlendedForecastOutput {
    const {
      variable,
      timestamp,
      leadTimeHours,
      station,
      context,
      individualForecasts,
      observationValue,
      unit = '°C',
    } = input;

    const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];

    // 1. Equal-Weight Baseline (1/N)
    const ewResult = EqualWeightEngine.compute(individualForecasts);

    // 2. Fixed-Weight Baseline (Constrained Historical OLS)
    const fwResult = FixedWeightEngine.compute(individualForecasts, variable);

    // 3. Adaptive Context-Aware Softmax Blend
    const adaptiveResult = AdaptiveWeightEngine.calculateWeights(context, individualForecasts);

    // Calculate adaptive blended point estimate
    let adaptiveVal: number | null = null;
    let sumAdaptive = 0;
    let validWeightSum = 0;

    for (const src of sources) {
      const v = individualForecasts[src];
      const w = adaptiveResult.weights[src]?.weight ?? 0;
      if (v !== null && v !== undefined && !isNaN(v) && isFinite(v)) {
        sumAdaptive += v * w;
        validWeightSum += w;
      }
    }

    if (validWeightSum > 0) {
      adaptiveVal = Number((sumAdaptive / validWeightSum).toFixed(2));
    }

    // 4. Model Disagreement Spread (Standard Deviation sigma)
    const validVals = sources
      .map(s => individualForecasts[s])
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
    const modelSpread = calculateSampleDispersion(validVals);

    // 5. 90% Gaussian Uncertainty Interval: [mean - 1.645 * sigma, mean + 1.645 * sigma]
    const centerVal = adaptiveVal ?? ewResult.value ?? 0;
    const effectiveSigma = Math.max(0.4, modelSpread);
    const lower90 = Number((centerVal - 1.645 * effectiveSigma).toFixed(2));
    const upper90 = Number((centerVal + 1.645 * effectiveSigma).toFixed(2));

    // 6. Confidence Indicator (0 - 100%)
    // Base 95% diminished by high spread and lower hierarchy levels
    let confidenceScore = 95 - modelSpread * 6;
    if (adaptiveResult.hierarchyLevel !== 'LEVEL_1_EXACT_CONTEXT') {
      confidenceScore -= 10;
    }
    if (adaptiveResult.effectiveSampleCount < 30) {
      confidenceScore -= 8;
    }
    confidenceScore = Math.max(25, Math.min(98, Math.round(confidenceScore)));

    const confidenceTier: 'High' | 'Moderate' | 'Low' =
      confidenceScore >= 80 ? 'High' : confidenceScore >= 55 ? 'Moderate' : 'Low';

    // 7. Textual Justification
    const explanation = WeightExplanationGenerator.generateSummary(adaptiveResult, context, unit);

    // 8. Ground Truth Verification Errors (Out-of-sample evaluation)
    let baselineErrors: BlendedForecastOutput['baselineErrors'] = undefined;
    if (observationValue !== null && observationValue !== undefined && !isNaN(observationValue)) {
      const obs = observationValue;
      baselineErrors = {
        ecmwfError:
          individualForecasts.ECMWF !== null && individualForecasts.ECMWF !== undefined
            ? Number(Math.abs(individualForecasts.ECMWF - obs).toFixed(2))
            : null,
        gfsError:
          individualForecasts.GFS !== null && individualForecasts.GFS !== undefined
            ? Number(Math.abs(individualForecasts.GFS - obs).toFixed(2))
            : null,
        iconError:
          individualForecasts.ICON !== null && individualForecasts.ICON !== undefined
            ? Number(Math.abs(individualForecasts.ICON - obs).toFixed(2))
            : null,
        graphcastError:
          individualForecasts.GRAPHCAST !== null && individualForecasts.GRAPHCAST !== undefined
            ? Number(Math.abs(individualForecasts.GRAPHCAST - obs).toFixed(2))
            : null,
        equalWeightError:
          ewResult.value !== null ? Number(Math.abs(ewResult.value - obs).toFixed(2)) : null,
        fixedWeightError:
          fwResult.value !== null ? Number(Math.abs(fwResult.value - obs).toFixed(2)) : null,
        adaptiveError:
          adaptiveVal !== null ? Number(Math.abs(adaptiveVal - obs).toFixed(2)) : null,
      };
    }

    const cleanIndividual: Record<ForecastSourceId, number | null> = {
      ECMWF: individualForecasts.ECMWF ?? null,
      GFS: individualForecasts.GFS ?? null,
      ICON: individualForecasts.ICON ?? null,
      GRAPHCAST: individualForecasts.GRAPHCAST ?? null,
    };

    // Phase 5: Historical Disagreement Baseline & Distribution
    const historicalDisagreement = historicalDisagreementStore.getBaselineForContext(
      {
        variable,
        region: context.regionId,
        season: context.season,
        leadTimeHours,
        weatherRegime: context.detectedRegime,
      },
      timestamp
    );

    // Phase 5: Multi-Model Disagreement Engine
    const disagreement = DisagreementEngine.compute({
      forecasts: individualForecasts,
      timestamp,
      stationId: station.id,
      latitude: station.latitude,
      longitude: station.longitude,
      variable,
      leadTimeHours,
      historicalBaseline: historicalDisagreement,
    });

    // Phase 5: Conservative Uncertainty Proxy (labeled empirical proxy)
    const topMae = adaptiveResult.weights.ECMWF?.historicalMae ?? 1.2;
    const uncertaintyProxy = UncertaintyProxyEngine.generate({
      blendedValue: centerVal,
      historicalMae: topMae,
      modelSpread: disagreement.standardDeviation,
      unit,
      variableName: variable,
    });

    // Phase 5: Factual Uncertainty Explanation Generator
    const uncertaintyExplanation = UncertaintyExplanationGenerator.generate({
      disagreement,
      historicalBaseline: historicalDisagreement,
      historicalMae: topMae,
      context,
      unit,
    });

    return {
      variable,
      timestamp,
      leadTimeHours,
      station,
      context,
      individualForecasts: cleanIndividual,
      equalWeightForecast: ewResult.value,
      fixedWeightForecast: fwResult.value,
      adaptiveBlendedForecast: adaptiveVal,
      equalWeights: ewResult.weights,
      fixedWeights: fwResult.result.weights,
      adaptiveWeights: adaptiveResult.weights,
      hierarchyLevel: adaptiveResult.hierarchyLevel,
      effectiveSampleCount: adaptiveResult.effectiveSampleCount,
      explanation,
      modelSpread,
      uncertaintyInterval: {
        lower90,
        upper90,
        stdDev: effectiveSigma,
      },
      confidenceIndicator: confidenceScore,
      confidenceTier,
      observationValue: observationValue ?? null,
      baselineErrors,
      disagreement,
      uncertaintyProxy,
      uncertaintyExplanation,
    };
  }
}

