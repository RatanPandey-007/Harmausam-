/**
 * Observation Event Detector
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Evaluates whether genuine empirical ground observations exceed extreme event thresholds.
 *
 * Strict Rule: Never uses forecast or model-substituted values as observations.
 * When observations are unavailable, strictly returns verificationStatus: 'UNAVAILABLE'
 * and "Observed event verification unavailable."
 */

import { StationLocation, WeatherVariable, Observation } from '../types';
import { ExtremeEventDefinition, DetectedObservationEvent } from './types';
import { EventThresholdRegistry } from './thresholdConfig';

export interface ObservationDetectionInput {
  station: StationLocation;
  def: ExtremeEventDefinition;
  timestamp: string;
  observedValue: number | null | undefined;
  observationSource?: string;
}

export class ObservationEventDetector {
  /**
   * Detects whether an extreme event occurred in genuine ground truth data
   */
  public static detect(input: ObservationDetectionInput): DetectedObservationEvent {
    const { station, def, timestamp, observedValue, observationSource = 'Ground Station Observation' } = input;

    // Strict handling of missing ground observations: never substitute model or synthetic data
    if (
      observedValue === null ||
      observedValue === undefined ||
      isNaN(observedValue) ||
      !isFinite(observedValue)
    ) {
      return {
        observationTimestamp: timestamp,
        station,
        variable: def.variable,
        observedValue: null,
        threshold: def.threshold,
        eventType: def.eventType,
        eventDetected: null,
        observationSource,
        verificationStatus: 'UNAVAILABLE',
        unavailabilityReason: 'Observed event verification unavailable.',
      };
    }

    const eventDetected = EventThresholdRegistry.isThresholdExceeded(observedValue, def);

    return {
      observationTimestamp: timestamp,
      station,
      variable: def.variable,
      observedValue,
      threshold: def.threshold,
      eventType: def.eventType,
      eventDetected,
      observationSource,
      verificationStatus: 'AVAILABLE',
    };
  }

  /**
   * Helper to detect observed events from an array of Observation records
   */
  public static detectFromObservations(
    observations: Observation[],
    station: StationLocation,
    def: ExtremeEventDefinition
  ): DetectedObservationEvent[] {
    return observations
      .filter(obs => obs.variable === def.variable)
      .map(obs =>
        this.detect({
          station,
          def,
          timestamp: obs.timestamp,
          observedValue: obs.value,
          observationSource: obs.source || 'Ground Weather Station',
        })
      );
  }
}
