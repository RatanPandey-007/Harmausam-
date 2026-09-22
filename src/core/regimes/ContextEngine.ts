import { WeatherRegime, WeatherContext, StationLocation, WeatherVariable, ForecastSourceId } from '../types';

export interface RegimeEvaluationInput {
  station: StationLocation;
  timestamp: string;
  leadTimeHours: number;
  variable: WeatherVariable;
  forecastValues: {
    temp2m?: number;
    precip3h?: number;
    wind10m?: number;
    rh2m?: number;
    pressure?: number;
  };
  modelSpread: number;
  recentSourceErrors?: Record<ForecastSourceId, number>;
}

export class ContextEngine {
  /**
   * Determine the active weather regime and generate explainable supporting signals
   */
  public static evaluateContext(input: RegimeEvaluationInput): WeatherContext {
    const { station, timestamp, leadTimeHours, variable, forecastValues, modelSpread, recentSourceErrors } = input;
    const climo = station.climatology;

    const temp = forecastValues.temp2m ?? climo.tempMean;
    const precip = forecastValues.precip3h ?? 0;
    const wind = forecastValues.wind10m ?? climo.windMeanMs;
    const rh = forecastValues.rh2m ?? 60;
    const tempAnomaly = temp - climo.tempMean;

    // Thermodynamic proxies
    // Simple convective potential indicator: high temp + high RH + rapid pressure drop
    const capeEstimate = (temp > 24 && rh > 70) ? Math.round(50 * (temp - 20) * (rh / 50)) : 150;
    const windShearProxy = Number((wind * 1.35).toFixed(1));

    const signals: WeatherContext['regimeSignals'] = [];
    let detectedRegime: WeatherRegime = 'Normal';

    // 1. Check Heavy Rainfall regime
    const isHeavyRain = precip >= 15.0; // >=15 mm in 3 hours is heavy
    signals.push({
      name: '3-Hour Precipitation Rate',
      value: `${precip.toFixed(1)} mm/3h`,
      threshold: '>= 15.0 mm/3h',
      triggered: isHeavyRain
    });

    // 2. Check Convective / Rapid Change regime
    const isConvective = (precip >= 8.0 && capeEstimate >= 1000) || (modelSpread > 4.0 && variable === 'precipitation');
    signals.push({
      name: 'Convective Instability Index (CAPE proxy)',
      value: `${capeEstimate} J/kg`,
      threshold: '>= 1000 J/kg with active precip',
      triggered: isConvective
    });

    // 3. Check Heatwave regime
    // Typically climatological mean + 2*std or > 38°C
    const heatwaveThreshold = Math.max(35.0, climo.tempMean + 2 * climo.tempStd);
    const isHeatwave = temp >= heatwaveThreshold || tempAnomaly >= 6.0;
    signals.push({
      name: 'Temperature Climatological Anomaly',
      value: `${tempAnomaly > 0 ? '+' : ''}${tempAnomaly.toFixed(1)} °C (${temp.toFixed(1)} °C actual)`,
      threshold: `>= +${(heatwaveThreshold - climo.tempMean).toFixed(1)} °C (> ${heatwaveThreshold.toFixed(1)} °C)`,
      triggered: isHeatwave
    });

    // 4. Check High Wind regime
    // WMO gale warning threshold: 17.2 m/s (~62 km/h / 34 kt)
    const isHighWind = wind >= 17.2;
    signals.push({
      name: 'Sustained 10m Wind Speed',
      value: `${wind.toFixed(1)} m/s (${(wind * 3.6).toFixed(1)} km/h)`,
      threshold: '>= 17.2 m/s (Gale threshold)',
      triggered: isHighWind
    });

    // 5. Check Extreme Cold regime
    const coldThreshold = Math.min(-5.0, climo.tempMean - 2.5 * climo.tempStd);
    const isExtremeCold = temp <= coldThreshold;
    signals.push({
      name: 'Extreme Sub-Zero Anomaly',
      value: `${temp.toFixed(1)} °C`,
      threshold: `<= ${coldThreshold.toFixed(1)} °C`,
      triggered: isExtremeCold
    });

    // Determine priority regime
    if (isConvective) {
      detectedRegime = 'Convective / Rapid Change';
    } else if (isHeavyRain) {
      detectedRegime = 'Heavy Rainfall';
    } else if (isHighWind) {
      detectedRegime = 'High Wind';
    } else if (isHeatwave) {
      detectedRegime = 'Heatwave';
    } else if (isExtremeCold) {
      detectedRegime = 'Extreme Cold';
    } else {
      detectedRegime = 'Normal';
    }

    // Determine disagreement level based on model spread
    let disagreementLevel: WeatherContext['disagreementLevel'] = 'Low';
    if (modelSpread > 6.0) disagreementLevel = 'Severe';
    else if (modelSpread > 3.5) disagreementLevel = 'High';
    else if (modelSpread > 1.8) disagreementLevel = 'Moderate';

    // Season calculation based on month
    const month = new Date(timestamp).getUTCMonth(); // 0-11
    const season = (month === 11 || month <= 1) ? 'DJF' : (month <= 4) ? 'MAM' : (month <= 7) ? 'JJA' : 'SON';

    return {
      stationId: station.id,
      timestamp,
      leadTimeHours,
      season,
      variable,
      detectedRegime,
      regimeSignals: signals,
      thermodynamicIndicators: {
        capeEstimate,
        precipIntensity3h: precip,
        tempAnomalyClimo: tempAnomaly,
        windShearProxy,
      },
      modelDisagreementSpread: Number(modelSpread.toFixed(2)),
      disagreementLevel,
      recentSourceErrors
    };
  }
}
