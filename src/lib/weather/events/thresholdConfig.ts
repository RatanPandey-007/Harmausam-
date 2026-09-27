/**
 * Extreme Event Threshold Configuration Registry
 * Harmausam Meteorological Intelligence Platform — Phase 6
 *
 * Implements centralized, configurable threshold definitions.
 * All prototype thresholds are explicitly tagged with source: "Prototype threshold",
 * ensuring complete scientific transparency and avoiding false claims of official warnings.
 */

import { ExtremeEventDefinition, ExtremeEventCategory } from './types';

export const DEFAULT_EVENT_DEFINITIONS: ExtremeEventDefinition[] = [
  {
    eventType: 'Heatwave',
    category: 'extreme_temperature_high',
    variable: 'temperature_2m',
    threshold: 38.0,
    unit: '°C',
    operator: '>=',
    minimumDurationHours: 6,
    source: 'Prototype threshold',
    description: 'Severe thermal stress with sustained daytime temperatures exceeding physiological coping limits.',
    wmoStandardReference: 'WMO-No. 1177: Maximum temperature exceeding climatological 90th percentile for >= 2 consecutive cycles.',
  },
  {
    eventType: 'Heavy rainfall',
    category: 'heavy_precipitation',
    variable: 'precipitation',
    threshold: 18.0,
    unit: 'mm/3h',
    operator: '>=',
    minimumDurationHours: 3,
    source: 'Prototype threshold',
    description: 'Intense precipitation with flash flood, surface inundation, and urban drainage overflow potential.',
    wmoStandardReference: 'WMO Guide to Meteorological Instruments and Methods of Observation: >15 mm/h or >18 mm/3h high-intensity burst.',
  },
  {
    eventType: 'High wind',
    category: 'extreme_wind',
    variable: 'wind_speed_10m',
    threshold: 17.2,
    unit: 'm/s',
    operator: '>=',
    minimumDurationHours: 3,
    source: 'Prototype threshold',
    description: 'Sustained gale-force winds capable of structural damage, fallen debris, and transport disruption.',
    wmoStandardReference: 'Beaufort Force 8 (17.2–20.7 m/s, 34–40 kt): Gale. Structural breakage, difficulty walking against wind.',
  },
  {
    eventType: 'Extreme Cold',
    category: 'extreme_temperature_low',
    variable: 'temperature_2m',
    threshold: -5.0,
    unit: '°C',
    operator: '<=',
    minimumDurationHours: 6,
    source: 'Prototype threshold',
    description: 'Severe sub-zero freeze posing hypothermia, infrastructure frost damage, and transit freezing hazards.',
    wmoStandardReference: 'WMO Guidelines on Cold Weather Warnings: Temperature falling below critical freezing thresholds.',
  },
];

export class EventThresholdRegistry {
  private static customOverrides: Map<string, Partial<ExtremeEventDefinition>> = new Map();

  /**
   * Retrieve threshold definition for a specific event type, applying any runtime overrides
   */
  public static getDefinition(eventType: string): ExtremeEventDefinition {
    const base = DEFAULT_EVENT_DEFINITIONS.find(
      d => d.eventType.toLowerCase() === eventType.toLowerCase()
    );
    if (!base) {
      // Default fallback
      return DEFAULT_EVENT_DEFINITIONS[0];
    }

    const override = this.customOverrides.get(eventType.toLowerCase());
    if (override) {
      return {
        ...base,
        ...override,
      };
    }

    return { ...base };
  }

  /**
   * Retrieve all supported event definitions
   */
  public static getAllDefinitions(): ExtremeEventDefinition[] {
    return DEFAULT_EVENT_DEFINITIONS.map(d => this.getDefinition(d.eventType));
  }

  /**
   * Register a custom threshold override (e.g. from user UI controls)
   */
  public static setCustomThreshold(eventType: string, threshold: number, minimumDurationHours?: number): void {
    const current = this.customOverrides.get(eventType.toLowerCase()) || {};
    this.customOverrides.set(eventType.toLowerCase(), {
      ...current,
      threshold,
      minimumDurationHours: minimumDurationHours ?? current.minimumDurationHours,
      source: 'User configured prototype threshold',
    });
  }

  /**
   * Reset overrides to default prototype thresholds
   */
  public static resetOverrides(): void {
    this.customOverrides.clear();
  }

  /**
   * Evaluates whether a meteorological value satisfies the event threshold condition
   */
  public static isThresholdExceeded(value: number | null | undefined, def: ExtremeEventDefinition): boolean {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      return false;
    }

    if (def.operator === '<=') {
      return value <= def.threshold;
    }
    return value >= def.threshold;
  }
}
