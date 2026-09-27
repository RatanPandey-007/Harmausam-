/**
 * Event Matching & Contingency Classification Engine
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Implements spatiotemporal matching between forecast events and observed events.
 * Classifies each pairing into:
 * - TRUE POSITIVE: Forecast event detected AND matching observed event occurred.
 * - FALSE POSITIVE: Forecast event detected BUT observed event did not occur.
 * - FALSE NEGATIVE: Observed event occurred BUT forecast did not detect it.
 * - TRUE NEGATIVE: Neither forecast nor observed event occurred.
 */

import { StationLocation } from '../types';
import {
  MatchedEventPair,
  ContingencyClassification,
  EvaluationMethodId,
} from './types';

export interface TimestepEvaluationPoint {
  station: StationLocation;
  validTime: string; // ISO-8601 UTC
  leadTimeHours: number;
  eventType: string;
  method: EvaluationMethodId;
  forecastValue: number | null;
  observedValue: number | null;
  threshold: number;
  forecastExceeded: boolean;
  observedExceeded: boolean | null; // null if observation is missing
}

export class EventMatchingEngine {
  /**
   * Matches a forecast evaluation against ground observation at a discrete timestep
   */
  public static classifyTimestep(point: TimestepEvaluationPoint): MatchedEventPair {
    const {
      station,
      validTime,
      leadTimeHours,
      eventType,
      method,
      forecastValue,
      observedValue,
      threshold,
      forecastExceeded,
      observedExceeded,
    } = point;

    const forecastEventId = `FCST_${method}_${station.id}_${validTime}`;

    // If observation is unavailable, cannot classify contingency; flag explicitly
    if (observedExceeded === null || observedValue === null) {
      return {
        forecastEventId,
        observedEventId: null,
        forecastMethod: method,
        station,
        eventType,
        leadTimeHours,
        validTime,
        predictedValue: forecastValue ?? 0,
        observedValue: null,
        threshold,
        matchStatus: 'UNMATCHED',
        timeDifferenceHours: null,
        classification: forecastExceeded ? 'FALSE_POSITIVE' : 'TRUE_NEGATIVE', // Default unverified
        observationAvailable: false,
      };
    }

    const observedEventId = `OBS_${station.id}_${validTime}`;
    let classification: ContingencyClassification;
    let matchStatus: 'MATCHED' | 'UNMATCHED' = 'UNMATCHED';

    if (forecastExceeded && observedExceeded) {
      classification = 'TRUE_POSITIVE';
      matchStatus = 'MATCHED';
    } else if (forecastExceeded && !observedExceeded) {
      classification = 'FALSE_POSITIVE';
      matchStatus = 'UNMATCHED';
    } else if (!forecastExceeded && observedExceeded) {
      classification = 'FALSE_NEGATIVE';
      matchStatus = 'UNMATCHED';
    } else {
      classification = 'TRUE_NEGATIVE';
      matchStatus = 'MATCHED';
    }

    return {
      forecastEventId,
      observedEventId,
      forecastMethod: method,
      station,
      eventType,
      leadTimeHours,
      validTime,
      predictedValue: forecastValue ?? 0,
      observedValue,
      threshold,
      matchStatus,
      timeDifferenceHours: 0,
      classification,
      observationAvailable: true,
    };
  }

  /**
   * Evaluates an entire collection of synchronized forecast/observation timesteps
   */
  public static evaluateDataset(points: TimestepEvaluationPoint[]): MatchedEventPair[] {
    return points.map(pt => this.classifyTimestep(pt));
  }
}
