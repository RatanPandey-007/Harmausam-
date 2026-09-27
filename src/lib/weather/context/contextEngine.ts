/**
 * Context Engine Orchestrator
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Unifies the multi-dimensional context pipeline:
 * Region + Season + Lead Time + Weather Regime + Ensemble Spread
 */

import { WeatherVariable, WeatherRegime, Season, WeatherContext } from '../types';
import { getSeasonFromTimestamp, getSeasonInfo } from './season';
import { getRegionFromCoordinates, getRegionDisplayName } from './region';
import { classifyWeatherRegime, RegimeEvaluationInput, RegimeEvaluationResult } from './regime';

export interface BlendingContextInput {
  stationId: string;
  latitude: number;
  longitude: number;
  validTimestamp: string;
  leadTimeHours: number;
  variable: WeatherVariable;
  meteorologicalInputs: RegimeEvaluationInput;
  modelSpread: number;
  recentSourceErrors?: Record<string, number>;
}

export interface BlendingContext extends WeatherContext {
  regionId: string;
  regionDisplayName: string;
  seasonInfo: ReturnType<typeof getSeasonInfo>;
  regimeResult: RegimeEvaluationResult;
}

export class ContextEngine {
  /**
   * Evaluates and builds the full multi-dimensional BlendingContext
   */
  public static evaluate(input: BlendingContextInput): BlendingContext {
    const {
      stationId,
      latitude,
      longitude,
      validTimestamp,
      leadTimeHours,
      variable,
      meteorologicalInputs,
      modelSpread,
      recentSourceErrors,
    } = input;

    // 1. Climatological Region
    const regionId = getRegionFromCoordinates(latitude, longitude, stationId);
    const regionDisplayName = getRegionDisplayName(regionId);

    // 2. Climatological Season
    const season = getSeasonFromTimestamp(validTimestamp);
    const seasonInfo = getSeasonInfo(validTimestamp);

    // 3. Atmospheric Regime Classification
    const regimeResult = classifyWeatherRegime({
      ...meteorologicalInputs,
      variable,
      modelSpread,
    });

    // 4. Model Disagreement Severity Level
    let disagreementLevel: WeatherContext['disagreementLevel'] = 'Low';
    if (modelSpread > 5.0) disagreementLevel = 'Severe';
    else if (modelSpread > 3.0) disagreementLevel = 'High';
    else if (modelSpread > 1.5) disagreementLevel = 'Moderate';

    return {
      stationId,
      timestamp: validTimestamp,
      leadTimeHours,
      season,
      variable,
      detectedRegime: regimeResult.regime,
      regimeSignals: regimeResult.activeSignals,
      thermodynamicIndicators: {
        precipIntensity3h: meteorologicalInputs.precipitation3h ?? 0,
        tempAnomalyClimo:
          (meteorologicalInputs.temperature2m ?? 25) -
          (meteorologicalInputs.climatologicalMeanTemp ?? 25),
        windShearProxy: Number(((meteorologicalInputs.windSpeed10m ?? 3) * 1.35).toFixed(1)),
      },
      modelDisagreementSpread: Number(modelSpread.toFixed(2)),
      disagreementLevel,
      recentSourceErrors: recentSourceErrors as any,
      regionId,
      regionDisplayName,
      seasonInfo,
      regimeResult,
    };
  }
}
