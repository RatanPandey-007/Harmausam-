/**
 * Centralized Weather Data Architecture — Mock Research Provider
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Deterministic meteorological benchmark testbed for multi-model evaluation
 * - Full adherence to WeatherProvider and ObservationProvider interfaces
 * - Explicit scientific integrity markings: ALWAYS sets `isDemonstration: true`
 * - Strict normalization: UTC ISO-8601 timestamps, SI units, physical bounding QC
 * - Zero fabricated accuracy claims: clearly labeled as benchmark demonstration data
 */

import {
  ForecastSourceId,
  WeatherVariable,
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
  DataQuality,
  WeatherRegime,
} from './types';
import { WeatherProvider, ObservationProvider } from './provider';
import {
  CANONICAL_UNITS,
  normalizeTimestamp,
  normalizeCoordinates,
  validatePhysicalBounds,
} from './normalization';
import { getStationById } from '../../core/data/stations';

export class MockWeatherProvider implements WeatherProvider, ObservationProvider {
  public readonly name: string = 'Harmausam Research Benchmark Testbed';
  public readonly isDemonstration: boolean = true;

  private readonly sourceMetadata: Record<
    ForecastSourceId,
    { name: string; institution: string; resolutionKm: number; updateCycleHours: number }
  > = {
    ECMWF: {
      name: 'ECMWF IFS (Integrated Forecasting System)',
      institution: 'European Centre for Medium-Range Weather Forecasts',
      resolutionKm: 9.0,
      updateCycleHours: 6,
    },
    GFS: {
      name: 'NCEP GFS (Global Forecast System)',
      institution: 'National Oceanic and Atmospheric Administration (NOAA)',
      resolutionKm: 13.0,
      updateCycleHours: 6,
    },
    ICON: {
      name: 'DWD ICON (Icosahedral Nonhydrostatic)',
      institution: 'Deutscher Wetterdienst & Max Planck Institute',
      resolutionKm: 13.0,
      updateCycleHours: 6,
    },
    GRAPHCAST: {
      name: 'DeepMind GraphCast AI',
      institution: 'Google DeepMind & ECMWF collaboration',
      resolutionKm: 28.0,
      updateCycleHours: 6,
    },
  };

  /**
   * Health and availability check
   */
  public async isAvailable(): Promise<boolean> {
    return true; // Benchmark dataset is always available locally
  }

  /**
   * Fetch point forecasts for requested station and variables
   */
  public async getForecast(query: ForecastQuery): Promise<ForecastPoint[]> {
    if (query.signal?.aborted) {
      throw new DOMException('Forecast query aborted', 'AbortError');
    }

    const { latitude, longitude } = normalizeCoordinates(query.latitude, query.longitude);
    const station = getStationById(query.stationId);
    const sources: ForecastSourceId[] = query.sourceIds || ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'];
    const leadTimes: number[] = query.leadTimesHours || (query.leadTimeHours !== undefined ? [query.leadTimeHours] : [0, 6, 12, 24, 48, 72, 120, 168]);
    const baseDate = new Date('2026-09-22T00:00:00Z');
    const initTimestamp = normalizeTimestamp(baseDate);

    const points: ForecastPoint[] = [];

    for (const lead of leadTimes) {
      const validTimestamp = normalizeTimestamp(new Date(baseDate.getTime() + lead * 3600 * 1000));

      for (const variable of query.variables) {
        const synth = this.generateSynthesizedObservation(station.id, variable, lead);
        const obsValue = synth.observation;

        for (const src of sources) {
          const value = this.applyModelErrorProfile(src, variable, lead, obsValue);
          const boundCheck = validatePhysicalBounds(variable, value);
          const roundedVal = Math.round(value * 100) / 100;
          const roundedObs = lead <= 48 ? Math.round(obsValue * 100) / 100 : undefined;

          const quality: DataQuality = {
            isValid: boundCheck.isValid,
            flags: [
              ...boundCheck.flags,
              'BENCHMARK_SYNTHESIZED_RECORD',
              'QC_INSPECTION_PASS',
            ],
            completenessScore: 1.0,
            latencyMs: 1.2,
            checkResults: {
              physicalLimitsPassed: boundCheck.isValid,
              rateOfChangePassed: true,
              persistencePassed: true,
            },
          };

          points.push({
            id: `BENCH_${src}_${station.id}_${variable}_+${lead}h`,
            stationId: station.id,
            latitude,
            longitude,
            variable,
            value: roundedVal,
            forecastValue: roundedVal,
            observationValue: roundedObs,
            unit: CANONICAL_UNITS[variable],
            leadTimeHours: lead,
            timestamp: validTimestamp,
            initializationTime: initTimestamp,
            sourceId: src,
            quality,
            provenance: {
              sourceId: src,
              provider: `${this.name} (${this.sourceMetadata[src].name})`,
              retrievalTimestamp: normalizeTimestamp(new Date()),
              forecastInitTimestamp: initTimestamp,
              validTimestamp,
              leadTimeHours: lead,
              variable,
              unit: CANONICAL_UNITS[variable],
              horizontalResolutionKm: this.sourceMetadata[src].resolutionKm,
              isDemonstration: true,
            },
            qcPassed: boundCheck.isValid,
            isDemonstration: true,
          });
        }
      }
    }

    return points;
  }

  /**
   * Fetch continuous time series trajectory for a variable and station
   */
  public async getForecastSeries(query: ForecastSeriesQuery): Promise<ForecastSeries> {
    if (query.signal?.aborted) {
      throw new DOMException('Forecast series query aborted', 'AbortError');
    }

    const { latitude, longitude } = normalizeCoordinates(query.latitude, query.longitude);
    const station = getStationById(query.stationId);
    const sourceId = query.sourceIds?.[0] || 'ECMWF';
    const leadTimes = query.leadTimes || [0, 6, 12, 24, 48, 72, 120, 168];
    const baseDate = new Date('2026-09-22T00:00:00Z');
    const initTimestamp = normalizeTimestamp(baseDate);

    const points: ForecastPoint[] = [];

    for (const lead of leadTimes) {
      const validTimestamp = normalizeTimestamp(new Date(baseDate.getTime() + lead * 3600 * 1000));
      const synth = this.generateSynthesizedObservation(station.id, query.variable, lead);
      const obsValue = synth.observation;
      const value = this.applyModelErrorProfile(sourceId, query.variable, lead, obsValue);
      const boundCheck = validatePhysicalBounds(query.variable, value);

      points.push({
        id: `SERIES_${sourceId}_${station.id}_${query.variable}_+${lead}h`,
        stationId: station.id,
        latitude,
        longitude,
        variable: query.variable,
        value: Math.round(value * 100) / 100,
        unit: CANONICAL_UNITS[query.variable],
        leadTimeHours: lead,
        timestamp: validTimestamp,
        initializationTime: initTimestamp,
        sourceId,
        quality: {
          isValid: boundCheck.isValid,
          flags: ['BENCHMARK_SERIES_RECORD'],
          completenessScore: 1.0,
          checkResults: {
            physicalLimitsPassed: boundCheck.isValid,
            rateOfChangePassed: true,
            persistencePassed: true,
          },
        },
        provenance: {
          sourceId,
          provider: `${this.name} (${this.sourceMetadata[sourceId].name})`,
          retrievalTimestamp: normalizeTimestamp(new Date()),
          forecastInitTimestamp: initTimestamp,
          validTimestamp,
          leadTimeHours: lead,
          variable: query.variable,
          unit: CANONICAL_UNITS[query.variable],
          horizontalResolutionKm: this.sourceMetadata[sourceId].resolutionKm,
          isDemonstration: true,
        },
        qcPassed: boundCheck.isValid,
        isDemonstration: true,
      });
    }

    return {
      sourceId,
      stationId: station.id,
      variable: query.variable,
      points,
      leadTimes,
      startTime: points[0]?.timestamp || normalizeTimestamp(baseDate),
      endTime: points[points.length - 1]?.timestamp || normalizeTimestamp(baseDate),
      isDemonstration: true,
    };
  }

  /**
   * Fetch synchronized multi-model snapshot across sources at a specific lead horizon
   */
  public async getSnapshot(query: SnapshotQuery): Promise<ForecastSnapshot> {
    if (query.signal?.aborted) {
      throw new DOMException('Snapshot query aborted', 'AbortError');
    }

    const { latitude, longitude } = normalizeCoordinates(query.latitude, query.longitude);
    const station = getStationById(query.stationId);
    const leadTime = query.leadTimeHours;
    const baseDate = new Date('2026-09-22T00:00:00Z');
    const validTimestamp = normalizeTimestamp(new Date(baseDate.getTime() + leadTime * 3600 * 1000));

    const pointList = await this.getForecast({
      stationId: station.id,
      latitude,
      longitude,
      variables: [query.variable],
      sourceIds: ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'],
      leadTimeHours: leadTime,
      signal: query.signal,
    });

    const sources: Record<ForecastSourceId, ForecastPoint> = {} as any;
    for (const pt of pointList) {
      sources[pt.sourceId] = pt;
    }

    // Historical ground truth is available for lead times <= 48h in benchmark dataset
    let observedTruth: Observation | undefined;
    if (leadTime <= 48) {
      const obs = await this.getObservation({
        stationId: station.id,
        latitude,
        longitude,
        variable: query.variable,
        timestamp: validTimestamp,
        signal: query.signal,
      });
      if (obs) observedTruth = obs;
    }

    return {
      stationId: station.id,
      latitude,
      longitude,
      variable: query.variable,
      leadTimeHours: leadTime,
      validTimestamp,
      sources,
      observedTruth,
      isDemonstration: true,
    };
  }

  /**
   * Fetch discrete empirical ground truth observation for a station
   */
  public async getObservation(query: ObservationQuery): Promise<Observation | null> {
    if (query.signal?.aborted) {
      throw new DOMException('Observation query aborted', 'AbortError');
    }

    const { latitude, longitude } = normalizeCoordinates(query.latitude, query.longitude);
    const station = getStationById(query.stationId);
    const targetTimestamp = query.timestamp ? normalizeTimestamp(query.timestamp) : normalizeTimestamp(new Date('2026-09-22T00:00:00Z'));

    const synth = this.generateSynthesizedObservation(station.id, query.variable, 0);
    const boundCheck = validatePhysicalBounds(query.variable, synth.observation);

    return {
      id: `OBS_SYNOP_${station.id}_${query.variable}_${targetTimestamp}`,
      stationId: station.id,
      latitude,
      longitude,
      timestamp: targetTimestamp,
      variable: query.variable,
      value: Math.round(synth.observation * 100) / 100,
      unit: CANONICAL_UNITS[query.variable],
      source: 'WMO-SYNOP Research Benchmark',
      stationElevationMeters: station.elevationMeters,
      quality: {
        isValid: boundCheck.isValid,
        flags: ['GROUND_TRUTH_BENCHMARK_STATION'],
        completenessScore: 1.0,
        checkResults: {
          physicalLimitsPassed: boundCheck.isValid,
          rateOfChangePassed: true,
          persistencePassed: true,
        },
      },
      retrievalTimestamp: normalizeTimestamp(new Date()),
      isDemonstration: true,
    };
  }

  /**
   * Fetch chronological observation history for verification windows
   */
  public async getObservationHistory(query: ObservationHistoryQuery): Promise<Observation[]> {
    if (query.signal?.aborted) {
      throw new DOMException('Observation history query aborted', 'AbortError');
    }

    const { latitude, longitude } = normalizeCoordinates(query.latitude, query.longitude);
    const station = getStationById(query.stationId);
    const start = new Date(query.startTimestamp).getTime();
    const end = new Date(query.endTimestamp).getTime();
    const stepHours = 6;
    const observations: Observation[] = [];

    for (let t = start; t <= end; t += stepHours * 3600 * 1000) {
      const stepLead = Math.max(0, Math.floor((t - start) / (3600 * 1000)));
      const synth = this.generateSynthesizedObservation(station.id, query.variable, stepLead);
      const isoTime = normalizeTimestamp(new Date(t));
      const boundCheck = validatePhysicalBounds(query.variable, synth.observation);

      observations.push({
        id: `HIST_OBS_${station.id}_${query.variable}_${isoTime}`,
        stationId: station.id,
        latitude,
        longitude,
        timestamp: isoTime,
        variable: query.variable,
        value: Math.round(synth.observation * 100) / 100,
        unit: CANONICAL_UNITS[query.variable],
        source: 'WMO-SYNOP Historic Record Archive',
        stationElevationMeters: station.elevationMeters,
        quality: {
          isValid: boundCheck.isValid,
          flags: ['HISTORICAL_SERIES_RECORD'],
          completenessScore: 1.0,
          checkResults: {
            physicalLimitsPassed: boundCheck.isValid,
            rateOfChangePassed: true,
            persistencePassed: true,
          },
        },
        retrievalTimestamp: normalizeTimestamp(new Date()),
        isDemonstration: true,
      });
    }

    return observations;
  }

  /**
   * Operational telemetry and health status
   */
  public async getHealth(): Promise<ProviderHealthStatus> {
    return {
      source: 'AGGREGATOR',
      status: 'DEMO_DATA',
      latencyMs: 1.5,
      lastSuccessfulSync: normalizeTimestamp(new Date()),
      consecutiveFailures: 0,
      dataFreshnessMinutes: 0,
      isDemonstration: true,
    };
  }

  // --- Internal Deterministic Meteorological Synthesizer ---

  private applyModelErrorProfile(
    source: ForecastSourceId,
    variable: WeatherVariable,
    lead: number,
    observationValue: number
  ): number {
    const leadFactor = Math.sqrt(lead / 24.0);

    if (source === 'ECMWF') {
      const bias = variable === 'temperature_2m' ? -0.2 : variable === 'precipitation' ? 0.3 : 0.1;
      const noise = Math.sin(lead * 1.5 + 1) * 0.4 * leadFactor;
      return observationValue + bias + noise;
    }
    if (source === 'GFS') {
      const bias = variable === 'temperature_2m' ? 0.6 : variable === 'precipitation' ? 1.2 : -0.2;
      const noise = Math.cos(lead * 1.2 + 2) * 0.8 * leadFactor;
      return observationValue + bias + noise;
    }
    if (source === 'ICON') {
      const bias = variable === 'wind_speed_10m' ? 0.7 : variable === 'relative_humidity_2m' ? -2.0 : 0.1;
      const noise = Math.sin(lead * 0.9 + 3) * 0.7 * leadFactor;
      return observationValue + bias + noise;
    }
    if (source === 'GRAPHCAST') {
      if (variable === 'precipitation' && observationValue > 10.0) {
        return observationValue * 0.72 + Math.cos(lead) * 1.5;
      }
      if (variable === 'temperature_2m') {
        return observationValue + (lead > 72 ? 0.2 : 0.5) + Math.sin(lead * 0.5) * 0.5 * leadFactor;
      }
      return observationValue + Math.cos(lead * 0.8) * 0.6 * leadFactor;
    }

    return observationValue;
  }

  private generateSynthesizedObservation(
    stationId: string,
    variable: WeatherVariable,
    leadHours: number
  ): { observation: number; regime: WeatherRegime } {
    const st = getStationById(stationId);
    let base = 25.0;
    let regime: WeatherRegime = 'Normal';

    const diurnal = Math.sin(((leadHours + 6) % 24) * (Math.PI / 12));

    if (variable === 'temperature_2m') {
      base = st.climatology.tempMean + diurnal * 4.5;
      if (base > 40.0) regime = 'Heatwave';
      if (base < 2.0) regime = 'Extreme Cold';
    } else if (variable === 'precipitation') {
      if (st.id === 'MUMBAI') {
        const isConvectiveHour = (leadHours % 24 >= 10 && leadHours % 24 <= 18);
        base = isConvectiveHour ? 48.0 + Math.sin(leadHours) * 22.0 : 4.5;
        regime = base > 35 ? 'Heavy Rainfall' : 'Normal';
      } else if (st.id === 'CHERRAPUNJI') {
        base = 72.0 + Math.cos(leadHours * 0.5) * 35.0;
        regime = 'Heavy Rainfall';
      } else {
        base = Math.max(0, Math.sin(leadHours * 0.4) * 8.0 - 4.0);
      }
    } else if (variable === 'wind_speed_10m') {
      base = st.climatology.windMeanMs + Math.sin(leadHours * 0.7) * 2.5;
      if (st.id === 'REYJAVIK' || st.id === 'CAPE_TOWN') base += 8.0;
      if (base > 17.0) regime = 'High Wind';
    } else if (variable === 'relative_humidity_2m') {
      base = 65.0 - diurnal * 18.0;
      if (st.id === 'MUMBAI' || st.id === 'SINGAPORE') base = Math.min(98, base + 22.0);
      if (st.id === 'DUBAI') base = Math.max(20, base - 35.0);
    } else if (variable === 'surface_pressure') {
      const elevationCorrection = (st.elevationMeters / 8.4);
      base = 1013.25 - elevationCorrection + Math.sin(leadHours * 0.1) * 3.5;
    }

    return {
      observation: Math.max(0, base),
      regime,
    };
  }
}
