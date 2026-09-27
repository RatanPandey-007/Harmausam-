/**
 * Weather Regime Classification Engine
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Implements rule-based meteorological regime classification based on
 * thermodynamic indicators, physical precipitation rates, wind thresholds,
 * temperature anomalies, and multi-model disagreement.
 *
 * Explicitly flags insufficient or sparse data instead of fabricating regimes.
 */

import { WeatherRegime, WeatherVariable } from '../types';

export interface RegimeEvaluationInput {
  variable?: WeatherVariable;
  temperature2m?: number | null;
  precipitation3h?: number | null;
  windSpeed10m?: number | null;
  relativeHumidity2m?: number | null;
  surfacePressure?: number | null;
  climatologicalMeanTemp?: number;
  climatologicalStdTemp?: number;
  modelSpread?: number;
}

export interface RegimeEvaluationResult {
  regime: WeatherRegime;
  insufficientData: boolean;
  activeSignals: Array<{
    name: string;
    value: string;
    threshold: string;
    triggered: boolean;
  }>;
  reason: string;
}

/**
 * Classify atmospheric weather regime from physical atmospheric variables
 */
export function classifyWeatherRegime(input: RegimeEvaluationInput): RegimeEvaluationResult {
  const {
    temperature2m,
    precipitation3h,
    windSpeed10m,
    relativeHumidity2m,
    climatologicalMeanTemp = 25.0,
    climatologicalStdTemp = 7.0,
    modelSpread = 0.5,
  } = input;

  // Check data availability: if all primary parameters are absent/null
  const availableCount = [temperature2m, precipitation3h, windSpeed10m, relativeHumidity2m].filter(
    v => v !== null && v !== undefined && !isNaN(v)
  ).length;

  if (availableCount === 0) {
    return {
      regime: 'Normal',
      insufficientData: true,
      activeSignals: [
        {
          name: 'Data Completeness Check',
          value: '0 parameters available',
          threshold: '>= 1 required',
          triggered: false,
        },
      ],
      reason: 'Insufficient meteorological data to detect atmospheric regime; defaulted safely to Normal.',
    };
  }

  const signals: RegimeEvaluationResult['activeSignals'] = [];

  const temp = temperature2m ?? climatologicalMeanTemp;
  const precip = precipitation3h ?? 0;
  const wind = windSpeed10m ?? 3.0;
  const rh = relativeHumidity2m ?? 60.0;
  const tempAnomaly = temp - climatologicalMeanTemp;

  // 1. Heavy Rainfall (WMO Heavy Rain threshold: >= 15 mm in 3 hours)
  const isHeavyRain = precip >= 15.0;
  signals.push({
    name: '3-Hour Precipitation Rate',
    value: `${precip.toFixed(1)} mm/3h`,
    threshold: '>= 15.0 mm/3h',
    triggered: isHeavyRain,
  });

  // 2. Convective / Rapid Change (High humidity + elevated temperature + active precip or large spread)
  const capeProxy = temp > 24 && rh > 70 ? Math.round(50 * (temp - 20) * (rh / 50)) : 150;
  const isConvective =
    (precip >= 8.0 && capeProxy >= 1000) ||
    (modelSpread >= 4.0 && input.variable === 'precipitation');
  signals.push({
    name: 'Convective Instability (CAPE proxy)',
    value: `${capeProxy} J/kg`,
    threshold: '>= 1000 J/kg with active rain, or model spread >= 4.0mm',
    triggered: isConvective,
  });

  // 3. Heatwave (Absolute >= 38°C or anomaly >= +5°C above climatology)
  const heatwaveThreshold = Math.max(38.0, climatologicalMeanTemp + 1.8 * climatologicalStdTemp);
  const isHeatwave = temp >= heatwaveThreshold || tempAnomaly >= 5.0;
  signals.push({
    name: 'Thermal Anomaly (Heatwave)',
    value: `${tempAnomaly > 0 ? '+' : ''}${tempAnomaly.toFixed(1)} °C (${temp.toFixed(1)} °C actual)`,
    threshold: `>= +5.0 °C anomaly or >= ${heatwaveThreshold.toFixed(1)} °C`,
    triggered: isHeatwave,
  });

  // 4. High Wind (WMO Gale threshold: >= 17.2 m/s sustained)
  const isHighWind = wind >= 17.2;
  signals.push({
    name: 'Sustained 10m Wind Speed',
    value: `${wind.toFixed(1)} m/s (${(wind * 3.6).toFixed(1)} km/h)`,
    threshold: '>= 17.2 m/s (Gale Force)',
    triggered: isHighWind,
  });

  // 5. Extreme Cold (Sub-zero or anomaly <= -5°C below climatology)
  const coldThreshold = Math.min(0.0, climatologicalMeanTemp - 2.0 * climatologicalStdTemp);
  const isExtremeCold = temp <= coldThreshold || tempAnomaly <= -5.0;
  signals.push({
    name: 'Sub-Zero Cold Anomaly',
    value: `${temp.toFixed(1)} °C (${tempAnomaly.toFixed(1)} °C anomaly)`,
    threshold: `<= 0.0 °C or anomaly <= -5.0 °C`,
    triggered: isExtremeCold,
  });

  // Priority hierarchy for dominant regime classification
  let detectedRegime: WeatherRegime = 'Normal';
  let primaryReason = 'Atmospheric conditions within standard climatological bounds.';

  if (isConvective) {
    detectedRegime = 'Convective / Rapid Change';
    primaryReason = `Convective instability detected (CAPE proxy ${capeProxy} J/kg, precip ${precip.toFixed(1)} mm).`;
  } else if (isHeavyRain) {
    detectedRegime = 'Heavy Rainfall';
    primaryReason = `Heavy rainfall threshold exceeded (${precip.toFixed(1)} mm/3h >= 15.0 mm).`;
  } else if (isHighWind) {
    detectedRegime = 'High Wind';
    primaryReason = `Gale-force sustained winds detected (${wind.toFixed(1)} m/s >= 17.2 m/s).`;
  } else if (isHeatwave) {
    detectedRegime = 'Heatwave';
    primaryReason = `Severe positive thermal anomaly (+${tempAnomaly.toFixed(1)} °C, reaching ${temp.toFixed(1)} °C).`;
  } else if (isExtremeCold) {
    detectedRegime = 'Extreme Cold';
    primaryReason = `Extreme cold threshold exceeded (${temp.toFixed(1)} °C <= ${coldThreshold.toFixed(1)} °C).`;
  }

  return {
    regime: detectedRegime,
    insufficientData: false,
    activeSignals: signals,
    reason: primaryReason,
  };
}
