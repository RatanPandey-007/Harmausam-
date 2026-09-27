/**
 * Forecast Event Detector
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Evaluates whether individual NWP / AI forecast sources or blended baselines
 * exceed configured extreme weather event thresholds at specific timesteps.
 *
 * Implements strict scientific neutrality:
 * - Uses identical event definitions and thresholds across all systems.
 * - Does NOT create special heuristics to artificially boost Adaptive Blend.
 */

import { StationLocation, WeatherVariable } from '../types';
import { BlendedForecastOutput } from '../blending/types';
import { ExtremeEventDefinition, DetectedForecastEvent, EvaluationMethodId } from './types';
import { EventThresholdRegistry } from './thresholdConfig';

export interface ForecastDetectionInput {
  station: StationLocation;
  def: ExtremeEventDefinition;
  validTime: string;
  leadTimeHours: number;
  forecastInitialization?: string;
  values: {
    ECMWF?: number | null;
    GFS?: number | null;
    ICON?: number | null;
    GRAPHCAST?: number | null;
    EQUAL_WEIGHT?: number | null;
    FIXED_WEIGHT?: number | null;
    ADAPTIVE_BLEND?: number | null;
  };
}

export class ForecastEventDetector {
  /**
   * Evaluates all forecast sources and baselines for threshold exceedance at a single timestep
   */
  public static detectAtStep(input: ForecastDetectionInput): DetectedForecastEvent[] {
    const { station, def, validTime, leadTimeHours, forecastInitialization, values } = input;

    const initTime =
      forecastInitialization ||
      new Date(new Date(validTime).getTime() - leadTimeHours * 3600 * 1000).toISOString();

    const methods: EvaluationMethodId[] = [
      'ECMWF',
      'GFS',
      'ICON',
      'GRAPHCAST',
      'EQUAL_WEIGHT',
      'FIXED_WEIGHT',
      'ADAPTIVE_BLEND',
    ];

    const results: DetectedForecastEvent[] = [];

    for (const m of methods) {
      const val = values[m];
      if (val === undefined || val === null || isNaN(val)) {
        continue; // Missing forecast source strictly excluded
      }

      const eventDetected = EventThresholdRegistry.isThresholdExceeded(val, def);
      const delta = def.operator === '<=' ? def.threshold - val : val - def.threshold;

      results.push({
        sourceId: m,
        forecastInitialization: initTime,
        validTime,
        leadTimeHours,
        station,
        variable: def.variable,
        value: val,
        threshold: def.threshold,
        eventType: def.eventType,
        eventDetected,
        deltaAboveThreshold: Number(delta.toFixed(2)),
      });
    }

    return results;
  }

  /**
   * Helper to detect events from a full multi-step BlendedForecastOutput trajectory
   */
  public static detectFromBlendedTrajectory(
    trajectory: BlendedForecastOutput[],
    def: ExtremeEventDefinition
  ): DetectedForecastEvent[] {
    const allDetections: DetectedForecastEvent[] = [];

    for (const step of trajectory) {
      if (step.variable !== def.variable) continue;

      const stepDetections = this.detectAtStep({
        station: step.station,
        def,
        validTime: step.timestamp,
        leadTimeHours: step.leadTimeHours,
        values: {
          ECMWF: step.individualForecasts.ECMWF,
          GFS: step.individualForecasts.GFS,
          ICON: step.individualForecasts.ICON,
          GRAPHCAST: step.individualForecasts.GRAPHCAST,
          EQUAL_WEIGHT: step.equalWeightForecast,
          FIXED_WEIGHT: step.fixedWeightForecast,
          ADAPTIVE_BLEND: step.adaptiveBlendedForecast,
        },
      });

      allDetections.push(...stepDetections);
    }

    return allDetections;
  }
}
