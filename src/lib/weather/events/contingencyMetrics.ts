/**
 * Contingency Metrics & Verification Evaluation Engine
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Implements strict, mathematically rigorous calculations for:
 * - 2x2 Confusion Matrix: True Positive (Hit), False Positive (False Alarm),
 *   False Negative (Miss), True Negative (Correct Rejection).
 * - Precision (Positive Predictive Value): TP / (TP + FP)
 * - Recall (Probability of Detection): TP / (TP + FN)
 * - F1 Score: 2 * (P * R) / (P + R)
 * - Threat Score / Critical Success Index (CSI): TP / (TP + FP + FN)
 * - False Alarm Ratio (FAR): FP / (TP + FP)
 *
 * Strict Zero-Denominator Handling:
 * When denominators are 0, functions return `null` (rendered as "Not available"),
 * never misleading 0% or NaN values.
 *
 * Same-Data Enforcement:
 * Evaluates all comparative methods on the identical valid sample window.
 */

import {
  MatchedEventPair,
  ConfusionMatrix,
  ContingencyMetrics,
  EventLeadTimeMetrics,
  MethodEventEvaluation,
  EvaluationMethodId,
} from './types';

export class ContingencyMetricsEngine {
  /**
   * Computes a 2x2 confusion matrix from verified matched event pairs
   */
  public static computeConfusionMatrix(pairs: MatchedEventPair[]): ConfusionMatrix {
    // Only count pairs where ground truth observation was genuinely available
    const verifiedPairs = pairs.filter(p => p.observationAvailable);

    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;

    for (const p of verifiedPairs) {
      switch (p.classification) {
        case 'TRUE_POSITIVE':
          tp++;
          break;
        case 'FALSE_POSITIVE':
          fp++;
          break;
        case 'FALSE_NEGATIVE':
          fn++;
          break;
        case 'TRUE_NEGATIVE':
          tn++;
          break;
      }
    }

    return {
      truePositive: tp,
      falsePositive: fp,
      falseNegative: fn,
      trueNegative: tn,
      sampleCount: verifiedPairs.length,
    };
  }

  /**
   * Calculates contingency skill metrics with zero-denominator safety
   */
  public static computeMetrics(
    matrix: ConfusionMatrix,
    evaluationStart: string,
    evaluationEnd: string
  ): ContingencyMetrics {
    const { truePositive: tp, falsePositive: fp, falseNegative: fn, sampleCount } = matrix;

    // Precision = TP / (TP + FP)
    const precisionDenominator = tp + fp;
    const precision =
      precisionDenominator > 0 ? Number((tp / precisionDenominator).toFixed(3)) : null;

    // Recall / POD = TP / (TP + FN)
    const recallDenominator = tp + fn;
    const recall =
      recallDenominator > 0 ? Number((tp / recallDenominator).toFixed(3)) : null;

    // F1 Score = 2 * (P * R) / (P + R)
    let f1: number | null = null;
    if (precision !== null && recall !== null && precision + recall > 0) {
      f1 = Number(((2 * precision * recall) / (precision + recall)).toFixed(3));
    }

    // Threat Score / CSI = TP / (TP + FP + FN)
    const csiDenominator = tp + fp + fn;
    const threatScore =
      csiDenominator > 0 ? Number((tp / csiDenominator).toFixed(3)) : null;

    // False Alarm Ratio (FAR) = FP / (TP + FP)
    const falseAlarmRatio =
      precisionDenominator > 0 ? Number((fp / precisionDenominator).toFixed(3)) : null;

    const hasEvents = (tp + fp + fn) > 0;
    const isAvailable = sampleCount > 0;

    let dataLimitationNote: string | undefined;
    if (sampleCount === 0) {
      dataLimitationNote = 'Observed event verification unavailable: zero verified observation pairs.';
    } else if (!hasEvents) {
      dataLimitationNote = 'No extreme events observed or forecast in evaluation cohort.';
    } else if (sampleCount < 10) {
      dataLimitationNote = 'Insufficient historical events for reliable Precision/Recall/F1 (N < 10).';
    }

    return {
      precision,
      recall,
      f1,
      threatScore,
      falseAlarmRatio,
      sampleCount,
      evaluationStart,
      evaluationEnd,
      isAvailable,
      dataLimitationNote,
    };
  }

  /**
   * Computes lead-time stratified metrics (+24h, +48h, +72h, etc.)
   */
  public static computeLeadTimeBreakdown(
    pairs: MatchedEventPair[],
    evaluationStart: string,
    evaluationEnd: string
  ): EventLeadTimeMetrics[] {
    const leadMap = new Map<number, MatchedEventPair[]>();

    for (const p of pairs) {
      if (!leadMap.has(p.leadTimeHours)) {
        leadMap.set(p.leadTimeHours, []);
      }
      leadMap.get(p.leadTimeHours)!.push(p);
    }

    const results: EventLeadTimeMetrics[] = [];
    const sortedLeads = Array.from(leadMap.keys()).sort((a, b) => a - b);

    for (const lead of sortedLeads) {
      const subset = leadMap.get(lead)!;
      const matrix = this.computeConfusionMatrix(subset);
      const metrics = this.computeMetrics(matrix, evaluationStart, evaluationEnd);
      results.push({
        leadTimeHours: lead,
        confusionMatrix: matrix,
        metrics,
      });
    }

    return results;
  }

  /**
   * Evaluates all forecast methods on the identical valid verification cohort
   */
  public static evaluateAllMethods(
    allPairs: MatchedEventPair[],
    evaluationStart: string,
    evaluationEnd: string
  ): MethodEventEvaluation[] {
    const methods: { id: EvaluationMethodId; label: string }[] = [
      { id: 'ECMWF', label: 'ECMWF IFS (9km)' },
      { id: 'GFS', label: 'NOAA GFS (13km)' },
      { id: 'ICON', label: 'DWD ICON (13km)' },
      { id: 'EQUAL_WEIGHT', label: 'Equal-Weight (1/N)' },
      { id: 'FIXED_WEIGHT', label: 'Fixed-Weight (OLS)' },
      { id: 'ADAPTIVE_BLEND', label: 'Adaptive Blend' },
    ];

    return methods.map(m => {
      const methodPairs = allPairs.filter(p => p.forecastMethod === m.id);
      const confusionMatrix = this.computeConfusionMatrix(methodPairs);
      const metrics = this.computeMetrics(confusionMatrix, evaluationStart, evaluationEnd);
      const byLeadTime = this.computeLeadTimeBreakdown(methodPairs, evaluationStart, evaluationEnd);

      return {
        method: m.id,
        label: m.label,
        confusionMatrix,
        metrics,
        byLeadTime,
      };
    });
  }
}
