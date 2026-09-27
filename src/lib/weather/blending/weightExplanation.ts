/**
 * Weight Explanation Generator
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Produces clear, deterministic, factual justifications for why specific weights
 * were assigned to each NWP/AI model, detailing historical errors, lead times,
 * weather regimes, and fallback hierarchy levels.
 */

import { ForecastSourceId } from '../types';
import { AdaptiveWeightResult } from './types';
import { BlendingContext } from '../context/contextEngine';

export interface FactorBreakdownItem {
  src: ForecastSourceId;
  weightPct: number;
  histSkillLabel: string;
  rmse: number;
  mae: number;
  leadSkillLabel: string;
  agreeLabel: string;
  dev: number;
}

export class WeightExplanationGenerator {
  /**
   * Generates a concise single-paragraph explanation for the blend allocation
   */
  public static generateSummary(
    adaptiveResult: AdaptiveWeightResult,
    context: BlendingContext,
    unit: string = '°C'
  ): string {
    const { weights, hierarchyLevel, effectiveSampleCount, activeRegime, leadTimeHours } = adaptiveResult;
    const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];

    // Filter to active models with weight > 0
    const activeSources = sources
      .filter(s => weights[s]?.weight > 0)
      .sort((a, b) => weights[b].weight - weights[a].weight);

    if (activeSources.length === 0) {
      return 'No active forecast sources available for this lead-time step.';
    }

    const allocations = activeSources
      .map(s => `${s} ${weights[s].percentage}% (MAE: ${weights[s].historicalMae.toFixed(2)}${unit})`)
      .join(', ');

    const fallbackLabel =
      hierarchyLevel === 'LEVEL_1_EXACT_CONTEXT'
        ? 'Exact Context (Level 1)'
        : hierarchyLevel === 'LEVEL_2_BROADER_CONTEXT'
        ? 'Broader Seasonal Context (Level 2)'
        : hierarchyLevel === 'LEVEL_3_REGIONAL_LEAD'
        ? 'Regional Lead Context (Level 3)'
        : hierarchyLevel === 'LEVEL_4_GLOBAL_LEAD'
        ? 'Global Lead Context (Level 4)'
        : 'Equal-Weight Fallback (Level 5)';

    return `Context-Aware Allocation: ${allocations}. Evaluated at +${leadTimeHours}h lead under ${activeRegime} regime in ${context.regionDisplayName}. Fallback Hierarchy: ${fallbackLabel} with sample size N=${effectiveSampleCount}.`;
  }

  /**
   * Generates structured factor breakdown items for rich UI display cards
   */
  public static generateBreakdown(
    adaptiveResult: AdaptiveWeightResult,
    context: BlendingContext,
    individualForecasts: Record<ForecastSourceId, number | null | undefined>
  ): FactorBreakdownItem[] {
    const { weights, leadTimeHours } = adaptiveResult;
    const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];

    // Calculate consensus mean
    const validVals = sources
      .map(s => individualForecasts[s])
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
    const meanVal = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0;

    return sources.map(src => {
      const wObj = weights[src];
      const rawVal = individualForecasts[src];
      const dev = rawVal !== null && rawVal !== undefined ? Math.abs(rawVal - meanVal) : 0;

      const histSkillLabel =
        wObj.historicalMae <= 1.1 ? 'Superior' : wObj.historicalMae <= 1.4 ? 'Moderate' : 'Constrained';
      const leadSkillLabel = leadTimeHours <= 24 ? 'High Synoptic' : leadTimeHours <= 72 ? 'Standard Drift' : 'Decayed';
      const agreeLabel = dev <= 1.0 ? 'High Agreement' : dev <= 2.5 ? 'Moderate Spread' : 'Outlier';

      return {
        src,
        weightPct: wObj.percentage,
        histSkillLabel,
        rmse: wObj.historicalRmse,
        mae: wObj.historicalMae,
        leadSkillLabel,
        agreeLabel,
        dev: Number(dev.toFixed(1)),
      };
    });
  }
}
