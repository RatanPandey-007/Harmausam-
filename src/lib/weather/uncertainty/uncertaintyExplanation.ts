/**
 * Factual Uncertainty Explanation Generator ("Why is this forecast uncertain?")
 * Harmausam Meteorological Intelligence Platform — Phase 5
 *
 * Implements deterministic diagnostic explanation generation based on:
 * - Current model spread relative to historical distribution
 * - Valid source availability & data quality
 * - Active atmospheric regime
 * - Lead time horizon error degradation
 *
 * Strict Rule: Generates factual, evidence-based sentences strictly from calculations.
 * No generic AI hallucinations or uncalibrated claims.
 */

import { ForecastSourceId } from '../types';
import { BlendingContext } from '../context/contextEngine';
import { ModelDisagreement, HistoricalDisagreement, UncertaintyExplanation } from './types';

export interface ExplanationInput {
  disagreement: ModelDisagreement;
  historicalBaseline?: HistoricalDisagreement | null;
  historicalMae: number;
  context: BlendingContext;
  unit?: string;
}

export class UncertaintyExplanationGenerator {
  /**
   * Generates a structured, evidence-based explanation for forecast uncertainty
   */
  public static generate(input: ExplanationInput): UncertaintyExplanation {
    const { disagreement, historicalBaseline, historicalMae, context, unit = '°C' } = input;
    const { validSourceCount, standardDeviation, range } = disagreement;
    const { detectedRegime, leadTimeHours, regionDisplayName, season } = context;

    const supportingEvidence: string[] = [];
    let primaryFactor = 'Normal Synoptic Variance';

    // 1. Data Quality & Source Availability Assessment
    const allSources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
    const missingSources = allSources.filter(s => disagreement.sourceValues[s] === null);

    if (validSourceCount === 1) {
      primaryFactor = 'Single Source Availability';
      supportingEvidence.push(
        'Only one forecast source is currently operational; inter-model cross-validation is unavailable.'
      );
    } else if (validSourceCount < 3) {
      supportingEvidence.push(
        `Limited source redundancy: only ${validSourceCount} sources available (${missingSources.join(
          ', '
        )} unavailable).`
      );
    }

    // 2. Disagreement Anomaly vs Historical Baseline
    if (historicalBaseline && historicalBaseline.sampleCount >= 10 && standardDeviation !== null) {
      const { medianSpread, sampleCount } = historicalBaseline;
      if (standardDeviation > medianSpread * 1.4) {
        primaryFactor = 'Elevated Inter-Model Disagreement';
        supportingEvidence.push(
          `Current model dispersion (σ=${standardDeviation.toFixed(2)}${unit}) exceeds historical median (${medianSpread.toFixed(
            2
          )}${unit}) for ${regionDisplayName} in ${detectedRegime} (N=${sampleCount}).`
        );
      } else if (standardDeviation < medianSpread * 0.7) {
        supportingEvidence.push(
          `Forecast sources exhibit strong consensus (σ=${standardDeviation.toFixed(2)}${unit}, below historical median ${medianSpread.toFixed(
            2
          )}${unit}).`
        );
      } else {
        supportingEvidence.push(
          `Model dispersion (σ=${standardDeviation.toFixed(2)}${unit}) aligns with typical historical behavior (${medianSpread.toFixed(
            2
          )}${unit}).`
        );
      }
    } else {
      supportingEvidence.push(
        'Historical spread baseline contains limited empirical samples (N < 10); anomaly detection is unconstrained.'
      );
    }

    // 3. Lead Time Horizon Degradation
    if (leadTimeHours >= 96) {
      if (primaryFactor === 'Normal Synoptic Variance') {
        primaryFactor = 'Extended Lead Time Decay';
      }
      supportingEvidence.push(
        `Extended lead time (+${leadTimeHours}h): NWP dynamical cores historically exhibit exponential error growth beyond 4 days.`
      );
    } else {
      supportingEvidence.push(`Short-to-medium forecast horizon (+${leadTimeHours}h) retains high synoptic boundary skill.`);
    }

    // 4. Regime-Specific Atmospheric Variance
    if (detectedRegime !== 'Normal') {
      if (primaryFactor === 'Normal Synoptic Variance') {
        primaryFactor = `Active ${detectedRegime} Regime`;
      }
      supportingEvidence.push(
        `Active atmospheric regime is ${detectedRegime}, which historically has higher error variance (MAE: ${historicalMae.toFixed(
          2
        )}${unit}).`
      );
    }

    // 5. Synthesis Summary Paragraph
    const spreadStr = standardDeviation !== null ? `σ=${standardDeviation.toFixed(2)}${unit}` : 'N/A';
    const rangeStr = range !== null ? `range ${range.toFixed(1)}${unit}` : 'N/A';

    const summary =
      validSourceCount >= 2
        ? `Primary factor: ${primaryFactor}. Forecast dispersion stands at ${spreadStr} (${rangeStr}) across ${validSourceCount} operational models. Evaluated under ${detectedRegime} regime in ${regionDisplayName} (${season}, +${leadTimeHours}h lead).`
        : `Primary factor: ${primaryFactor}. Forecast relies on a single reporting system; consensus disagreement cannot be calculated.`;

    return {
      primaryFactor,
      supportingEvidence,
      context: {
        region: regionDisplayName,
        season,
        leadTimeHours,
        weatherRegime: detectedRegime,
      },
      sourceSpread: standardDeviation,
      historicalComparison: {
        status: disagreement.disagreementLevel,
        currentSpread: standardDeviation,
        historicalMeanSpread: historicalBaseline?.meanSpread ?? null,
        historicalMedianSpread: historicalBaseline?.medianSpread ?? null,
        sampleCount: historicalBaseline?.sampleCount ?? 0,
      },
      dataQuality: {
        validSourceCount,
        missingSources,
        hasSufficientHistoricalSamples: (historicalBaseline?.sampleCount ?? 0) >= 10,
      },
      summary,
    };
  }
}
