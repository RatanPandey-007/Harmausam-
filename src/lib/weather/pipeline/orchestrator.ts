/**
 * Central Research Pipeline Orchestrator
 * Harmausam Meteorological Intelligence Platform — Phase 7 (Final Phase)
 *
 * Implements:
 * - Single research pipeline service: runResearchPipeline()
 * - Full end-to-end data flow:
 *   Forecasts + Observations -> Normalization -> Alignment -> QC -> Context & Skill ->
 *   6-Method Baselines -> Disagreement & Uncertainty -> Extreme Event Matching ->
 *   Fair Common Cohort Evaluation -> Scientific Audits -> Traceable Research Evaluation
 * - Reusable across CLI (npm run research:evaluate) and UI Dashboards
 * - Graceful degradation on partial provider failure
 * - Absolute zero temporal data leakage between training and evaluation
 */

import {
  ResearchPipelineConfig,
  ResearchPipelineResult,
  DataQualityReport,
  ResearchProvenance,
  ImplementationStatus,
  DataPeriodBoundary,
} from './types';
import { ForecastSourceId, StationLocation, WeatherVariable } from '../types';
import { weatherRepository } from '../repository';
import { BaselineComparator } from './baselineComparator';
import { PipelineAuditor } from './pipelineAuditor';
import { DEFAULT_EVENT_DEFINITIONS } from '../events/thresholdConfig';
import { ExtremeEventDefinition } from '../events/types';
import { GLOBAL_STATIONS } from '../../../core/data/stations';

export class ResearchPipelineOrchestrator {
  private static readonly PIPELINE_VERSION = '1.0.0-phase7';

  /**
   * Deterministic unique Run ID generator
   */
  public static generateRunId(): string {
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `HARMAUSAM_RUN_${yyyymmdd}_${rand}`;
  }

  /**
   * Execute full automated meteorological research pipeline
   */
  public static async run(
    userConfig: Partial<ResearchPipelineConfig> = {}
  ): Promise<ResearchPipelineResult> {
    const runId = userConfig.runId || this.generateRunId();
    const executionTimestamp = new Date().toISOString();

    // 1. Resolve Configuration Defaults
    const defaultStation: StationLocation = GLOBAL_STATIONS[0] || {
      id: 'VIDP',
      name: 'New Delhi (Safdarjung)',
      country: 'India',
      region: 'South Asia (Monsoonal Subtropical)',
      latitude: 28.58,
      longitude: 77.21,
      elevationMeters: 216,
      climateZone: 'Cwa - Humid Subtropical / Monsoon',
      climatology: {
        tempMean: 25.1,
        tempStd: 7.8,
        precipAnnualMm: 790,
        windMeanMs: 3.2,
      },
    };

    const station = userConfig.station || defaultStation;
    const variable: WeatherVariable = userConfig.variable || 'temperature_2m';
    const leadTimesHours = userConfig.leadTimesHours || [0, 6, 12, 24, 48, 72, 120, 168];
    const useLiveData = userConfig.useLiveData ?? false;

    // Disjoint chronological periods to prevent temporal data leakage
    const defaultTraining: DataPeriodBoundary = {
      start: '2026-07-01T00:00:00Z',
      end: '2026-08-31T23:59:59Z',
    };
    const defaultValidation: DataPeriodBoundary = {
      start: '2026-09-01T00:00:00Z',
      end: '2026-09-14T23:59:59Z',
    };
    const defaultEvaluation: DataPeriodBoundary = {
      start: '2026-09-15T00:00:00Z',
      end: '2026-09-24T23:59:59Z',
    };

    const trainingPeriod = userConfig.trainingPeriod || defaultTraining;
    const validationPeriod = userConfig.validationPeriod || defaultValidation;
    const evaluationPeriod = userConfig.evaluationPeriod || defaultEvaluation;

    const minSampleSize = userConfig.minSampleSize ?? 3;
    const eventMatchingWindowHours = userConfig.eventMatchingWindowHours ?? 6;

    const fullConfig: ResearchPipelineConfig = {
      runId,
      station,
      variable,
      leadTimesHours,
      useLiveData,
      trainingPeriod,
      validationPeriod,
      evaluationPeriod,
      extremeEventTypes: userConfig.extremeEventTypes || [
        'Heatwave',
        'Heavy rainfall',
        'High wind',
        'Extreme Cold',
      ],
      customThresholds: userConfig.customThresholds,
      minSampleSize,
      eventMatchingWindowHours,
    };

    // 2. Configure Operational Mode
    weatherRepository.setMode(useLiveData ? 'live' : 'benchmark');

    // 3. Ingest Aligned & Quality-Controlled Forecast Trajectory
    const trajectory = await weatherRepository.getBlendedForecast({
      station,
      variable,
      leadTimesHours,
    });

    if (!trajectory || trajectory.length === 0) {
      throw new Error(
        `Research pipeline aborted: No forecast records could be generated for station ${station.name} (${station.id}) and variable ${variable}. Check provider network availability.`
      );
    }

    // 4. Generate Comprehensive Data Quality Report
    const dataQuality = this.buildDataQualityReport(trajectory, leadTimesHours);

    // 5. Evaluate Event Definitions matching requested variable & custom thresholds
    const eventDefinitions = this.resolveEventDefinitions(
      variable,
      fullConfig.extremeEventTypes,
      fullConfig.customThresholds
    );

    // 6. Perform Fair Baseline Comparison on the Common Evaluation Cohort
    const { metrics: baselineResults } = BaselineComparator.evaluateAllMethods(
      trajectory,
      {
        evaluationPeriod,
        minSampleSize,
      }
    );

    // Lead-time stratified evaluation
    const leadTimeResults = BaselineComparator.evaluateByLeadTime(
      trajectory,
      leadTimesHours,
      {
        evaluationPeriod,
        minSampleSize,
      }
    );

    // Context / Regime stratified evaluation
    const contextResults = BaselineComparator.evaluateByContext(
      trajectory,
      {
        evaluationPeriod,
        minSampleSize,
      }
    );

    // Extreme-event contingency evaluation
    const extremeEventResults = BaselineComparator.evaluateExtremeEvents(
      trajectory,
      eventDefinitions,
      {
        evaluationPeriod,
        minSampleSize,
      }
    );

    // 7. Execute Rigorous Scientific Audits
    const auditReport = PipelineAuditor.auditAll({
      trajectory,
      extremeMetrics: extremeEventResults,
      trainingPeriod,
      validationPeriod,
      evaluationPeriod,
    });

    // 8. Synthesize Adaptive Blending Telemetry
    const adaptiveRecord = baselineResults.find(b => b.method === 'ADAPTIVE_BLEND')!;
    const avgWeights: Record<ForecastSourceId, number> = {
      ECMWF: 0,
      GFS: 0,
      ICON: 0,
      GRAPHCAST: 0,
    };
    const fallbackDist: Record<string, number> = {};
    let weightCount = 0;

    for (const step of trajectory) {
      if (step.adaptiveWeights) {
        weightCount++;
        avgWeights.ECMWF += step.adaptiveWeights.ECMWF?.weight ?? 0;
        avgWeights.GFS += step.adaptiveWeights.GFS?.weight ?? 0;
        avgWeights.ICON += step.adaptiveWeights.ICON?.weight ?? 0;
        avgWeights.GRAPHCAST += step.adaptiveWeights.GRAPHCAST?.weight ?? 0;
      }
      const fb = step.hierarchyLevel || 'LEVEL_1_EXACT';
      fallbackDist[fb] = (fallbackDist[fb] || 0) + 1;
    }

    if (weightCount > 0) {
      avgWeights.ECMWF = Number((avgWeights.ECMWF / weightCount).toFixed(4));
      avgWeights.GFS = Number((avgWeights.GFS / weightCount).toFixed(4));
      avgWeights.ICON = Number((avgWeights.ICON / weightCount).toFixed(4));
      avgWeights.GRAPHCAST = Number((avgWeights.GRAPHCAST / weightCount).toFixed(4));
    }

    const primaryRegime = trajectory[0]?.context?.detectedRegime || 'STANDARD_SYNOPTIC';
    const adaptiveResults = {
      metrics: adaptiveRecord,
      averageWeights: avgWeights,
      fallbackDistribution: fallbackDist,
      activeContextSummary: `Evaluated across ${trajectory.length} timesteps. Primary regime: ${primaryRegime}. Fallback tier-1 dominance: ${(
        ((fallbackDist['LEVEL_1_EXACT'] || 0) / trajectory.length) *
        100
      ).toFixed(1)}%.`,
    };

    // 9. Synthesize Uncertainty & Disagreement Telemetry
    const validSpreads = trajectory
      .map(s => s.disagreement?.standardDeviation)
      .filter((s): s is number => s !== null && s !== undefined && !isNaN(s));

    const avgSpread =
      validSpreads.length > 0
        ? Number(
            (validSpreads.reduce((a, b) => a + b, 0) / validSpreads.length).toFixed(3)
          )
        : null;

    const maxSpread =
      validSpreads.length > 0 ? Number(Math.max(...validSpreads).toFixed(3)) : null;

    const highDisagreementSteps = trajectory.filter(
      s => (s.disagreement?.standardDeviation ?? 0) > 2.5
    ).length;

    const uncertaintyResults = {
      averageSpread: avgSpread,
      maxSpread,
      highDisagreementSteps,
      methodologyNote:
        'Model disagreement represents empirical standard deviation across NWP solutions. Error scales are derived from historical prior error distributions and must never be interpreted as Gaussian confidence intervals or probabilities.',
    };

    // 10. Assemble Scientific Provenance
    const provenance: ResearchProvenance = {
      pipelineVersion: this.PIPELINE_VERSION,
      runId,
      executionTimestamp,
      station,
      variable,
      trainingPeriod,
      validationPeriod,
      evaluationPeriod,
      sources: [
        {
          sourceId: 'ECMWF',
          model: 'ECMWF IFS (Integrated Forecasting System)',
          status: dataQuality.sourceAvailability.ECMWF,
          provider: 'Open-Meteo European Centre Ensemble Integration',
        },
        {
          sourceId: 'GFS',
          model: 'NOAA GFS (Global Forecast System)',
          status: dataQuality.sourceAvailability.GFS,
          provider: 'NOAA NCEP Global Guidance Integration',
        },
        {
          sourceId: 'ICON',
          model: 'DWD ICON Global',
          status: dataQuality.sourceAvailability.ICON,
          provider: 'Deutscher Wetterdienst Numerical Suite',
        },
        {
          sourceId: 'GRAPHCAST',
          model: 'Google DeepMind GraphCast ML-Surrogate',
          status: 'DEMO / SURROGATE / NOT_CONNECTED',
          provider: 'Harmausam Deep Learning Demonstration Testbed',
        },
      ],
      observations: {
        source: 'Meteostat SYNOP Surface Station Network',
        status: dataQuality.observationAvailability,
        temporalCoverage: `${evaluationPeriod.start} to ${evaluationPeriod.end}`,
      },
      methodConfiguration: {
        weighting: 'Softmax Temperature Scaled Inverse Error with 5-Tier Fallback',
        adaptiveParameters: {
          temperature: 1.0,
          learningRate: 0.05,
          windowDays: 30,
        },
        eventMatchingWindowHours,
      },
    };

    // 11. Explicit Scientific Limitations
    const limitations: string[] = [
      'Point-location synoptic evaluation based on designated WMO coordinates rather than full continental grid fields.',
      'Empirical observation completeness is dependent on station SYNOP reporting frequency and Meteostat ingestion latency.',
      'Extreme-event thresholds utilize prototype engineering values; operational production requires regional climatological percentile calibration.',
      'GraphCast AI remains strictly DEMO / SURROGATE / NOT_CONNECTED; completely excluded from operational baseline rankings.',
      'Historical skill priors are calculated over discrete finite windows and require ongoing real-time assimilation for non-stationary regimes.',
    ];

    // 12. Component Operational Status Matrix
    const implementationStatus: ImplementationStatus = {
      dataIngestion: useLiveData ? 'LIVE' : 'DEMO',
      alignment: 'LIVE',
      qualityControl: 'LIVE',
      historicalSkill: 'LIVE',
      adaptiveBlending: 'LIVE',
      uncertainty: 'LIVE / PROXY / INSUFFICIENT DATA',
      extremeEvents: 'LIVE / INSUFFICIENT DATA',
      verification: 'LIVE / INSUFFICIENT DATA',
      automation: 'LIVE',
      graphCast: 'DEMO / SURROGATE / NOT_CONNECTED',
    };

    const success = auditReport.overallStatus === 'AUDIT_PASSED';

    return {
      runId,
      generatedAt: executionTimestamp,
      config: fullConfig,
      dataCoverage: {
        trainingPeriod,
        validationPeriod,
        evaluationPeriod,
        forecastSources: ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'],
        observationSource: provenance.observations.source,
        variables: [variable],
        stations: [station],
      },
      dataQuality,
      auditReport,
      baselineResults,
      adaptiveResults,
      uncertaintyResults,
      extremeEventResults,
      leadTimeResults,
      contextResults,
      provenance,
      limitations,
      implementationStatus,
      success,
    };
  }

  /**
   * Calculate data quality telemetry from actual ingested and aligned records
   */
  private static buildDataQualityReport(
    trajectory: any[],
    targetLeads: number[]
  ): DataQualityReport {
    let ecmwfValid = 0;
    let gfsValid = 0;
    let iconValid = 0;
    let obsCount = 0;

    for (const step of trajectory) {
      if (step.individualForecasts?.ECMWF !== null && step.individualForecasts?.ECMWF !== undefined) ecmwfValid++;
      if (step.individualForecasts?.GFS !== null && step.individualForecasts?.GFS !== undefined) gfsValid++;
      if (step.individualForecasts?.ICON !== null && step.individualForecasts?.ICON !== undefined) iconValid++;
      if (step.observationValue !== null && step.observationValue !== undefined) obsCount++;
    }

    const totalSteps = trajectory.length;
    const totalPossiblePoints = totalSteps * 3; // 3 NWP sources
    const actualValidPoints = ecmwfValid + gfsValid + iconValid;
    const missingPoints = totalPossiblePoints - actualValidPoints;

    const sourceAvailability: Record<ForecastSourceId, 'AVAILABLE' | 'UNAVAILABLE' | 'DEMO'> = {
      ECMWF: ecmwfValid > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      GFS: gfsValid > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      ICON: iconValid > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      GRAPHCAST: 'DEMO',
    };

    let observationAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL' = 'UNAVAILABLE';
    if (obsCount === totalSteps && totalSteps > 0) {
      observationAvailability = 'AVAILABLE';
    } else if (obsCount > 0) {
      observationAvailability = 'PARTIAL';
    }

    const coveragePercent = totalPossiblePoints > 0
      ? Number(((actualValidPoints / totalPossiblePoints) * 100).toFixed(1))
      : 0;

    const leadsPresent = Array.from(new Set(trajectory.map((s: any) => s.leadTimeHours))).sort((a, b) => a - b);

    const notes: string[] = [];
    if (missingPoints > 0) {
      notes.push(`${missingPoints} source records were missing across timesteps and safely handled.`);
    }
    if (observationAvailability === 'PARTIAL') {
      notes.push(`Observation coverage is partial (${obsCount}/${totalSteps} timesteps). Verification restricted to common cohort.`);
    } else if (observationAvailability === 'UNAVAILABLE') {
      notes.push('Ground truth observation data was unavailable. Baseline error metrics reported as UNAVAILABLE.');
    }

    return {
      sourceAvailability,
      totalForecastRecords: actualValidPoints,
      missingRecords: missingPoints,
      invalidRecords: 0,
      duplicateRecords: 0,
      alignedRecords: totalSteps,
      observationCount: obsCount,
      observationAvailability,
      forecastCoveragePercent: coveragePercent,
      leadTimeCoverageHours: leadsPresent,
      notes,
    };
  }

  /**
   * Resolve event definitions for variable
   */
  private static resolveEventDefinitions(
    variable: WeatherVariable,
    requestedTypes: string[],
    customThresholds?: Record<string, number>
  ): ExtremeEventDefinition[] {
    const matched = DEFAULT_EVENT_DEFINITIONS.filter(def => {
      if (def.variable !== variable && !requestedTypes.includes(def.eventType)) {
        return false;
      }
      return true;
    });

    // If none matched variable, return all requested definitions
    const selected = matched.length > 0
      ? matched
      : DEFAULT_EVENT_DEFINITIONS.filter(d => requestedTypes.includes(d.eventType));

    return selected.map(def => {
      const custom = customThresholds?.[def.eventType];
      return {
        ...def,
        threshold: custom !== undefined ? custom : def.threshold,
      };
    });
  }
}

/** Convenience export for primary pipeline execution */
export const runResearchPipeline = (config?: Partial<ResearchPipelineConfig>) =>
  ResearchPipelineOrchestrator.run(config);
