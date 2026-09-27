/**
 * Pipeline Scientific Auditor
 * Harmausam Meteorological Intelligence Platform — Phase 7 (Final Phase)
 *
 * Implements automated validation and verification across:
 * - Adaptive Weights Audit: Non-negativity (w_i >= 0) and normalization (sum(w_i) = 1.0 +- 1e-4)
 * - Uncertainty Audit: Model spread verification, absence of fake probabilities or ungrounded "95% confidence"
 * - Extreme Events Audit: Strict zero-denominator safety (TP+FP=0 => Precision null, TP+FN=0 => Recall null)
 * - Data Leakage Audit: Strict temporal disjointness between training and evaluation windows
 */

import {
  AuditReport,
  WeightAuditSummary,
  UncertaintyAuditSummary,
  ExtremeEventAuditSummary,
  LeakageAuditSummary,
  ExtremeEventMetricRecord,
  DataPeriodBoundary,
} from './types';
import { BlendedForecastOutput } from '../blending/types';

export class PipelineAuditor {
  private static readonly EPSILON = 1e-4;

  /**
   * Audit adaptive weights across all trajectory timesteps
   */
  public static auditWeights(trajectory: BlendedForecastOutput[]): WeightAuditSummary {
    const violations: string[] = [];
    let sumCheckPassed = true;
    let nonNegativePassed = true;
    let auditedCount = 0;

    for (const step of trajectory) {
      if (!step.adaptiveWeights) continue;

      auditedCount++;
      const weights = step.adaptiveWeights;
      let sum = 0;
      const sources = Object.keys(weights) as Array<keyof typeof weights>;

      for (const src of sources) {
        const entry = weights[src];
        if (!entry) continue;

        const w = entry.weight;
        sum += w;

        // Check non-negativity
        if (w < -this.EPSILON) {
          nonNegativePassed = false;
          violations.push(
            `Negative weight ${w.toFixed(6)} detected for ${String(src)} at ${step.timestamp}`
          );
        }
      }

      // Check sum to 1.0 (if at least one valid source exists)
      if (sources.length > 0 && Math.abs(sum - 1.0) > this.EPSILON) {
        sumCheckPassed = false;
        violations.push(
          `Weight sum deviation (${sum.toFixed(6)} != 1.0) at ${step.timestamp}`
        );
      }
    }

    const passed = sumCheckPassed && nonNegativePassed && (auditedCount === 0 || violations.length === 0);

    return {
      passed,
      sumCheckPassed,
      nonNegativePassed,
      auditedCount,
      violations,
    };
  }

  /**
   * Audit uncertainty and model disagreement calculations
   */
  public static auditUncertainty(trajectory: BlendedForecastOutput[]): UncertaintyAuditSummary {
    const violations: string[] = [];
    let noFakeProbabilities = true;
    let empiricalScaleUsed = true;
    let validSpreadCount = 0;

    for (const step of trajectory) {
      if (step.disagreement) {
        validSpreadCount++;
        const stdDev = step.disagreement.standardDeviation;

        if (stdDev !== null && stdDev < 0) {
          violations.push(`Negative standard deviation ${stdDev} at ${step.timestamp}`);
        }

        // Verify that model spread is not misrepresented as statistical confidence interval
        if ((step.disagreement as any).confidenceInterval95 !== undefined) {
          noFakeProbabilities = false;
          violations.push(`Forbidden Gaussian confidence interval detected at ${step.timestamp}`);
        }
      }

      if (step.uncertaintyProxy) {
        const proxy = step.uncertaintyProxy;
        if ((proxy as any).calibratedConfidencePercent !== undefined) {
          noFakeProbabilities = false;
          violations.push(`Forbidden calibrated confidence percentage detected at ${step.timestamp}`);
        }

        if (proxy.methodologyNote && /9[05]%\s*(confidence|certainty)/i.test(proxy.methodologyNote)) {
          noFakeProbabilities = false;
          violations.push(`Unsupported 95% confidence claim in methodology note at ${step.timestamp}`);
        }
      }

      if (step.uncertaintyExplanation) {
        const expl = step.uncertaintyExplanation;
        if (expl.summary && /9[05]%\s*(confidence|certainty)/i.test(expl.summary)) {
          noFakeProbabilities = false;
          violations.push(`Unsupported 95% confidence claim in explanation at ${step.timestamp}`);
        }
      }
    }

    const passed = noFakeProbabilities && empiricalScaleUsed && violations.length === 0;

    return {
      passed,
      noFakeProbabilities,
      empiricalScaleUsed,
      validSpreadCount,
      violations,
    };
  }

  /**
   * Audit extreme-event metrics and zero-denominator safety
   */
  public static auditExtremeEvents(
    metrics: ExtremeEventMetricRecord[]
  ): ExtremeEventAuditSummary {
    const violations: string[] = [];
    let zeroDenominatorSafe = true;
    let matchingValid = true;

    for (const m of metrics) {
      // Precision zero-denominator check: TP + FP = 0 => Precision must be null
      if (m.tp + m.fp === 0 && m.precision !== null) {
        zeroDenominatorSafe = false;
        violations.push(
          `Precision non-null (${m.precision}) when TP + FP === 0 for method ${m.method} on ${m.eventType}`
        );
      }

      // Recall zero-denominator check: TP + FN = 0 => Recall must be null
      if (m.tp + m.fn === 0 && m.recall !== null) {
        zeroDenominatorSafe = false;
        violations.push(
          `Recall non-null (${m.recall}) when TP + FN === 0 for method ${m.method} on ${m.eventType}`
        );
      }

      // Non-negativity check on contingency counts
      if (m.tp < 0 || m.fp < 0 || m.fn < 0 || m.tn < 0) {
        matchingValid = false;
        violations.push(
          `Negative contingency count detected for method ${m.method} on ${m.eventType}`
        );
      }
    }

    const passed = zeroDenominatorSafe && matchingValid && violations.length === 0;

    return {
      passed,
      zeroDenominatorSafe,
      matchingValid,
      auditedCount: metrics.length,
      violations,
    };
  }

  /**
   * Audit data leakage between training, validation, and evaluation periods
   */
  public static auditDataLeakage(
    trainingPeriod: DataPeriodBoundary,
    validationPeriod: DataPeriodBoundary,
    evaluationPeriod: DataPeriodBoundary
  ): LeakageAuditSummary {
    const violations: string[] = [];
    let strictSeparation = true;
    let trainingEvaluationDisjoint = true;

    const trainStart = new Date(trainingPeriod.start).getTime();
    const trainEnd = new Date(trainingPeriod.end).getTime();
    const valStart = new Date(validationPeriod.start).getTime();
    const valEnd = new Date(validationPeriod.end).getTime();
    const evalStart = new Date(evaluationPeriod.start).getTime();
    const evalEnd = new Date(evaluationPeriod.end).getTime();

    // Verification 1: Start <= End for each period
    if (trainStart > trainEnd) {
      strictSeparation = false;
      violations.push(`Training period start (${trainingPeriod.start}) is after end (${trainingPeriod.end})`);
    }
    if (valStart > valEnd) {
      strictSeparation = false;
      violations.push(`Validation period start (${validationPeriod.start}) is after end (${validationPeriod.end})`);
    }
    if (evalStart > evalEnd) {
      strictSeparation = false;
      violations.push(`Evaluation period start (${evaluationPeriod.start}) is after end (${evaluationPeriod.end})`);
    }

    // Verification 2: Chronological disjointness (Training -> Validation -> Evaluation)
    if (trainEnd > evalStart) {
      trainingEvaluationDisjoint = false;
      violations.push(
        `Temporal data leakage: Training period end (${trainingPeriod.end}) overlaps evaluation period start (${evaluationPeriod.start})`
      );
    }

    if (valEnd > evalStart) {
      trainingEvaluationDisjoint = false;
      violations.push(
        `Temporal data leakage: Validation period end (${validationPeriod.end}) overlaps evaluation period start (${evaluationPeriod.start})`
      );
    }

    const passed = strictSeparation && trainingEvaluationDisjoint && violations.length === 0;

    return {
      passed,
      strictSeparation,
      trainingEvaluationDisjoint,
      violations,
    };
  }

  /**
   * Run full comprehensive audit
   */
  public static auditAll(params: {
    trajectory: BlendedForecastOutput[];
    extremeMetrics: ExtremeEventMetricRecord[];
    trainingPeriod: DataPeriodBoundary;
    validationPeriod: DataPeriodBoundary;
    evaluationPeriod: DataPeriodBoundary;
  }): AuditReport {
    const weightsAudit = this.auditWeights(params.trajectory);
    const uncertaintyAudit = this.auditUncertainty(params.trajectory);
    const extremeEventAudit = this.auditExtremeEvents(params.extremeMetrics);
    const leakageAudit = this.auditDataLeakage(
      params.trainingPeriod,
      params.validationPeriod,
      params.evaluationPeriod
    );

    const overallPassed =
      weightsAudit.passed &&
      uncertaintyAudit.passed &&
      extremeEventAudit.passed &&
      leakageAudit.passed;

    return {
      weightsAudit,
      uncertaintyAudit,
      extremeEventAudit,
      leakageAudit,
      overallStatus: overallPassed ? 'AUDIT_PASSED' : 'AUDIT_FAILED',
    };
  }
}
