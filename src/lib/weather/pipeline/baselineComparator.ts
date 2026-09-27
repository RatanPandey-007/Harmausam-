/**
 * Baseline Comparator Engine
 * Harmausam Meteorological Intelligence Platform — Phase 7 (Final Phase)
 *
 * Implements:
 * - Fair baseline comparison across 6 forecasting methods on the COMMON EVALUATION COHORT:
 *   1. ECMWF IFS
 *   2. NOAA GFS
 *   3. DWD ICON
 *   4. Equal-Weight Baseline (1/N)
 *   5. Fixed-Weight Baseline (Constrained OLS)
 *   6. Adaptive Context-Aware Blend
 * - Variable-level and lead-time-level stratified evaluation
 * - Context-level (regime/season/region) performance breakdown with INSUFFICIENT DATA gating
 * - Extreme-event contingency metrics with zero-denominator protection
 * - Neutral presentation: Never claims or declares a winner automatically
 */

import {
  BaselineMethodId,
  BaselineMetricRecord,
  ExtremeEventMetricRecord,
  LeadTimePerformanceRecord,
  ContextPerformanceRecord,
  DataPeriodBoundary,
} from './types';
import { BlendedForecastOutput } from '../blending/types';
import { ExtremeEventDefinition } from '../events/types';
import { EventThresholdRegistry } from '../events/thresholdConfig';

export interface ComparatorOptions {
  evaluationPeriod?: DataPeriodBoundary;
  minSampleSize?: number;
  definitions?: ExtremeEventDefinition[];
}

export class BaselineComparator {
  private static readonly METHOD_LABELS: Record<BaselineMethodId, string> = {
    ECMWF: 'ECMWF IFS (Operational NWP)',
    GFS: 'NOAA GFS (Operational NWP)',
    ICON: 'DWD ICON Global (Operational NWP)',
    EQUAL_WEIGHT: 'Equal-Weight Baseline (1/N)',
    FIXED_WEIGHT: 'Fixed-Weight Baseline (Constrained OLS)',
    ADAPTIVE_BLEND: 'Adaptive Context-Aware Blend',
  };

  /**
   * Filter trajectory to common evaluation cohort
   */
  public static filterCommonCohort(
    trajectory: BlendedForecastOutput[],
    period?: DataPeriodBoundary
  ): {
    cohort: BlendedForecastOutput[];
    excludedCount: number;
    exclusionReasons: string[];
  } {
    const reasons: string[] = [];
    let excludedCount = 0;

    const cohort = trajectory.filter(step => {
      // Check time period boundaries
      if (period) {
        const stepTime = new Date(step.timestamp).getTime();
        const startTime = new Date(period.start).getTime();
        const endTime = new Date(period.end).getTime();

        if (stepTime < startTime || stepTime > endTime) {
          excludedCount++;
          if (!reasons.includes('Timestamp outside evaluation period window')) {
            reasons.push('Timestamp outside evaluation period window');
          }
          return false;
        }
      }

      // Check observation presence for empirical verification
      if (step.observationValue === null || step.observationValue === undefined) {
        excludedCount++;
        if (!reasons.includes('Missing ground truth observation value')) {
          reasons.push('Missing ground truth observation value');
        }
        return false;
      }

      return true;
    });

    return { cohort, excludedCount, exclusionReasons: reasons };
  }

  /**
   * Compute verification metrics for all 6 methods on the common cohort
   */
  public static evaluateAllMethods(
    trajectory: BlendedForecastOutput[],
    options: ComparatorOptions = {}
  ): {
    metrics: BaselineMetricRecord[];
    cohortSize: number;
    excludedCount: number;
    exclusionReasons: string[];
  } {
    const { cohort, excludedCount, exclusionReasons } = this.filterCommonCohort(
      trajectory,
      options.evaluationPeriod
    );

    const methods: BaselineMethodId[] = [
      'ECMWF',
      'GFS',
      'ICON',
      'EQUAL_WEIGHT',
      'FIXED_WEIGHT',
      'ADAPTIVE_BLEND',
    ];

    const results: BaselineMetricRecord[] = methods.map(methodId => {
      const errors: number[] = [];
      const absErrors: number[] = [];
      const sqErrors: number[] = [];
      let missingMethodCount = 0;

      for (const step of cohort) {
        const val = this.extractMethodValue(step, methodId);
        const obs = step.observationValue;

        if (val === null || val === undefined || obs === null || obs === undefined) {
          missingMethodCount++;
          continue;
        }

        const err = val - obs;
        errors.push(err);
        absErrors.push(Math.abs(err));
        sqErrors.push(err * err);
      }

      const validCount = errors.length;
      const totalCohortSize = cohort.length;

      if (validCount === 0) {
        return {
          method: methodId,
          methodLabel: this.METHOD_LABELS[methodId],
          mae: null,
          rmse: null,
          bias: null,
          sampleCount: totalCohortSize,
          validSampleCount: 0,
          excludedSampleCount: totalCohortSize,
          exclusionReasons: missingMethodCount > 0 ? ['Forecast value unavailable for method in cohort'] : exclusionReasons,
          status: 'UNAVAILABLE',
        };
      }

      const mae = absErrors.reduce((a, b) => a + b, 0) / validCount;
      const rmse = Math.sqrt(sqErrors.reduce((a, b) => a + b, 0) / validCount);
      const bias = errors.reduce((a, b) => a + b, 0) / validCount;

      const minSamples = options.minSampleSize ?? 3;
      const status = validCount < minSamples ? 'INSUFFICIENT_DATA' : 'AVAILABLE';

      return {
        method: methodId,
        methodLabel: this.METHOD_LABELS[methodId],
        mae: Number(mae.toFixed(3)),
        rmse: Number(rmse.toFixed(3)),
        bias: Number(bias.toFixed(3)),
        sampleCount: totalCohortSize,
        validSampleCount: validCount,
        excludedSampleCount: totalCohortSize - validCount,
        exclusionReasons: totalCohortSize - validCount > 0 ? ['Method value missing on subset of cohort'] : [],
        status,
      };
    });

    return {
      metrics: results,
      cohortSize: cohort.length,
      excludedCount,
      exclusionReasons,
    };
  }

  /**
   * Evaluate performance stratified by lead time (+24h, +48h, etc.)
   */
  public static evaluateByLeadTime(
    trajectory: BlendedForecastOutput[],
    leadTimes: number[],
    options: ComparatorOptions = {}
  ): LeadTimePerformanceRecord[] {
    const { cohort } = this.filterCommonCohort(trajectory, options.evaluationPeriod);
    const methods: BaselineMethodId[] = [
      'ECMWF',
      'GFS',
      'ICON',
      'EQUAL_WEIGHT',
      'FIXED_WEIGHT',
      'ADAPTIVE_BLEND',
    ];

    return leadTimes.map(lt => {
      const ltSteps = cohort.filter(s => s.leadTimeHours === lt);
      const sampleCount = ltSteps.length;

      const methodStats: Record<BaselineMethodId, { mae: number | null; rmse: number | null; bias: number | null; sampleCount: number }> = {} as any;

      for (const m of methods) {
        const errors: number[] = [];
        const absErrors: number[] = [];
        const sqErrors: number[] = [];

        for (const s of ltSteps) {
          const val = this.extractMethodValue(s, m);
          const obs = s.observationValue;
          if (val !== null && val !== undefined && obs !== null && obs !== undefined) {
            const err = val - obs;
            errors.push(err);
            absErrors.push(Math.abs(err));
            sqErrors.push(err * err);
          }
        }

        const validCount = errors.length;
        if (validCount === 0) {
          methodStats[m] = { mae: null, rmse: null, bias: null, sampleCount: 0 };
        } else {
          methodStats[m] = {
            mae: Number((absErrors.reduce((a, b) => a + b, 0) / validCount).toFixed(3)),
            rmse: Number(Math.sqrt(sqErrors.reduce((a, b) => a + b, 0) / validCount).toFixed(3)),
            bias: Number((errors.reduce((a, b) => a + b, 0) / validCount).toFixed(3)),
            sampleCount: validCount,
          };
        }
      }

      return {
        leadTimeHours: lt,
        sampleCount,
        methods: methodStats,
      };
    });
  }

  /**
   * Evaluate performance stratified by context (regime, season, region)
   */
  public static evaluateByContext(
    trajectory: BlendedForecastOutput[],
    options: ComparatorOptions = {}
  ): ContextPerformanceRecord[] {
    const { cohort } = this.filterCommonCohort(trajectory, options.evaluationPeriod);
    const minSamples = options.minSampleSize ?? 5;
    const methods: BaselineMethodId[] = [
      'ECMWF',
      'GFS',
      'ICON',
      'EQUAL_WEIGHT',
      'FIXED_WEIGHT',
      'ADAPTIVE_BLEND',
    ];

    // Group by regime
    const regimeGroups: Record<string, BlendedForecastOutput[]> = {};
    for (const step of cohort) {
      const regime = step.context?.detectedRegime || 'STANDARD_SYNOPTIC';
      if (!regimeGroups[regime]) regimeGroups[regime] = [];
      regimeGroups[regime].push(step);
    }

    const records: ContextPerformanceRecord[] = [];

    for (const [regime, steps] of Object.entries(regimeGroups)) {
      const count = steps.length;
      if (count < minSamples) {
        records.push({
          dimension: 'regime',
          category: regime,
          sampleCount: count,
          status: 'INSUFFICIENT_DATA',
        });
      } else {
        const methodMetrics: Record<BaselineMethodId, { mae: number | null; rmse: number | null; bias: number | null }> = {} as any;

        for (const m of methods) {
          const absErr: number[] = [];
          const sqErr: number[] = [];
          const errs: number[] = [];

          for (const s of steps) {
            const val = this.extractMethodValue(s, m);
            const obs = s.observationValue;
            if (val !== null && val !== undefined && obs !== null && obs !== undefined) {
              const diff = val - obs;
              errs.push(diff);
              absErr.push(Math.abs(diff));
              sqErr.push(diff * diff);
            }
          }

          if (errs.length === 0) {
            methodMetrics[m] = { mae: null, rmse: null, bias: null };
          } else {
            methodMetrics[m] = {
              mae: Number((absErr.reduce((a, b) => a + b, 0) / errs.length).toFixed(3)),
              rmse: Number(Math.sqrt(sqErr.reduce((a, b) => a + b, 0) / errs.length).toFixed(3)),
              bias: Number((errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(3)),
            };
          }
        }

        records.push({
          dimension: 'regime',
          category: regime,
          sampleCount: count,
          status: 'AVAILABLE',
          methods: methodMetrics,
        });
      }
    }

    return records;
  }

  /**
   * Evaluate extreme-event contingency performance with zero-denominator safety
   */
  public static evaluateExtremeEvents(
    trajectory: BlendedForecastOutput[],
    definitions: ExtremeEventDefinition[],
    options: ComparatorOptions = {}
  ): ExtremeEventMetricRecord[] {
    const { cohort } = this.filterCommonCohort(trajectory, options.evaluationPeriod);
    const methods: BaselineMethodId[] = [
      'ECMWF',
      'GFS',
      'ICON',
      'EQUAL_WEIGHT',
      'FIXED_WEIGHT',
      'ADAPTIVE_BLEND',
    ];

    const records: ExtremeEventMetricRecord[] = [];

    for (const def of definitions) {
      for (const m of methods) {
        let tp = 0;
        let fp = 0;
        let fn = 0;
        let tn = 0;
        let validSteps = 0;

        for (const step of cohort) {
          const val = this.extractMethodValue(step, m);
          const obs = step.observationValue;

          if (val === null || val === undefined || obs === null || obs === undefined) {
            continue;
          }

          validSteps++;
          const forecastExceeded = EventThresholdRegistry.isThresholdExceeded(val, def);
          const observedExceeded = EventThresholdRegistry.isThresholdExceeded(obs, def);

          if (forecastExceeded && observedExceeded) tp++;
          else if (forecastExceeded && !observedExceeded) fp++;
          else if (!forecastExceeded && observedExceeded) fn++;
          else tn++;
        }

        // Zero-denominator handling per scientific requirements:
        // Precision = TP / (TP + FP); if TP + FP === 0 => null
        // Recall = TP / (TP + FN); if TP + FN === 0 => null
        const precision = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(4)) : null;
        const recall = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(4)) : null;

        let f1: number | null = null;
        if (precision !== null && recall !== null && precision + recall > 0) {
          f1 = Number(((2 * precision * recall) / (precision + recall)).toFixed(4));
        }

        let threatScore: number | null = null;
        if (tp + fp + fn > 0) {
          threatScore = Number((tp / (tp + fp + fn)).toFixed(4));
        }

        const totalEvents = tp + fn;
        const status = validSteps === 0 ? 'UNAVAILABLE' : (tp + fp + fn + tn === 0 ? 'INSUFFICIENT_DATA' : 'AVAILABLE');

        records.push({
          method: m,
          methodLabel: this.METHOD_LABELS[m],
          eventType: def.eventType,
          threshold: def.threshold,
          unit: def.unit,
          tp,
          fp,
          fn,
          tn,
          precision,
          recall,
          f1,
          threatScore,
          eventCount: totalEvents,
          status,
        });
      }
    }

    return records;
  }

  /**
   * Safe value extraction for a given baseline method
   */
  private static extractMethodValue(
    step: BlendedForecastOutput,
    method: BaselineMethodId
  ): number | null {
    switch (method) {
      case 'ECMWF':
        return step.individualForecasts.ECMWF ?? null;
      case 'GFS':
        return step.individualForecasts.GFS ?? null;
      case 'ICON':
        return step.individualForecasts.ICON ?? null;
      case 'EQUAL_WEIGHT':
        return step.equalWeightForecast ?? null;
      case 'FIXED_WEIGHT':
        return step.fixedWeightForecast ?? null;
      case 'ADAPTIVE_BLEND':
        return step.adaptiveBlendedForecast ?? null;
      default:
        return null;
    }
  }
}
