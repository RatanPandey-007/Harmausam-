/**
 * Centralized Weather Data Architecture — Repository Facade (Phase 2 Multi-Model)
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Multi-model dispatch across real endpoints: ECMWF IFS, NOAA GFS, DWD ICON Global
 * - Strict scientific integrity: AI (GraphCast) marked as DEMO / NOT_CONNECTED
 * - Ground truth observation isolation via MeteostatObservationProvider (never synthetic)
 * - Fault-tolerant parallel execution via Promise.allSettled (partial availability support)
 * - Transparent in-memory TTL caching and in-flight request deduplication
 * - Dynamic station coordinates and variable mapping
 */

import {
  ForecastSourceId,
  ForecastPoint,
  ForecastSeries,
  ForecastSnapshot,
  Observation,
  ProviderHealthStatus,
  ForecastQuery,
  ForecastSeriesQuery,
  SnapshotQuery,
  ObservationQuery,
  ObservationHistoryQuery,
  StationLocation,
  WeatherVariable,
} from './types';
import { WeatherCache, CacheStats } from './cache';
import { ECMWFProvider } from './providers/ecmwf-provider';
import { GFSProvider } from './providers/gfs-provider';
import { ICONProvider } from './providers/icon-provider';
import { MeteostatObservationProvider } from './providers/meteostat-provider';
import { MockWeatherProvider } from './mock-provider';
import {
  AlignmentPipelineOptions,
  AlignmentResult,
} from './alignment/types';
import { dataAlignmentPipeline } from './alignment/alignment-pipeline';
import { BlendEngine } from './blending/blendEngine';
import { BlendedForecastOutput } from './blending/types';
import { ContextEngine } from './context/contextEngine';
import { ModelDisagreement } from './uncertainty/types';
import {
  ExtremeEventDefinition,
  EvaluationMethodId,
  GroupedEvent,
  MatchedEventPair,
  MethodEventEvaluation,
  MultiSourceEventConsensus,
} from './events/types';
import type {
  ResearchPipelineConfig,
  ResearchPipelineResult,
} from './pipeline/types';
import { EventThresholdRegistry } from './events/thresholdConfig';
import { ForecastEventDetector } from './events/forecastEventDetector';
import { ObservationEventDetector } from './events/observationEventDetector';
import { EventGroupingEngine } from './events/eventGrouping';
import { EventMatchingEngine, TimestepEvaluationPoint } from './events/eventMatching';
import { ContingencyMetricsEngine } from './events/contingencyMetrics';
import { ConsensusEngine } from './events/consensusEngine';


export interface BlendedForecastQuery {
  station: StationLocation;
  variable: WeatherVariable;
  leadTimesHours?: number[];
  signal?: AbortSignal;
}


export type PlatformDataMode = 'live' | 'benchmark';

export class WeatherRepository {
  private cache: WeatherCache;
  private mode: PlatformDataMode = 'live';

  // Real Meteorological NWP Providers
  private ecmwfProvider: ECMWFProvider;
  private gfsProvider: GFSProvider;
  private iconProvider: ICONProvider;

  // AI Forecast Source (Maintained strictly as DEMO / NOT_CONNECTED until authentic model is deployed)
  private aiDemoProvider: MockWeatherProvider;

  // Ground Truth Empirical Observation Provider (Strictly separate from forecast generation)
  private observationProvider: MeteostatObservationProvider;

  // Fallback Benchmark Testbed (for offline mode or catastrophic network failure)
  private fallbackProvider: MockWeatherProvider;

  constructor(defaultTtlMs: number = 10 * 60 * 1000) {
    this.cache = new WeatherCache(defaultTtlMs);

    this.ecmwfProvider = new ECMWFProvider();
    this.gfsProvider = new GFSProvider();
    this.iconProvider = new ICONProvider();
    this.aiDemoProvider = new MockWeatherProvider();
    this.observationProvider = new MeteostatObservationProvider();
    this.fallbackProvider = new MockWeatherProvider();

    // Check environment mode if specified
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WEATHER_PROVIDER === 'mock') {
      this.mode = 'benchmark';
    } else {
      this.mode = 'live';
    }
  }

  /**
   * Set operational platform mode ('live' vs 'benchmark')
   */
  public setMode(mode: PlatformDataMode): void {
    if (this.mode !== mode) {
      this.mode = mode;
      this.cache.clear();
    }
  }

  public getMode(): PlatformDataMode {
    return this.mode;
  }

  public isDemonstration(): boolean {
    return this.mode === 'benchmark';
  }

  /**
   * Fetch multi-model point forecasts with resilient parallel dispatch
   */
  public async getForecast(query: ForecastQuery): Promise<ForecastPoint[]> {
    const cacheKey = WeatherCache.generateKey('forecast:points', {
      station: query.stationId,
      lat: Math.round(query.latitude * 100) / 100,
      lon: Math.round(query.longitude * 100) / 100,
      vars: query.variables,
      sources: query.sourceIds,
      lead: query.leadTimeHours ?? 'all',
      leads: query.leadTimesHours,
      mode: this.mode,
    });

    return this.cache.getOrFetch(
      cacheKey,
      async (signal) => {
        if (this.mode === 'benchmark') {
          return await this.fallbackProvider.getForecast({ ...query, signal });
        }

        // Live multi-model ingestion
        const sourcesToFetch: ForecastSourceId[] = query.sourceIds || ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
        const fetchPromises: Promise<ForecastPoint[]>[] = [];

        for (const src of sourcesToFetch) {
          if (src === 'ECMWF') {
            fetchPromises.push(
              this.ecmwfProvider.getForecast({ ...query, sourceIds: ['ECMWF'], signal })
            );
          } else if (src === 'GFS') {
            fetchPromises.push(
              this.gfsProvider.getForecast({ ...query, sourceIds: ['GFS'], signal })
            );
          } else if (src === 'ICON') {
            fetchPromises.push(
              this.iconProvider.getForecast({ ...query, sourceIds: ['ICON'], signal })
            );
          } else if (src === 'GRAPHCAST') {
            // Strict Scientific Integrity: GraphCast AI is kept as DEMO / NOT_CONNECTED
            fetchPromises.push(
              (async () => {
                const demoPoints = await this.aiDemoProvider.getForecast({
                  ...query,
                  sourceIds: ['GRAPHCAST'],
                  signal,
                });
                return demoPoints.map((p) => ({
                  ...p,
                  provider: 'DeepMind (GraphCast AI)',
                  model: 'GraphCast (Demo)',
                  isDemonstration: true,
                  provenance: {
                    ...p.provenance,
                    provider: 'DeepMind (GraphCast AI) [DEMO / NOT_CONNECTED]',
                    isDemonstration: true,
                  },
                  quality: {
                    ...p.quality,
                    flags: [...p.quality.flags, 'AI_MODEL_NOT_CONNECTED_DEMO_BENCHMARK'],
                  },
                }));
              })()
            );
          }
        }

        // Parallel fault-tolerant execution
        const settled = await Promise.allSettled(fetchPromises);
        const combinedPoints: ForecastPoint[] = [];
        let anyNwpSuccess = false;

        for (let idx = 0; idx < settled.length; idx++) {
          const res = settled[idx];
          const src = sourcesToFetch[idx];

          if (res.status === 'fulfilled') {
            combinedPoints.push(...res.value);
            if (src !== 'GRAPHCAST') anyNwpSuccess = true;
          } else {
            console.warn(
              `[WeatherRepository] Live source ${src} query failed for station ${query.stationId}:`,
              res.reason
            );
          }
        }

        // If all real NWP models failed completely, fall back gracefully to benchmark
        if (!anyNwpSuccess && sourcesToFetch.some((s) => s !== 'GRAPHCAST')) {
          console.warn('[WeatherRepository] All live NWP sources failed. Falling back to Benchmark dataset.');
          return await this.fallbackProvider.getForecast({ ...query, signal });
        }

        return combinedPoints;
      },
      { signal: query.signal }
    );
  }

  /**
   * Fetch continuous forecast trajectory time series for a single model
   */
  public async getForecastSeries(query: ForecastSeriesQuery): Promise<ForecastSeries> {
    const cacheKey = WeatherCache.generateKey('forecast:series', {
      station: query.stationId,
      lat: Math.round(query.latitude * 100) / 100,
      lon: Math.round(query.longitude * 100) / 100,
      var: query.variable,
      source: query.sourceIds?.[0] || 'ECMWF',
      leads: query.leadTimes,
      mode: this.mode,
    });

    return this.cache.getOrFetch(
      cacheKey,
      async (signal) => {
        const sourceId = query.sourceIds?.[0] || 'ECMWF';

        if (this.mode === 'benchmark') {
          return await this.fallbackProvider.getForecastSeries({ ...query, signal });
        }

        try {
          if (sourceId === 'ECMWF') {
            return await this.ecmwfProvider.getForecastSeries({ ...query, signal });
          }
          if (sourceId === 'GFS') {
            return await this.gfsProvider.getForecastSeries({ ...query, signal });
          }
          if (sourceId === 'ICON') {
            return await this.iconProvider.getForecastSeries({ ...query, signal });
          }
          if (sourceId === 'GRAPHCAST') {
            const series = await this.aiDemoProvider.getForecastSeries({ ...query, signal });
            return {
              ...series,
              isDemonstration: true,
              points: series.points.map((p) => ({
                ...p,
                provider: 'DeepMind (GraphCast AI)',
                model: 'GraphCast (Demo)',
                isDemonstration: true,
              })),
            };
          }
          return await this.ecmwfProvider.getForecastSeries({ ...query, signal });
        } catch (err: any) {
          if (err?.name === 'AbortError') throw err;
          console.warn(`[WeatherRepository] Live series for ${sourceId} failed, falling back to benchmark:`, err);
          return await this.fallbackProvider.getForecastSeries({ ...query, signal });
        }
      },
      { signal: query.signal }
    );
  }

  /**
   * Fetch synchronized multi-model snapshot across ECMWF, GFS, ICON, and GraphCast
   */
  public async getSnapshot(query: SnapshotQuery): Promise<ForecastSnapshot> {
    const cacheKey = WeatherCache.generateKey('forecast:snapshot', {
      station: query.stationId,
      lat: Math.round(query.latitude * 100) / 100,
      lon: Math.round(query.longitude * 100) / 100,
      var: query.variable,
      lead: query.leadTimeHours,
      mode: this.mode,
    });

    return this.cache.getOrFetch(
      cacheKey,
      async (signal) => {
        const points = await this.getForecast({
          stationId: query.stationId,
          latitude: query.latitude,
          longitude: query.longitude,
          variables: [query.variable],
          leadTimeHours: query.leadTimeHours,
          signal,
        });

        const sources: Record<ForecastSourceId, ForecastPoint> = {} as any;
        for (const pt of points) {
          if (pt.variable === query.variable) {
            sources[pt.sourceId] = pt;
          }
        }

        const validTimestamp = points[0]?.timestamp || new Date().toISOString();

        // Query ground truth observation (Meteostat or Benchmark)
        let observedTruth: Observation | undefined;
        try {
          const obs = await this.getObservation({
            stationId: query.stationId,
            latitude: query.latitude,
            longitude: query.longitude,
            variable: query.variable,
            timestamp: validTimestamp,
            signal,
          });
          if (obs && !isNaN(obs.value)) {
            observedTruth = obs;
          }
        } catch {
          // Leave observedTruth as undefined; never synthesize!
        }

        return {
          stationId: query.stationId,
          latitude: query.latitude,
          longitude: query.longitude,
          variable: query.variable,
          leadTimeHours: query.leadTimeHours,
          validTimestamp,
          sources,
          observedTruth,
          isDemonstration: this.mode === 'benchmark',
        };
      },
      { signal: query.signal }
    );
  }

  /**
   * Fetch ground truth empirical observation
   */
  public async getObservation(query: ObservationQuery): Promise<Observation | null> {
    const cacheKey = WeatherCache.generateKey('observation:point', {
      station: query.stationId,
      var: query.variable,
      timestamp: query.timestamp || 'latest',
      mode: this.mode,
    });

    return this.cache.getOrFetch(
      cacheKey,
      async (signal) => {
        if (this.mode === 'benchmark') {
          return await this.fallbackProvider.getObservation({ ...query, signal });
        }

        // Live observation fetch from Meteostat
        const obs = await this.observationProvider.getObservation({ ...query, signal });
        return obs;
      },
      { signal: query.signal }
    );
  }

  /**
   * Fetch chronological empirical observation history
   */
  public async getObservationHistory(query: ObservationHistoryQuery): Promise<Observation[]> {
    const cacheKey = WeatherCache.generateKey('observation:history', {
      station: query.stationId,
      var: query.variable,
      start: query.startTimestamp,
      end: query.endTimestamp,
      mode: this.mode,
    });

    return this.cache.getOrFetch(
      cacheKey,
      async (signal) => {
        if (this.mode === 'benchmark') {
          return await this.fallbackProvider.getObservationHistory({ ...query, signal });
        }

        return await this.observationProvider.getObservationHistory({ ...query, signal });
      },
      { signal: query.signal }
    );
  }

  /**
   * Query operational health and availability across all connected providers
   */
  public async getProviderHealth(): Promise<ProviderHealthStatus[]> {
    const healthList: ProviderHealthStatus[] = [];

    // 1. ECMWF IFS
    try {
      healthList.push(await this.ecmwfProvider.getHealth());
    } catch {
      healthList.push({
        source: 'ECMWF',
        status: 'OFFLINE',
        operationalStatus: 'ERROR',
        providerName: 'ECMWF',
        model: 'IFS',
        latencyMs: 0,
        lastSuccessfulSync: '',
        errorMessage: 'Health check failed',
        consecutiveFailures: 1,
        dataFreshnessMinutes: 999,
        isDemonstration: false,
      });
    }

    // 2. NOAA GFS
    try {
      healthList.push(await this.gfsProvider.getHealth());
    } catch {
      healthList.push({
        source: 'GFS',
        status: 'OFFLINE',
        operationalStatus: 'ERROR',
        providerName: 'NOAA',
        model: 'GFS',
        latencyMs: 0,
        lastSuccessfulSync: '',
        errorMessage: 'Health check failed',
        consecutiveFailures: 1,
        dataFreshnessMinutes: 999,
        isDemonstration: false,
      });
    }

    // 3. DWD ICON
    try {
      healthList.push(await this.iconProvider.getHealth());
    } catch {
      healthList.push({
        source: 'ICON',
        status: 'OFFLINE',
        operationalStatus: 'ERROR',
        providerName: 'DWD',
        model: 'ICON',
        latencyMs: 0,
        lastSuccessfulSync: '',
        errorMessage: 'Health check failed',
        consecutiveFailures: 1,
        dataFreshnessMinutes: 999,
        isDemonstration: false,
      });
    }

    // 4. GraphCast AI (Strictly marked as DEMO / NOT_CONNECTED)
    healthList.push({
      source: 'GRAPHCAST',
      status: 'DEMO_DATA',
      operationalStatus: 'NOT_CONNECTED',
      providerName: 'Google DeepMind',
      model: 'GraphCast (Benchmark Surrogate)',
      latencyMs: 0,
      lastSuccessfulSync: new Date().toISOString(),
      errorMessage: 'Live AI model endpoint is not connected; using calibrated demonstration testbed.',
      consecutiveFailures: 0,
      dataFreshnessMinutes: 0,
      isDemonstration: true,
    });

    // 5. Meteostat Observation Network
    try {
      healthList.push(await this.observationProvider.getHealth());
    } catch {
      healthList.push({
        source: 'OBSERVATION_NETWORK',
        status: 'OFFLINE',
        operationalStatus: 'UNAVAILABLE',
        providerName: 'Meteostat',
        model: 'Surface Station Network',
        latencyMs: 0,
        lastSuccessfulSync: '',
        errorMessage: 'Observation provider unavailable',
        consecutiveFailures: 1,
        dataFreshnessMinutes: 999,
        isDemonstration: false,
      });
    }

    return healthList;
  }

  /**
   * Fetch fully harmonized, quality-controlled, and lead-time aligned multi-model dataset
   */
  public async getAlignedForecast(options: AlignmentPipelineOptions): Promise<AlignmentResult> {
    const rawPoints = await this.getForecast({
      stationId: options.stationId,
      latitude: options.latitude,
      longitude: options.longitude,
      variables: [options.variable],
      leadTimesHours: options.targetLeadTimes || [0, 6, 12, 24, 48, 72, 120, 168],
      signal: options.signal,
    });

    // Query matching observation if available
    let obsList: Observation[] = [];
    try {
      const singleObs = await this.getObservation({
        stationId: options.stationId,
        latitude: options.latitude,
        longitude: options.longitude,
        variable: options.variable,
        signal: options.signal,
      });
      if (singleObs && !isNaN(singleObs.value)) {
        obsList.push(singleObs);
      }
    } catch {
      // Gracefully continue; observation missing without synthetic filling
    }

    return dataAlignmentPipeline.align(options, rawPoints, obsList);
  }

  /**
   * Fetch multi-lead, quality-controlled, context-aware blended forecast trajectory
   * evaluating all 4 baselines (Individual, Equal-Weight, Fixed-Weight, Adaptive Blend)
   */
  public async getBlendedForecast(query: BlendedForecastQuery): Promise<BlendedForecastOutput[]> {
    const leadTimes = query.leadTimesHours || [0, 6, 12, 24, 48, 72, 120, 168];
    const alignedResult = await this.getAlignedForecast({
      stationId: query.station.id,
      latitude: query.station.latitude,
      longitude: query.station.longitude,
      variable: query.variable,
      targetLeadTimes: leadTimes,
      signal: query.signal,
    });

    const trajectory: BlendedForecastOutput[] = [];

    for (const step of alignedResult.timesteps) {
      const tempVal = query.variable === 'temperature_2m' ? step.values.ECMWF ?? step.values.GFS : undefined;
      const precipVal = query.variable === 'precipitation' ? step.values.ECMWF ?? step.values.GFS : undefined;
      const windVal = query.variable === 'wind_speed_10m' ? step.values.ECMWF ?? step.values.GFS : undefined;

      const rawVals = Object.values(step.values).filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
      const mean = rawVals.length > 0 ? rawVals.reduce((a, b) => a + b, 0) / rawVals.length : 0;
      const spread = rawVals.length > 1
        ? Math.sqrt(rawVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (rawVals.length - 1))
        : 0;

      const context = ContextEngine.evaluate({
        stationId: query.station.id,
        latitude: query.station.latitude,
        longitude: query.station.longitude,
        validTimestamp: step.validTime,
        leadTimeHours: step.leadTimeHours,
        variable: query.variable,
        meteorologicalInputs: {
          temperature2m: tempVal,
          precipitation3h: precipVal,
          windSpeed10m: windVal,
          climatologicalMeanTemp: query.station.climatology.tempMean,
          climatologicalStdTemp: query.station.climatology.tempStd,
          modelSpread: spread,
        },
        modelSpread: spread,
      });

      const blendOutput = BlendEngine.compute({
        variable: query.variable,
        timestamp: step.validTime,
        leadTimeHours: step.leadTimeHours,
        station: query.station,
        context,
        individualForecasts: step.values,
        observationValue: step.observedTruth?.value ?? null,
      });

      trajectory.push(blendOutput);
    }

    return trajectory;
  }

  /**
   * Evaluate multi-model disagreement across a multi-lead trajectory
   */
  public async getDisagreementTrajectory(query: {
    station: StationLocation;
    variable: WeatherVariable;
    leadTimesHours?: number[];
    signal?: AbortSignal;
  }): Promise<ModelDisagreement[]> {
    const blended = await this.getBlendedForecast(query);
    return blended
      .map(b => b.disagreement)
      .filter((d): d is ModelDisagreement => d !== undefined);
  }

  /**
   * Evaluate multi-model disagreement at a single lead time
   */
  public async getModelDisagreement(query: {
    station: StationLocation;
    variable: WeatherVariable;
    leadTimeHours: number;
    signal?: AbortSignal;
  }): Promise<ModelDisagreement | null> {
    const trajectory = await this.getDisagreementTrajectory({
      station: query.station,
      variable: query.variable,
      leadTimesHours: [query.leadTimeHours],
      signal: query.signal,
    });
    return trajectory[0] ?? null;
  }

  /**
   * Evaluate extreme-event detection, multi-source consensus, and verification
   * across aligned forecast and observation streams.
   */
  public async getExtremeEventAnalysis(query: {
    station: StationLocation;
    eventType: string;
    customThreshold?: number;
    leadTimesHours?: number[];
    signal?: AbortSignal;
  }): Promise<{
    definition: ExtremeEventDefinition;
    consensus: MultiSourceEventConsensus;
    groupedForecastEvents: GroupedEvent[];
    groupedObservedEvents: GroupedEvent[];
    matchedPairs: MatchedEventPair[];
    methodEvaluations: MethodEventEvaluation[];
    observationVerificationAvailable: boolean;
  }> {
    const baseDef = EventThresholdRegistry.getDefinition(query.eventType);
    const definition: ExtremeEventDefinition = {
      ...baseDef,
      threshold: query.customThreshold !== undefined ? query.customThreshold : baseDef.threshold,
    };

    const trajectory = await this.getBlendedForecast({
      station: query.station,
      variable: definition.variable,
      leadTimesHours: query.leadTimesHours,
      signal: query.signal,
    });

    // 1. Forecast Event Detection
    const forecastDetections = ForecastEventDetector.detectFromBlendedTrajectory(trajectory, definition);
    const groupedForecastEvents = EventGroupingEngine.groupForecastEvents(forecastDetections, definition);

    // 2. Observation Event Detection & Grouping
    const obsDetections = trajectory.map(step =>
      ObservationEventDetector.detect({
        station: query.station,
        def: definition,
        timestamp: step.timestamp,
        observedValue: step.observationValue,
        observationSource: 'Station Ground Truth',
      })
    );
    const groupedObservedEvents = EventGroupingEngine.groupObservationEvents(obsDetections, definition);
    const observationVerificationAvailable = obsDetections.some(o => o.verificationStatus === 'AVAILABLE');

    // 3. Spatiotemporal Event Matching across all methods
    const evaluationPoints: TimestepEvaluationPoint[] = [];
    for (const step of trajectory) {
      const obsDetected = step.observationValue !== null && step.observationValue !== undefined
        ? EventThresholdRegistry.isThresholdExceeded(step.observationValue, definition)
        : null;

      const methods: { id: EvaluationMethodId; val: number | null }[] = [
        { id: 'ECMWF', val: step.individualForecasts.ECMWF },
        { id: 'GFS', val: step.individualForecasts.GFS },
        { id: 'ICON', val: step.individualForecasts.ICON },
        { id: 'EQUAL_WEIGHT', val: step.equalWeightForecast },
        { id: 'FIXED_WEIGHT', val: step.fixedWeightForecast },
        { id: 'ADAPTIVE_BLEND', val: step.adaptiveBlendedForecast },
      ];

      for (const m of methods) {
        if (m.val !== null) {
          evaluationPoints.push({
            station: query.station,
            validTime: step.timestamp,
            leadTimeHours: step.leadTimeHours,
            eventType: definition.eventType,
            method: m.id,
            forecastValue: m.val,
            observedValue: step.observationValue ?? null,
            threshold: definition.threshold,
            forecastExceeded: EventThresholdRegistry.isThresholdExceeded(m.val, definition),
            observedExceeded: obsDetected,
          });
        }
      }
    }

    const matchedPairs = EventMatchingEngine.evaluateDataset(evaluationPoints);

    // 4. Contingency Metrics across all methods on identical evaluation cohort
    const evalStart = trajectory.length > 0 ? trajectory[0].timestamp : '';
    const evalEnd = trajectory.length > 0 ? trajectory[trajectory.length - 1].timestamp : '';
    const methodEvaluations = ContingencyMetricsEngine.evaluateAllMethods(matchedPairs, evalStart, evalEnd);

    // 5. Multi-Source Consensus at peak threat step
    const peakStep = trajectory.reduce((max, curr) => {
      const currVal = curr.adaptiveBlendedForecast ?? 0;
      const maxVal = max.adaptiveBlendedForecast ?? 0;
      return definition.operator === '<=' ? (currVal < maxVal ? curr : max) : (currVal > maxVal ? curr : max);
    }, trajectory[0]);

    const consensus = ConsensusEngine.evaluateConsensus({
      def: definition,
      sourceValues: peakStep ? peakStep.individualForecasts : { ECMWF: null, GFS: null, ICON: null, GRAPHCAST: null },
      adaptiveWeights: {
        ECMWF: peakStep?.adaptiveWeights.ECMWF?.weight ?? 0.25,
        GFS: peakStep?.adaptiveWeights.GFS?.weight ?? 0.25,
        ICON: peakStep?.adaptiveWeights.ICON?.weight ?? 0.25,
        GRAPHCAST: peakStep?.adaptiveWeights.GRAPHCAST?.weight ?? 0.25,
      },
      blendValue: peakStep?.adaptiveBlendedForecast ?? 0,
      modelSpread: peakStep?.disagreement?.standardDeviation ?? null,
      observedValue: peakStep?.observationValue,
    });

    return {
      definition,
      consensus,
      groupedForecastEvents,
      groupedObservedEvents,
      matchedPairs,
      methodEvaluations,
      observationVerificationAvailable,
    };
  }

  /**
   * Execute full automated meteorological research pipeline (Phase 7)
   */
  public async runResearchPipeline(
    config?: Partial<ResearchPipelineConfig>
  ): Promise<ResearchPipelineResult> {
    const { ResearchPipelineOrchestrator } = await import('./pipeline/orchestrator');
    return ResearchPipelineOrchestrator.run(config);
  }

  public getCacheStats(): Readonly<CacheStats> {
    return this.cache.getStats();
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

/** Application-wide singleton repository instance */
export const weatherRepository = new WeatherRepository();
