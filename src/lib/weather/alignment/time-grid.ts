/**
 * Centralized Weather Data Architecture — Time Grid & Lead-Time Matcher
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Common valid time grid construction across multi-model providers
 * - Symmetric difference tracking: COMMON vs MISSING_FROM_SOURCE
 * - Exact lead time calculation: leadTimeHours = (validTime - initTime) / 3600000
 * - Discrete lead-time bucketing (+0h, +6h, +12h, +24h, +48h, ...)
 * - Strict guarantee: models are compared ONLY at identical lead times
 */

import {
  ForecastSourceId,
  ForecastPoint,
} from '../types';
import { normalizeTimestamp } from '../normalization';

export interface TimeGridAnalysis {
  allTimestamps: string[]; // Union of all valid timestamps (chronologically sorted)
  commonTimestamps: string[]; // Intersection: valid timestamps present in all active models
  commonLeadTimes: number[]; // Discrete lead horizons (+0h, +6h, +12h, ...)
  timestampsBySource: Record<ForecastSourceId, Set<string>>;
  missingSourcesByTimestamp: Record<string, ForecastSourceId[]>;
  pointsBySourceAndValidTime: Record<ForecastSourceId, Map<string, ForecastPoint>>;
  pointsBySourceAndLeadTime: Record<ForecastSourceId, Map<number, ForecastPoint>>;
}

export class TimeGridEngine {
  /**
   * Calculate lead time in hours between initialization and valid timestamps
   */
  public static calculateLeadTimeHours(initTime: string, validTime: string): number {
    const initMs = new Date(normalizeTimestamp(initTime)).getTime();
    const validMs = new Date(normalizeTimestamp(validTime)).getTime();

    if (isNaN(initMs) || isNaN(validMs)) {
      return 0;
    }

    return Math.max(0, Math.round((validMs - initMs) / (3600 * 1000)));
  }

  /**
   * Analyze multi-model records and construct harmonized time grids
   */
  public static buildTimeGrid(
    pointsBySource: Record<ForecastSourceId, ForecastPoint[]>,
    activeSources: ForecastSourceId[] = ['ECMWF', 'GFS', 'ICON', 'GRAPHCAST']
  ): TimeGridAnalysis {
    const timestampsBySource: Record<ForecastSourceId, Set<string>> = {} as any;
    const pointsBySourceAndValidTime: Record<ForecastSourceId, Map<string, ForecastPoint>> = {} as any;
    const pointsBySourceAndLeadTime: Record<ForecastSourceId, Map<number, ForecastPoint>> = {} as any;

    const allTimestampsSet = new Set<string>();
    const allLeadTimesSet = new Set<number>();

    for (const src of activeSources) {
      timestampsBySource[src] = new Set<string>();
      pointsBySourceAndValidTime[src] = new Map<string, ForecastPoint>();
      pointsBySourceAndLeadTime[src] = new Map<number, ForecastPoint>();

      const pts = pointsBySource[src] || [];
      for (const p of pts) {
        const isoTime = normalizeTimestamp(p.timestamp);
        timestampsBySource[src].add(isoTime);
        allTimestampsSet.add(isoTime);

        pointsBySourceAndValidTime[src].set(isoTime, p);

        // Ensure lead time is calculated accurately
        const lead = p.leadTimeHours !== undefined
          ? p.leadTimeHours
          : TimeGridEngine.calculateLeadTimeHours(p.initializationTime, p.timestamp);

        pointsBySourceAndLeadTime[src].set(lead, p);
        allLeadTimesSet.add(lead);
      }
    }

    // Sort all timestamps chronologically (UTC)
    const allTimestamps = Array.from(allTimestampsSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Identify common timestamps (intersection across all active sources with data)
    const sourcesWithData = activeSources.filter(
      (s) => (timestampsBySource[s]?.size || 0) > 0
    );

    const commonTimestamps: string[] = [];
    const missingSourcesByTimestamp: Record<string, ForecastSourceId[]> = {};

    for (const t of allTimestamps) {
      const missing: ForecastSourceId[] = [];
      for (const src of sourcesWithData) {
        if (!timestampsBySource[src].has(t)) {
          missing.push(src);
        }
      }

      missingSourcesByTimestamp[t] = missing;
      if (missing.length === 0) {
        commonTimestamps.push(t);
      }
    }

    // Identify common lead-time buckets across models
    const commonLeadTimes = Array.from(allLeadTimesSet)
      .filter((lead) => sourcesWithData.every((src) => pointsBySourceAndLeadTime[src].has(lead)))
      .sort((a, b) => a - b);

    return {
      allTimestamps,
      commonTimestamps,
      commonLeadTimes,
      timestampsBySource,
      missingSourcesByTimestamp,
      pointsBySourceAndValidTime,
      pointsBySourceAndLeadTime,
    };
  }
}
