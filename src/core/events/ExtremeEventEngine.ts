import { 
  ExtremeEventAlert, 
  StationLocation, 
  ForecastSourceId, 
  WeatherVariable, 
  SourceWeight 
} from '../types';

export interface EventThresholdDefinition {
  eventType: ExtremeEventAlert['eventType'];
  variable: WeatherVariable;
  thresholdValue: number;
  unit: string;
  description: string;
}

export const EVENT_THRESHOLDS: EventThresholdDefinition[] = [
  {
    eventType: 'Heavy rainfall',
    variable: 'precipitation',
    thresholdValue: 18.0, // mm in 3h
    unit: 'mm/3h',
    description: 'Intense precipitation with flash flood and runoff potential'
  },
  {
    eventType: 'Heatwave',
    variable: 'temperature_2m',
    thresholdValue: 38.0, // °C
    unit: '°C',
    description: 'Severe thermal stress with sustained daytime temperatures exceeding physiological coping limits'
  },
  {
    eventType: 'High wind',
    variable: 'wind_speed_10m',
    thresholdValue: 17.2, // m/s (Gale force)
    unit: 'm/s',
    description: 'Sustained gale-force winds capable of structural and transport disruption'
  },
  {
    eventType: 'Extreme Cold',
    variable: 'temperature_2m',
    thresholdValue: -10.0, // °C
    unit: '°C',
    description: 'Severe sub-zero freeze posing hypothermia and infrastructure freezing risks'
  }
];

export class ExtremeEventEngine {
  /**
   * Scan multi-model forecasts for extreme weather conditions
   * and calculate weighted exceedance probabilities.
   */
  public static detectEvents(
    station: StationLocation,
    timestamp: string,
    forecasts: Record<WeatherVariable, Record<ForecastSourceId, number>>,
    weights: Record<WeatherVariable, Record<ForecastSourceId, SourceWeight>>,
    blendedValues: Record<WeatherVariable, number>,
    confidenceScores: Record<WeatherVariable, number>
  ): ExtremeEventAlert[] {
    const alerts: ExtremeEventAlert[] = [];

    for (const def of EVENT_THRESHOLDS) {
      const modelVals = forecasts[def.variable];
      const modelWeights = weights[def.variable];
      const blendVal = blendedValues[def.variable];
      const conf = confidenceScores[def.variable] ?? 60;

      if (!modelVals || !modelWeights || blendVal === undefined) continue;

      const sources = Object.keys(modelVals) as ForecastSourceId[];
      const exceedanceMap: Record<ForecastSourceId, boolean> = {} as Record<ForecastSourceId, boolean>;
      let exceedCount = 0;
      let weightedProbSum = 0;

      for (const src of sources) {
        const val = modelVals[src];
        let exceeds = false;
        if (def.eventType === 'Extreme Cold') {
          exceeds = val <= def.thresholdValue;
        } else {
          exceeds = val >= def.thresholdValue;
        }

        exceedanceMap[src] = exceeds;
        if (exceeds) {
          exceedCount++;
          const w = modelWeights[src]?.weight ?? (1 / sources.length);
          weightedProbSum += w;
        }
      }

      const probabilityPct = Math.round(weightedProbSum * 100);
      const agreementRatio = Number((exceedCount / sources.length).toFixed(2));

      // Trigger alert if probability > 15% or blend is close to threshold
      const isNearThreshold = def.eventType === 'Extreme Cold' 
        ? blendVal <= (def.thresholdValue + 2.0)
        : blendVal >= (def.thresholdValue * 0.85);

      if (probabilityPct >= 15 || isNearThreshold) {
        // Severity risk assignment
        let severityRisk: ExtremeEventAlert['severityRisk'] = 'Information';
        if (probabilityPct >= 70 || (blendVal >= def.thresholdValue && agreementRatio >= 0.75)) {
          severityRisk = 'High Risk';
        } else if (probabilityPct >= 45 || blendVal >= def.thresholdValue) {
          severityRisk = 'Elevated Risk';
        } else if (probabilityPct >= 20) {
          severityRisk = 'Watch';
        }

        // Time window approximation around valid timestamp
        const validTime = new Date(timestamp).getTime();
        const onsetTime = new Date(validTime - 3 * 3600 * 1000).toISOString();
        const clearTime = new Date(validTime + 9 * 3600 * 1000).toISOString();

        // Evidence features
        const evidence: string[] = [
          `Adaptive Blended Forecast: ${blendVal.toFixed(1)} ${def.unit} (Threshold: ${def.thresholdValue} ${def.unit})`,
          `Model Consensus: ${exceedCount} of ${sources.length} systems predict threshold exceedance (${Math.round(agreementRatio * 100)}% raw agreement)`,
          `Weighted Probability of Exceedance: ${probabilityPct}%`,
          `Forecast models exceeding threshold: ${sources.filter(s => exceedanceMap[s]).join(', ') || 'None individually (ensemble blend near boundary)'}`
        ];

        // Meteorological Bulletin
        const bulletin = `METEOROLOGICAL EARLY WARNING BULLETIN
Location: ${station.name}, ${station.country} (${station.latitude.toFixed(2)}°N, ${station.longitude.toFixed(2)}°E)
Event: ${def.eventType.toUpperCase()}
Risk Level: ${severityRisk.toUpperCase()}
Valid Window: ${new Date(onsetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(clearTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Blended Projection: ${blendVal.toFixed(1)} ${def.unit} vs Critical Threshold of ${def.thresholdValue} ${def.unit}.
Confidence: ${conf}% | Weighted Probability: ${probabilityPct}%.`;

        alerts.push({
          id: `ALERT_${def.eventType.replace(/\s+/g, '_')}_${station.id}_${timestamp}`,
          eventType: def.eventType,
          location: station,
          timeWindow: {
            onset: onsetTime,
            peak: timestamp,
            clear: clearTime
          },
          severityRisk,
          probabilityOfExceedance: probabilityPct,
          thresholdExceeded: {
            variable: def.variable,
            thresholdValue: def.thresholdValue,
            unit: def.unit,
            blendedForecastValue: blendVal
          },
          modelAgreementRatio: agreementRatio,
          individualExceedance: exceedanceMap,
          confidence: conf,
          evidenceFeatures: evidence,
          meteorologicalBulletin: bulletin
        });
      }
    }

    return alerts;
  }
}
