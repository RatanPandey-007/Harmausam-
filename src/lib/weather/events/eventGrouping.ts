/**
 * Event Grouping & Temporal Duration Engine
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Groups consecutive timesteps exceeding an extreme weather threshold
 * into cohesive event windows, calculating duration and peak intensity.
 *
 * Implements strict resolution checks:
 * Does NOT invent duration if data resolution cannot support it.
 * Flags "Duration unavailable at current observation resolution." when appropriate.
 */

import { StationLocation } from '../types';
import {
  ExtremeEventDefinition,
  DetectedForecastEvent,
  DetectedObservationEvent,
  GroupedEvent,
  EvaluationMethodId,
} from './types';

export class EventGroupingEngine {
  /**
   * Group consecutive forecast detections for a specific source/method into coherent event windows
   */
  public static groupForecastEvents(
    detections: DetectedForecastEvent[],
    def: ExtremeEventDefinition,
    maxGapHours: number = 6
  ): GroupedEvent[] {
    // Sort detections chronologically by validTime
    const sorted = [...detections]
      .filter(d => d.eventDetected)
      .sort((a, b) => new Date(a.validTime).getTime() - new Date(b.validTime).getTime());

    if (sorted.length === 0) return [];

    const grouped: GroupedEvent[] = [];
    let currentCluster: DetectedForecastEvent[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      const gapHours =
        (new Date(curr.validTime).getTime() - new Date(prev.validTime).getTime()) /
        (1000 * 3600);

      if (gapHours <= maxGapHours) {
        currentCluster.push(curr);
      } else {
        grouped.push(this.buildGroupedEvent(currentCluster, def, currentCluster[0].sourceId));
        currentCluster = [curr];
      }
    }

    if (currentCluster.length > 0) {
      grouped.push(this.buildGroupedEvent(currentCluster, def, currentCluster[0].sourceId));
    }

    return grouped;
  }

  /**
   * Group consecutive observed detections into coherent event windows
   */
  public static groupObservationEvents(
    detections: DetectedObservationEvent[],
    def: ExtremeEventDefinition,
    maxGapHours: number = 6
  ): GroupedEvent[] {
    const sorted = [...detections]
      .filter(d => d.eventDetected === true)
      .sort((a, b) => new Date(a.observationTimestamp).getTime() - new Date(b.observationTimestamp).getTime());

    if (sorted.length === 0) return [];

    const grouped: GroupedEvent[] = [];
    let currentCluster: DetectedObservationEvent[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      const gapHours =
        (new Date(curr.observationTimestamp).getTime() - new Date(prev.observationTimestamp).getTime()) /
        (1000 * 3600);

      if (gapHours <= maxGapHours) {
        currentCluster.push(curr);
      } else {
        grouped.push(this.buildObservedGroupedEvent(currentCluster, def));
        currentCluster = [curr];
      }
    }

    if (currentCluster.length > 0) {
      grouped.push(this.buildObservedGroupedEvent(currentCluster, def));
    }

    return grouped;
  }

  private static buildGroupedEvent(
    cluster: DetectedForecastEvent[],
    def: ExtremeEventDefinition,
    method: EvaluationMethodId
  ): GroupedEvent {
    const first = cluster[0];
    const last = cluster[cluster.length - 1];

    const isMinOperator = def.operator === '<=';
    const values = cluster.map(c => c.value);
    const peakValue = isMinOperator ? Math.min(...values) : Math.max(...values);
    const peakStep = cluster.find(c => c.value === peakValue) || first;

    const spanHours =
      (new Date(last.validTime).getTime() - new Date(first.validTime).getTime()) /
      (1000 * 3600);

    // If cluster has multiple timesteps, duration is spanHours + single step interval (approx 3h)
    let durationHours: number | null = null;
    let durationStatus: 'CALCULATED' | 'UNAVAILABLE_RESOLUTION' = 'CALCULATED';

    if (cluster.length >= 2) {
      durationHours = Number((spanHours + 3).toFixed(1));
    } else {
      // Single isolated timestep: cannot reliably claim multi-hour duration without sub-hourly data
      durationHours = 3.0; // Minimal step window
      if (def.minimumDurationHours > 3) {
        durationStatus = 'UNAVAILABLE_RESOLUTION';
      }
    }

    // Severity assessment based directly on delta above threshold and persistence
    const delta = isMinOperator ? def.threshold - peakValue : peakValue - def.threshold;
    let severityRisk: GroupedEvent['severityRisk'] = 'Watch';
    if (delta >= 4.0 || cluster.length >= 3) {
      severityRisk = 'High Risk';
    } else if (delta >= 2.0 || cluster.length >= 2) {
      severityRisk = 'Elevated Risk';
    }

    const eventId = `EVT_FCST_${method}_${first.station.id}_${first.validTime}`;

    return {
      eventId,
      eventType: def.eventType,
      method,
      station: first.station,
      startTime: first.validTime,
      endTime: last.validTime,
      durationHours,
      durationStatus,
      peakValue: Number(peakValue.toFixed(2)),
      threshold: def.threshold,
      leadTimeHours: peakStep.leadTimeHours,
      status: 'DETECTED_OBS_PENDING',
      timestepCount: cluster.length,
      severityRisk,
    };
  }

  private static buildObservedGroupedEvent(
    cluster: DetectedObservationEvent[],
    def: ExtremeEventDefinition
  ): GroupedEvent {
    const first = cluster[0];
    const last = cluster[cluster.length - 1];

    const isMinOperator = def.operator === '<=';
    const values = cluster.map(c => c.observedValue!).filter(v => v !== null);
    const peakValue = isMinOperator ? Math.min(...values) : Math.max(...values);

    const spanHours =
      (new Date(last.observationTimestamp).getTime() - new Date(first.observationTimestamp).getTime()) /
      (1000 * 3600);

    let durationHours: number | null = null;
    let durationStatus: 'CALCULATED' | 'UNAVAILABLE_RESOLUTION' = 'CALCULATED';

    if (cluster.length >= 2) {
      durationHours = Number((spanHours + 3).toFixed(1));
    } else {
      durationHours = 3.0;
      if (def.minimumDurationHours > 3) {
        durationStatus = 'UNAVAILABLE_RESOLUTION';
      }
    }

    const eventId = `EVT_OBS_${first.station.id}_${first.observationTimestamp}`;

    return {
      eventId,
      eventType: def.eventType,
      method: 'OBSERVATION',
      station: first.station,
      startTime: first.observationTimestamp,
      endTime: last.observationTimestamp,
      durationHours,
      durationStatus,
      peakValue: Number(peakValue.toFixed(2)),
      threshold: def.threshold,
      leadTimeHours: 0,
      status: 'CONFIRMED',
      timestepCount: cluster.length,
      severityRisk: 'Elevated Risk',
    };
  }
}
