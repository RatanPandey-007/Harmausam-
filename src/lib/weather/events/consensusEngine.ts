/**
 * Multi-Source Consensus & Status Engine
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Implements objective, evidence-based event consensus synthesis:
 * - Quantifies supporting forecast systems without fake percentage probabilities.
 * - Integrates Phase 5 multi-model dispersion (spread sigma).
 * - Enforces strict status transitions:
 *   - "CONFIRMED" is strictly reserved for events verified against empirical observations.
 *   - Unverified forecast exceedances are tagged "DETECTED — OBSERVATION PENDING".
 * - Computes transparent severity risks based on distance above threshold and consensus.
 */

import { ForecastSourceId } from '../types';
import {
  ExtremeEventDefinition,
  MultiSourceEventConsensus,
  EventStatus,
} from './types';
import { EventThresholdRegistry } from './thresholdConfig';

export interface ConsensusEvaluationInput {
  def: ExtremeEventDefinition;
  sourceValues: Record<ForecastSourceId, number | null>;
  adaptiveWeights: Record<ForecastSourceId, number>;
  blendValue: number;
  modelSpread: number | null; // Phase 5 dispersion
  observedValue?: number | null;
}

export class ConsensusEngine {
  /**
   * Evaluates multi-source consensus and derives evidence indicators
   */
  public static evaluateConsensus(input: ConsensusEvaluationInput): MultiSourceEventConsensus {
    const { def, sourceValues, adaptiveWeights, blendValue, modelSpread } = input;

    const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
    const validSources = sources.filter(
      s => sourceValues[s] !== null && sourceValues[s] !== undefined && !isNaN(sourceValues[s]!)
    );

    const sourceExceedance: Record<ForecastSourceId, boolean> = {
      ECMWF: false,
      GFS: false,
      ICON: false,
      GRAPHCAST: false,
    };

    let supportingCount = 0;

    for (const s of validSources) {
      const val = sourceValues[s]!;
      const exceeds = EventThresholdRegistry.isThresholdExceeded(val, def);
      sourceExceedance[s] = exceeds;
      if (exceeds) supportingCount++;
    }

    const totalValid = validSources.length;
    const ratio = totalValid > 0 ? Number((supportingCount / totalValid).toFixed(2)) : 0;

    // Factual evidence statement (zero hype, strictly factual)
    let evidenceSummary = '';
    if (totalValid === 0) {
      evidenceSummary = 'No forecast systems are currently operational for consensus verification.';
    } else {
      const spreadStr = modelSpread !== null ? ` (Ensemble spread: ±${modelSpread.toFixed(1)}${def.unit})` : '';
      evidenceSummary = `${supportingCount} of ${totalValid} operational forecast sources exceed the configured threshold (${def.threshold}${def.unit})${spreadStr}.`;
    }

    return {
      totalSources: totalValid,
      supportingSourceCount: supportingCount,
      sourceValues,
      sourceExceedance,
      adaptiveWeights,
      modelSpread,
      blendValue,
      threshold: def.threshold,
      consensusRatio: ratio,
      evidenceSummary,
    };
  }

  /**
   * Derives event operational status based on consensus and observation verification
   */
  public static deriveEventStatus(
    def: ExtremeEventDefinition,
    blendValue: number,
    supportingCount: number,
    observedValue?: number | null
  ): EventStatus {
    const blendExceeds = EventThresholdRegistry.isThresholdExceeded(blendValue, def);

    // Rule 1: If ground observation is available, verify confirmation or termination
    if (observedValue !== undefined && observedValue !== null && !isNaN(observedValue)) {
      const obsExceeds = EventThresholdRegistry.isThresholdExceeded(observedValue, def);
      if (obsExceeds) {
        return 'CONFIRMED'; // Confirmed strictly by ground truth
      } else {
        return 'ENDED'; // Observation indicates sub-threshold conditions or ended event
      }
    }

    // Rule 2: Without ground observation, a forecast threshold crossing is NEVER CONFIRMED
    if (blendExceeds && supportingCount >= 2) {
      return 'DETECTED_OBS_PENDING';
    } else if (blendExceeds || supportingCount >= 1) {
      return 'DEVELOPING';
    }

    return 'MONITOR';
  }

  /**
   * Transparent severity risk classification based on threshold exceedance delta and consensus
   */
  public static deriveSeverityRisk(
    def: ExtremeEventDefinition,
    peakValue: number,
    supportingCount: number
  ): 'Information' | 'Watch' | 'Elevated Risk' | 'High Risk' {
    const isMin = def.operator === '<=';
    const delta = isMin ? def.threshold - peakValue : peakValue - def.threshold;

    if (delta >= 4.0 || (delta >= 2.0 && supportingCount >= 3)) {
      return 'High Risk';
    } else if (delta >= 1.5 || (delta >= 0 && supportingCount >= 2)) {
      return 'Elevated Risk';
    } else if (delta >= 0 || supportingCount >= 1) {
      return 'Watch';
    }

    return 'Information';
  }
}
