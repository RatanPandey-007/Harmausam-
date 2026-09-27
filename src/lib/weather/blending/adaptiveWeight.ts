/**
 * Adaptive Context-Aware Weighting Engine
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Implements context-conditioned softmax weighting across 5 dimensions:
 * 1. Region
 * 2. Season
 * 3. Lead time
 * 4. Weather regime
 * 5. Historical source skill
 *
 * Enforces strict 5-Level Regularization Fallback Hierarchy (N_min = 10)
 * and dynamic renormalization for missing/invalid models.
 */

import { ForecastSourceId, WeatherVariable, WeatherRegime } from '../types';
import { BlendingContext } from '../context/contextEngine';
import { historicalSkillStore, FallbackHierarchyLevel } from '../skill/historicalSkill';
import { AdaptiveWeightResult, SourceWeightDetail } from './types';

export interface AdaptiveWeightOptions {
  alpha?: number; // Sensitivity parameter (default 1.0)
  minSamplesRequired?: number; // N_min threshold (default 10)
}

export class AdaptiveWeightEngine {
  /**
   * Calculate adaptive context-aware weights
   */
  public static calculateWeights(
    context: BlendingContext,
    forecastValues: Record<ForecastSourceId, number | null | undefined>,
    options: AdaptiveWeightOptions = {}
  ): AdaptiveWeightResult {
    const alpha = options.alpha ?? 1.0;
    const { variable, regionId, season, leadTimeHours, detectedRegime } = context;

    // 1. Identify valid available sources (strictly non-null, finite values)
    const allSources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
    const validSources: ForecastSourceId[] = [];

    for (const src of allSources) {
      const val = forecastValues[src];
      if (val !== null && val !== undefined && !isNaN(val) && isFinite(val)) {
        validSources.push(src);
      }
    }

    // Edge case: All sources missing
    if (validSources.length === 0) {
      const emptyWeights: Record<ForecastSourceId, SourceWeightDetail> = {} as any;
      for (const src of allSources) {
        emptyWeights[src] = {
          sourceId: src,
          weight: 0,
          percentage: 0,
          historicalMae: 0,
          historicalRmse: 0,
          sampleCount: 0,
          confidence: 0,
          activePenalty: 0,
          reasons: ['Model data unavailable at this lead time'],
        };
      }
      return {
        weights: emptyWeights,
        hierarchyLevel: 'LEVEL_5_EQUAL_WEIGHT',
        effectiveSampleCount: 0,
        activeRegime: detectedRegime,
        leadTimeHours,
        explanation: 'All forecast sources are missing or invalid; cannot compute blend.',
        isFallback: true,
      };
    }

    // 2. Query Historical Skill via 5-Tier Fallback Hierarchy
    const skillLookup = historicalSkillStore.getSkillForContext({
      region: regionId,
      season,
      leadTimeHours,
      regime: detectedRegime,
      variable,
    });

    // 3. Compute context-conditioned loss e_i for valid sources
    // e_i = MAE + penalties
    const rawScores: Record<ForecastSourceId, number> = {} as any;
    const weightDetails: Partial<Record<ForecastSourceId, SourceWeightDetail>> = {};

    // Calculate ensemble mean for outlier divergence detection
    const validVals = validSources.map(s => forecastValues[s]!);
    const meanVal = validVals.reduce((a, b) => a + b, 0) / validVals.length;

    let sumExp = 0;

    for (const src of validSources) {
      const skill = skillLookup.skills[src] || {
        mae: 1.5,
        rmse: 1.9,
        sampleCount: skillLookup.sampleCount,
      };

      const reasons: string[] = [];
      let totalLoss = skill.mae;
      let activePenalty = 0;

      reasons.push(
        `Historical MAE: ${skill.mae.toFixed(2)} in ${detectedRegime} regime (${skillLookup.hierarchyLevel}, N=${skill.sampleCount})`
      );

      // Model disagreement penalty: If model deviates significantly from consensus during an extreme regime
      const spread = Math.max(0.5, context.modelDisagreementSpread);
      const deviation = Math.abs(forecastValues[src]! - meanVal);
      if (deviation > 2.0 * spread && detectedRegime !== 'Normal') {
        const p = 0.3;
        totalLoss += p;
        activePenalty += p;
        reasons.push(`Consensus divergence penalty: +${p.toFixed(2)} (${deviation.toFixed(1)} vs spread ${spread.toFixed(1)})`);
      }

      // Exponential softmax score: score_i = exp(-alpha * totalLoss)
      const score = Math.exp(-alpha * totalLoss);
      rawScores[src] = score;
      sumExp += score;

      const conf = Math.max(0.2, Math.min(0.98, 1.0 - (totalLoss / 6.0)));

      weightDetails[src] = {
        sourceId: src,
        weight: 0, // will normalize
        percentage: 0,
        historicalMae: skill.mae,
        historicalRmse: skill.rmse,
        sampleCount: skill.sampleCount,
        confidence: Number(conf.toFixed(2)),
        activePenalty: Number(activePenalty.toFixed(2)),
        reasons,
      };
    }

    // 4. Normalize weights: sum(w_i) = 1.0
    for (const src of validSources) {
      const normalizedW = sumExp > 0 ? Number((rawScores[src] / sumExp).toFixed(4)) : 1.0 / validSources.length;
      weightDetails[src]!.weight = normalizedW;
      weightDetails[src]!.percentage = Math.round(normalizedW * 100);
    }

    // Fill missing sources with 0 weight
    for (const src of allSources) {
      if (!weightDetails[src]) {
        weightDetails[src] = {
          sourceId: src,
          weight: 0,
          percentage: 0,
          historicalMae: skillLookup.skills[src]?.mae ?? 0,
          historicalRmse: skillLookup.skills[src]?.rmse ?? 0,
          sampleCount: 0,
          confidence: 0,
          activePenalty: 0,
          reasons: ['Model unavailable or invalid QC; excluded from blend'],
        };
      }
    }

    // Precision adjustment to ensure exact 1.0 sum
    const currentSum = validSources.reduce((acc, src) => acc + weightDetails[src]!.weight, 0);
    const delta = 1.0 - currentSum;
    if (Math.abs(delta) > 0.00001 && validSources.length > 0) {
      weightDetails[validSources[0]]!.weight = Number(
        (weightDetails[validSources[0]]!.weight + delta).toFixed(4)
      );
      weightDetails[validSources[0]]!.percentage = Math.round(weightDetails[validSources[0]]!.weight * 100);
    }

    // Build concise, factual explanation string
    const topSource = [...validSources].sort(
      (a, b) => weightDetails[b]!.weight - weightDetails[a]!.weight
    )[0];

    const explanation = `Top allocation: ${topSource} (${weightDetails[topSource]!.percentage}%) based on ${skillLookup.reason}. Softmax sensitivity α=${alpha}.`;

    return {
      weights: weightDetails as Record<ForecastSourceId, SourceWeightDetail>,
      hierarchyLevel: skillLookup.hierarchyLevel,
      effectiveSampleCount: skillLookup.sampleCount,
      activeRegime: detectedRegime,
      leadTimeHours,
      explanation,
      isFallback: skillLookup.hierarchyLevel !== 'LEVEL_1_EXACT_CONTEXT',
    };
  }
}
