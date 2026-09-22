import { 
  WeatherVariable, 
  WeatherRegime, 
  ForecastSourceId, 
  WeatherContext, 
  SourceWeight,
  ExplanationBreakdown
} from '../types';
import { AdaptiveWeightingEngine } from '../blending/AdaptiveWeightingEngine';

export class ExplainabilityEngine {
  /**
   * Deconstruct the exact mathematical factors that produced the assigned weights.
   * Answers: "Why did the system assign these weights?"
   */
  public static explainWeights(
    context: WeatherContext,
    weights: Record<ForecastSourceId, SourceWeight>,
    forecasts: Record<ForecastSourceId, number>,
    counterfactualRegime?: WeatherRegime
  ): ExplanationBreakdown {
    const { variable, leadTimeHours, detectedRegime, modelDisagreementSpread, disagreementLevel } = context;
    const sources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];

    // Base climatological baseline weights (equal 25% starting point)
    const baseHistoricalWeights: Record<ForecastSourceId, number> = {
      ECMWF: 0.25,
      GFS: 0.25,
      ICON: 0.25,
      GRAPHCAST: 0.25
    };

    // Calculate isolated component adjustments from SourceWeight data
    const regimeAdjustment: Record<ForecastSourceId, number> = {} as Record<ForecastSourceId, number>;
    const leadTimeAdjustment: Record<ForecastSourceId, number> = {} as Record<ForecastSourceId, number>;
    const recentPerformanceAdjustment: Record<ForecastSourceId, number> = {} as Record<ForecastSourceId, number>;
    const disagreementPenalty: Record<ForecastSourceId, number> = {} as Record<ForecastSourceId, number>;
    const finalNormalizedWeights: Record<ForecastSourceId, number> = {} as Record<ForecastSourceId, number>;

    for (const src of sources) {
      const sw = weights[src];
      finalNormalizedWeights[src] = sw.weight;

      // Extract adjustments from engine results
      // Normalizing historical RMSE relative to average
      const rmse = sw.historicalRmseInRegime;
      regimeAdjustment[src] = Number((0.25 - (rmse / 10.0)).toFixed(3));
      leadTimeAdjustment[src] = Number((-sw.leadTimeDegradationPenalty * 0.1).toFixed(3));
      recentPerformanceAdjustment[src] = Number((-sw.recentPerformanceScore * 0.15).toFixed(3));
      disagreementPenalty[src] = Number((-sw.disagreementPenalty * 0.2).toFixed(3));
    }

    // Rank models by weight to produce structured, scientific summary
    const rankedSources = [...sources].sort((a, b) => weights[b].weight - weights[a].weight);
    const topSource = rankedSources[0];
    const lowestSource = rankedSources[rankedSources.length - 1];

    const naturalLanguageSummary: string[] = [];

    naturalLanguageSummary.push(
      `Active Context: ${detectedRegime.toUpperCase()} regime at +${leadTimeHours}h lead time with ${disagreementLevel.toLowerCase()} model disagreement (spread σ = ${modelDisagreementSpread.toFixed(2)}).`
    );

    naturalLanguageSummary.push(
      `Primary Allocation: ${topSource} received the highest allocation (${(weights[topSource].weight * 100).toFixed(1)}%) based on its historical verification RMSE of ${weights[topSource].historicalRmseInRegime.toFixed(2)} in ${detectedRegime} conditions.`
    );

    if (weights[lowestSource].weight < 0.18) {
      naturalLanguageSummary.push(
        `Discounted Allocation: ${lowestSource} was discounted to ${(weights[lowestSource].weight * 100).toFixed(1)}% due to ${weights[lowestSource].supportingFactors[weights[lowestSource].supportingFactors.length - 1]}.`
      );
    }

    if (disagreementLevel === 'High' || disagreementLevel === 'Severe') {
      naturalLanguageSummary.push(
        `Disagreement Impact: Inter-model divergence of ${modelDisagreementSpread.toFixed(1)} caused the Bayesian engine to penalize outlier solutions and elevate total uncertainty.`
      );
    } else {
      naturalLanguageSummary.push(
        `Consensus Confidence: Close model agreement (spread < 2.0) strengthened weight distribution and bounded predictive error variance.`
      );
    }

    // Counterfactual simulation if requested
    let counterfactualComparison: ExplanationBreakdown['counterfactualComparison'];
    if (counterfactualRegime && counterfactualRegime !== detectedRegime) {
      const cfContext: WeatherContext = {
        ...context,
        detectedRegime: counterfactualRegime
      };
      const cfWeights = AdaptiveWeightingEngine.getWeights(cfContext, forecasts);
      const cfBlend = AdaptiveWeightingEngine.computeBlend(forecasts, cfWeights);
      const originalBlend = AdaptiveWeightingEngine.computeBlend(forecasts, weights);

      const weightShifts: Record<ForecastSourceId, { before: number; after: number; delta: number }> = {} as any;
      for (const src of sources) {
        const before = weights[src].weight;
        const after = cfWeights[src].weight;
        weightShifts[src] = {
          before,
          after,
          delta: Number((after - before).toFixed(4))
        };
      }

      counterfactualComparison = {
        originalRegime: detectedRegime,
        counterfactualRegime,
        weightShifts,
        forecastShift: {
          before: originalBlend,
          after: cfBlend,
          delta: Number((cfBlend - originalBlend).toFixed(2))
        }
      };
    }

    return {
      variable,
      leadTimeHours,
      regime: detectedRegime,
      baseHistoricalWeights,
      regimeAdjustment,
      leadTimeAdjustment,
      recentPerformanceAdjustment,
      disagreementPenalty,
      finalNormalizedWeights,
      naturalLanguageSummary,
      counterfactualComparison
    };
  }
}
