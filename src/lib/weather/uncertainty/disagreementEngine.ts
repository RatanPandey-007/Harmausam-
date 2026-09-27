/**
 * Model Disagreement & Forecast Dispersion Engine
 * Harmausam Meteorological Intelligence Platform — Phase 5
 *
 * Implements deterministic calculation of multi-model consensus metrics:
 * - Valid source filtering (missing sources are NEVER treated as 0)
 * - Arithmetic consensus mean
 * - Minimum, maximum, and range (spread)
 * - Sample standard deviation (dispersion sigma)
 * - Single-source and zero-data state handling
 * - Transparent classification against historical spread baseline
 */

import { ForecastSourceId, WeatherVariable } from '../types';
import {
  ModelDisagreement,
  HistoricalDisagreement,
  DisagreementClassification,
  DisagreementStatus,
} from './types';

export interface ComputeDisagreementInput {
  forecasts: Record<ForecastSourceId, number | null | undefined>;
  timestamp: string;
  stationId: string;
  latitude: number;
  longitude: number;
  variable: WeatherVariable;
  leadTimeHours: number;
  historicalBaseline?: HistoricalDisagreement | null;
}

export const SOURCE_METADATA_REGISTRY: Record<
  ForecastSourceId,
  { name: string; institution: string; isDemonstration: boolean }
> = {
  ECMWF: {
    name: 'ECMWF IFS',
    institution: 'European Centre for Medium-Range Weather Forecasts',
    isDemonstration: false,
  },
  GFS: {
    name: 'NOAA GFS',
    institution: 'National Oceanic and Atmospheric Administration',
    isDemonstration: false,
  },
  ICON: {
    name: 'DWD ICON Global',
    institution: 'Deutscher Wetterdienst',
    isDemonstration: false,
  },
  GRAPHCAST: {
    name: 'DeepMind GraphCast AI',
    institution: 'Google DeepMind & ECMWF Collaboration',
    isDemonstration: true,
  },
};

export class DisagreementEngine {
  /**
   * Computes multi-model disagreement and dispersion metrics
   */
  public static compute(input: ComputeDisagreementInput): ModelDisagreement {
    const {
      forecasts,
      timestamp,
      stationId,
      latitude,
      longitude,
      variable,
      leadTimeHours,
      historicalBaseline,
    } = input;

    const allSources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
    const validSources: ForecastSourceId[] = [];
    const sourceValues: Record<ForecastSourceId, number | null> = {
      ECMWF: null,
      GFS: null,
      ICON: null,
      GRAPHCAST: null,
    };

    // 1. Valid source filtering: strictly exclude null, undefined, NaN, and non-finite numbers
    for (const src of allSources) {
      const val = forecasts[src];
      if (val !== null && val !== undefined && !isNaN(val) && isFinite(val)) {
        validSources.push(src);
        sourceValues[src] = val;
      }
    }

    const validCount = validSources.length;

    // 2. State: No valid sources available
    if (validCount === 0) {
      return {
        timestamp,
        stationId,
        latitude,
        longitude,
        variable,
        leadTimeHours,
        validSourceCount: 0,
        mean: null,
        minimum: null,
        maximum: null,
        range: null,
        standardDeviation: null,
        sourceValues,
        sourceMetadata: SOURCE_METADATA_REGISTRY,
        disagreementLevel: 'UNKNOWN',
        classificationReason: 'No valid forecast sources available for this lead-time step.',
        status: 'UNAVAILABLE_NO_DATA',
        provenance: {
          calculationMethod: 'None (no data available)',
          sampleSizeUsed: 0,
          timestampComputed: new Date().toISOString(),
        },
      };
    }

    // 3. State: Single source available (disagreement cannot be mathematically defined)
    if (validCount === 1) {
      const singleVal = sourceValues[validSources[0]]!;
      return {
        timestamp,
        stationId,
        latitude,
        longitude,
        variable,
        leadTimeHours,
        validSourceCount: 1,
        mean: singleVal,
        minimum: singleVal,
        maximum: singleVal,
        range: 0,
        standardDeviation: null,
        sourceValues,
        sourceMetadata: SOURCE_METADATA_REGISTRY,
        disagreementLevel: 'UNKNOWN',
        classificationReason: 'Disagreement unavailable: only one valid source.',
        status: 'UNAVAILABLE_SINGLE_SOURCE',
        provenance: {
          calculationMethod: 'Single-source bypass (dispersion undefined)',
          sampleSizeUsed: 1,
          timestampComputed: new Date().toISOString(),
        },
      };
    }

    // 4. Multi-source consensus calculation (validCount >= 2)
    const values = validSources.map(s => sourceValues[s]!);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = Number((sum / validCount).toFixed(2));
    const minVal = Number(Math.min(...values).toFixed(2));
    const maxVal = Number(Math.max(...values).toFixed(2));
    const rangeVal = Number((maxVal - minVal).toFixed(2));

    // Sample standard deviation: sigma = sqrt((1 / (M - 1)) * sum((y_i - mean)^2))
    const sumSquaredDiffs = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
    const stdDev = Number(Math.sqrt(sumSquaredDiffs / (validCount - 1)).toFixed(2));

    // 5. Categorical classification vs Historical Spread Baseline
    const { level, reason } = this.classifyAgainstBaseline(stdDev, historicalBaseline);

    return {
      timestamp,
      stationId,
      latitude,
      longitude,
      variable,
      leadTimeHours,
      validSourceCount: validCount,
      mean,
      minimum: minVal,
      maximum: maxVal,
      range: rangeVal,
      standardDeviation: stdDev,
      sourceValues,
      sourceMetadata: SOURCE_METADATA_REGISTRY,
      disagreementLevel: level,
      classificationReason: reason,
      status: 'COMPUTED',
      provenance: {
        calculationMethod: `Sample standard deviation (M=${validCount} valid sources)`,
        sampleSizeUsed: validCount,
        timestampComputed: new Date().toISOString(),
      },
    };
  }

  /**
   * Transparently classifies the current spread against historical distribution (N_min = 10)
   */
  private static classifyAgainstBaseline(
    currentSpread: number,
    baseline?: HistoricalDisagreement | null
  ): { level: DisagreementClassification; reason: string } {
    if (!baseline || baseline.sampleCount < 10) {
      return {
        level: 'UNKNOWN',
        reason: `Disagreement classification unavailable: insufficient historical baseline samples (${
          baseline?.sampleCount ?? 0
        } < 10).`,
      };
    }

    const { medianSpread, spreadStdDev, sampleCount, region, weatherRegime } = baseline;
    const std = Math.max(0.1, spreadStdDev);

    if (currentSpread <= medianSpread - 0.5 * std) {
      return {
        level: 'LOW',
        reason: `Current spread (σ=${currentSpread}) is below historical median (${medianSpread.toFixed(
          2
        )}) for ${region} in ${weatherRegime} (N=${sampleCount}).`,
      };
    } else if (currentSpread <= medianSpread + 0.5 * std) {
      return {
        level: 'NORMAL',
        reason: `Current spread (σ=${currentSpread}) is consistent with typical historical spread (${medianSpread.toFixed(
          2
        )} ± ${(0.5 * std).toFixed(2)}) (N=${sampleCount}).`,
      };
    } else if (currentSpread <= medianSpread + 1.5 * std) {
      return {
        level: 'ELEVATED',
        reason: `Current spread (σ=${currentSpread}) is elevated (> +0.5σ above median ${medianSpread.toFixed(
          2
        )}) indicating increased model disagreement (N=${sampleCount}).`,
      };
    } else {
      return {
        level: 'HIGH',
        reason: `Current spread (σ=${currentSpread}) is unusually high (> +1.5σ above median ${medianSpread.toFixed(
          2
        )}) reflecting severe inter-model divergence (N=${sampleCount}).`,
      };
    }
  }
}
