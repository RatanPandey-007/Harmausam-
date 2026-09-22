import { 
  ExtremeEventAlert, 
  StationLocation, 
  ForecastSourceId, 
  WeatherVariable, 
  SourceWeight,
  BlendedForecastResult,
  VerifiedDataPoint,
  WeatherRegime
} from '../types';
import { GLOBAL_STATIONS } from '../data/stations';

export interface EventThresholdDefinition {
  eventType: ExtremeEventAlert['eventType'];
  variable: WeatherVariable;
  defaultThreshold: number;
  unit: string;
  description: string;
  wmoStandardReference: string;
  selectableThresholds: { label: string; value: number }[];
}

export const EVENT_THRESHOLDS: EventThresholdDefinition[] = [
  {
    eventType: 'Heatwave',
    variable: 'temperature_2m',
    defaultThreshold: 38.0,
    unit: '°C',
    description: 'Severe thermal stress with sustained daytime temperatures exceeding physiological coping limits.',
    wmoStandardReference: 'WMO-No. 1177: Maximum temperature exceeding climatological 90th percentile for >= 2 consecutive cycles.',
    selectableThresholds: [
      { label: '35.0°C (Advisory)', value: 35.0 },
      { label: '38.0°C (Operational Severe)', value: 38.0 },
      { label: '40.0°C (Extreme Danger)', value: 40.0 },
      { label: '42.0°C (Catastrophic Thermal)', value: 42.0 }
    ]
  },
  {
    eventType: 'Heavy rainfall',
    variable: 'precipitation',
    defaultThreshold: 18.0,
    unit: 'mm/3h',
    description: 'Intense precipitation with flash flood, surface inundation, and urban drainage overflow potential.',
    wmoStandardReference: 'WMO Guide to Meteorological Instruments and Methods of Observation: >15 mm/h or >18 mm/3h high-intensity burst.',
    selectableThresholds: [
      { label: '10.0 mm/3h (Moderate Downpour)', value: 10.0 },
      { label: '18.0 mm/3h (Severe Burst)', value: 18.0 },
      { label: '25.0 mm/3h (Torrential Inundation)', value: 25.0 },
      { label: '35.0 mm/3h (Catastrophic Convective)', value: 35.0 }
    ]
  },
  {
    eventType: 'High wind',
    variable: 'wind_speed_10m',
    defaultThreshold: 17.2,
    unit: 'm/s',
    description: 'Sustained gale-force winds capable of structural damage, fallen debris, and transport disruption.',
    wmoStandardReference: 'Beaufort Force 8 (17.2–20.7 m/s, 34–40 kt): Gale. Structural breakage, difficulty walking against wind.',
    selectableThresholds: [
      { label: '13.9 m/s (Near Gale - Bft 7)', value: 13.9 },
      { label: '17.2 m/s (Gale Force - Bft 8)', value: 17.2 },
      { label: '20.8 m/s (Strong Gale - Bft 9)', value: 20.8 },
      { label: '24.5 m/s (Storm - Bft 10)', value: 24.5 }
    ]
  },
  {
    eventType: 'Extreme Cold',
    variable: 'temperature_2m',
    defaultThreshold: -5.0,
    unit: '°C',
    description: 'Severe sub-zero freeze posing hypothermia, infrastructure frost damage, and transit freezing hazards.',
    wmoStandardReference: 'WMO Guidelines on Cold Weather Warnings: Temperature falling below critical freezing thresholds.',
    selectableThresholds: [
      { label: '0.0°C (Freezing Point)', value: 0.0 },
      { label: '-5.0°C (Severe Frost)', value: -5.0 },
      { label: '-10.0°C (Deep Freeze)', value: -10.0 },
      { label: '-15.0°C (Extreme Cryospheric Risk)', value: -15.0 }
    ]
  }
];

export interface HistoricalEventCase {
  id: string;
  timestamp: string;
  leadTimeHours: number;
  stationName: string;
  predictedValue: number;
  observedValue: number;
  threshold: number;
  classification: 'TRUE_POSITIVE' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE' | 'TRUE_NEGATIVE';
  consensusCount: number; // e.g. 3 of 4
  adaptiveBlendValue: number;
  equalWeightValue: number;
  ecmwfValue: number;
  gfsValue: number;
  iconValue: number;
  graphcastValue: number;
  regime: WeatherRegime;
}

export interface EventVerificationResult {
  eventType: string;
  variable: WeatherVariable;
  threshold: number;
  durationPeriods: number;
  sampleCount: number;
  tp: number; // Hits
  fp: number; // False alarms
  fn: number; // Misses
  tn: number; // Correct rejections
  precision: number;
  recall: number; // POD
  f1: number;
  csi: number; // Threat score
  byLeadTime: {
    leadTimeHours: number;
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    precision: number;
    recall: number;
    f1: number;
  }[];
  byRegime: {
    regime: WeatherRegime;
    sampleCount: number;
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    precision: number;
    recall: number;
    f1: number;
  }[];
  cases: HistoricalEventCase[];
}

export interface NetworkStationEventStatus {
  station: StationLocation;
  hasEvent: boolean;
  status: 'MONITOR' | 'DEVELOPING' | 'DETECTED' | 'CONFIRMED' | 'ENDED';
  severityRisk: ExtremeEventAlert['severityRisk'];
  eventType: ExtremeEventAlert['eventType'];
  peakValue: number;
  thresholdValue: number;
  leadTimeHours: number;
  consensusCount: number;
  agreementRatio: number;
  spread: number;
}

export class ExtremeEventEngine {
  /**
   * Scan multi-model forecasts for extreme weather conditions
   * and calculate weighted exceedance probabilities and consensus.
   */
  public static detectEvents(
    station: StationLocation,
    timestamp: string,
    forecasts: Record<WeatherVariable, Record<ForecastSourceId, number>>,
    weights: Record<WeatherVariable, Record<ForecastSourceId, SourceWeight>>,
    blendedValues: Record<WeatherVariable, number>,
    confidenceScores: Record<WeatherVariable, number>,
    customThresholds?: Partial<Record<ExtremeEventAlert['eventType'], number>>
  ): ExtremeEventAlert[] {
    const alerts: ExtremeEventAlert[] = [];

    for (const def of EVENT_THRESHOLDS) {
      const activeThreshold = customThresholds?.[def.eventType] ?? def.defaultThreshold;
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
          exceeds = val <= activeThreshold;
        } else {
          exceeds = val >= activeThreshold;
        }

        exceedanceMap[src] = exceeds;
        if (exceeds) {
          exceedCount++;
          const w = modelWeights[src]?.weight ?? (1 / sources.length);
          weightedProbSum += w;
        }
      }

      // Calculate model spread
      const valsArray = Object.values(modelVals);
      const mean = valsArray.reduce((a, b) => a + b, 0) / valsArray.length;
      const variance = valsArray.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (valsArray.length - 1 || 1);
      const spread = Math.sqrt(variance);

      const probabilityPct = Math.round(weightedProbSum * 100);
      const agreementRatio = Number((exceedCount / sources.length).toFixed(2));

      // Trigger threshold criteria
      const isNearThreshold = def.eventType === 'Extreme Cold' 
        ? blendVal <= (activeThreshold + 2.0)
        : blendVal >= (activeThreshold * 0.85);

      if (probabilityPct >= 15 || isNearThreshold) {
        // Severity risk assignment based on mathematically explicit criteria
        let severityRisk: ExtremeEventAlert['severityRisk'] = 'Information';
        let alertStatus: 'MONITOR' | 'DEVELOPING' | 'DETECTED' | 'CONFIRMED' | 'ENDED' = 'MONITOR';

        if (probabilityPct >= 70 || (blendVal >= activeThreshold && agreementRatio >= 0.75)) {
          severityRisk = 'High Risk';
          alertStatus = 'DETECTED';
        } else if (probabilityPct >= 40 || blendVal >= activeThreshold) {
          severityRisk = 'Elevated Risk';
          alertStatus = 'DEVELOPING';
        } else if (probabilityPct >= 20 || isNearThreshold) {
          severityRisk = 'Watch';
          alertStatus = 'MONITOR';
        }

        // Time window approximation around valid timestamp
        const validTime = new Date(timestamp).getTime();
        const onsetTime = new Date(validTime - 3 * 3600 * 1000).toISOString();
        const clearTime = new Date(validTime + 9 * 3600 * 1000).toISOString();

        // Evidence features (strictly factual, zero hype)
        const evidence: string[] = [
          `Adaptive Blended Forecast: ${blendVal.toFixed(1)} ${def.unit} (Threshold: ${activeThreshold.toFixed(1)} ${def.unit})`,
          `Multi-Source Consensus: ${exceedCount} of ${sources.length} systems predict threshold exceedance (${Math.round(agreementRatio * 100)}% agreement)`,
          `Forecast Spread (Dispersion): ±${spread.toFixed(1)} ${def.unit}`,
          `Systems exceeding threshold: ${sources.filter(s => exceedanceMap[s]).join(', ') || 'None individually (blended ensemble near boundary)'}`
        ];

        // Meteorological Bulletin
        const bulletin = `METEOROLOGICAL EVENT CANDIDATE REPORT
Location: ${station.name}, ${station.country} (${station.latitude.toFixed(2)}°N, ${station.longitude.toFixed(2)}°E)
Parameter: ${def.eventType.toUpperCase()} (${def.variable})
Operational Risk Level: ${severityRisk.toUpperCase()}
Status: ${alertStatus}
Valid Window: ${new Date(onsetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(clearTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Blended Projection: ${blendVal.toFixed(1)} ${def.unit} vs Critical Threshold of ${activeThreshold.toFixed(1)} ${def.unit} (Delta: ${(blendVal - activeThreshold).toFixed(1)} ${def.unit})
Multi-Model Agreement: ${exceedCount}/${sources.length} sources exceed threshold | Model Spread: ±${spread.toFixed(1)} ${def.unit}.`;

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
            thresholdValue: activeThreshold,
            unit: def.unit,
            blendedForecastValue: blendVal
          },
          modelAgreementRatio: agreementRatio,
          individualExceedance: exceedanceMap,
          confidence: conf,
          evidenceFeatures: evidence,
          meteorologicalBulletin: bulletin,
          status: alertStatus,
          modelSpread: spread,
          durationPeriods: 1
        });
      }
    }

    return alerts;
  }

  /**
   * Evaluate time-series trajectory for multi-step persistent events.
   * Checks whether abnormal conditions persist for N consecutive forecast periods.
   */
  public static evaluateTrajectoryEvents(
    trajectory: BlendedForecastResult[],
    eventType: ExtremeEventAlert['eventType'],
    threshold: number,
    minDurationPeriods: number = 1
  ): {
    hasEvent: boolean;
    status: 'MONITOR' | 'DEVELOPING' | 'DETECTED' | 'CONFIRMED' | 'ENDED';
    severityRisk: ExtremeEventAlert['severityRisk'];
    peakLeadTimeHours: number;
    peakValue: number;
    durationExceededCount: number;
    timeline: {
      leadTimeHours: number;
      timestamp: string;
      value: number;
      exceeds: boolean;
      stage: 'Developing' | 'Peak' | 'Ending' | 'Sub-threshold';
      observation?: number;
    }[];
  } {
    const isCold = eventType === 'Extreme Cold';
    let maxVal = isCold ? Infinity : -Infinity;
    let peakLead = 0;
    let consecutiveCount = 0;
    let maxConsecutive = 0;
    let totalExceedCount = 0;

    const timeline: {
      leadTimeHours: number;
      timestamp: string;
      value: number;
      exceeds: boolean;
      stage: 'Developing' | 'Peak' | 'Ending' | 'Sub-threshold';
      observation?: number;
    }[] = trajectory.map((step) => {
      const val = step.adaptiveBlendedForecast;
      const exceeds = isCold ? val <= threshold : val >= threshold;

      if (exceeds) {
        totalExceedCount++;
        consecutiveCount++;
        if (consecutiveCount > maxConsecutive) {
          maxConsecutive = consecutiveCount;
        }
      } else {
        consecutiveCount = 0;
      }

      const isCurrentPeak = isCold ? val < maxVal : val > maxVal;
      if (isCurrentPeak) {
        maxVal = val;
        peakLead = step.leadTimeHours;
      }

      return {
        leadTimeHours: step.leadTimeHours,
        timestamp: step.timestamp,
        value: val,
        exceeds,
        stage: 'Sub-threshold',
        observation: step.observationValue
      };
    });

    // Tag stages (Developing, Peak, Ending)
    for (const t of timeline) {
      if (t.exceeds) {
        if (t.leadTimeHours === peakLead) {
          t.stage = 'Peak';
        } else if (t.leadTimeHours < peakLead) {
          t.stage = 'Developing';
        } else {
          t.stage = 'Ending';
        }
      }
    }

    const durationSatisfied = maxConsecutive >= minDurationPeriods || (minDurationPeriods === 1 && totalExceedCount >= 1);
    const hasEvent = durationSatisfied;

    let severityRisk: ExtremeEventAlert['severityRisk'] = 'Information';
    let status: 'MONITOR' | 'DEVELOPING' | 'DETECTED' | 'CONFIRMED' | 'ENDED' = 'MONITOR';

    if (hasEvent) {
      if (maxConsecutive >= 3 || (isCold ? maxVal <= threshold - 3 : maxVal >= threshold + 3)) {
        severityRisk = 'High Risk';
        status = 'DETECTED';
      } else if (maxConsecutive >= 2 || (isCold ? maxVal <= threshold : maxVal >= threshold)) {
        severityRisk = 'Elevated Risk';
        status = 'DEVELOPING';
      } else {
        severityRisk = 'Watch';
        status = 'MONITOR';
      }

      // If peak has an observation recorded and it also exceeded, mark as CONFIRMED
      const peakStep = timeline.find(t => t.leadTimeHours === peakLead);
      if (peakStep?.observation !== undefined) {
        const obsExceeds = isCold ? peakStep.observation <= threshold : peakStep.observation >= threshold;
        if (obsExceeds) {
          status = 'CONFIRMED';
        } else {
          status = 'ENDED'; // Observation confirmed it was a false signal or has passed
        }
      }
    }

    return {
      hasEvent,
      status,
      severityRisk,
      peakLeadTimeHours: peakLead,
      peakValue: maxVal === Infinity || maxVal === -Infinity ? 0 : maxVal,
      durationExceededCount: maxConsecutive,
      timeline
    };
  }

  /**
   * Run full rigorous event verification against verified historical data points.
   * Compares predicted vs observed exceedance across all points, lead times, and regimes.
   */
  public static evaluateHistoricalEvents(
    dataPoints: VerifiedDataPoint[],
    eventType: ExtremeEventAlert['eventType'],
    threshold: number,
    durationPeriods: number = 1
  ): EventVerificationResult {
    const isCold = eventType === 'Extreme Cold';
    const def = EVENT_THRESHOLDS.find(d => d.eventType === eventType) || EVENT_THRESHOLDS[0];
    
    let tp = 0; // True Positive (Hit)
    let fp = 0; // False Positive (False Alarm)
    let fn = 0; // False Negative (Miss)
    let tn = 0; // True Negative (Correct Rejection)

    const cases: HistoricalEventCase[] = [];

    // Group points by lead time and by regime
    const leadTimeBuckets: Record<number, { tp: number; fp: number; fn: number; tn: number }> = {};
    const regimeBuckets: Record<WeatherRegime, { count: number; tp: number; fp: number; fn: number; tn: number }> = {} as any;

    for (const pt of dataPoints) {
      const predVal = pt.adaptiveBlend;
      const obsVal = pt.observation;

      const predExceeds = isCold ? predVal <= threshold : predVal >= threshold;
      const obsExceeds = isCold ? obsVal <= threshold : obsVal >= threshold;

      // Count individual models exceeding threshold
      let consensus = 0;
      if (isCold ? pt.ecmwf <= threshold : pt.ecmwf >= threshold) consensus++;
      if (isCold ? pt.gfs <= threshold : pt.gfs >= threshold) consensus++;
      if (isCold ? pt.icon <= threshold : pt.icon >= threshold) consensus++;
      if (isCold ? pt.graphcast <= threshold : pt.graphcast >= threshold) consensus++;

      let classification: HistoricalEventCase['classification'];

      if (predExceeds && obsExceeds) {
        tp++;
        classification = 'TRUE_POSITIVE';
      } else if (predExceeds && !obsExceeds) {
        fp++;
        classification = 'FALSE_POSITIVE';
      } else if (!predExceeds && obsExceeds) {
        fn++;
        classification = 'FALSE_NEGATIVE';
      } else {
        tn++;
        classification = 'TRUE_NEGATIVE';
      }

      // Record significant cases (where either pred or obs exceeded)
      if (predExceeds || obsExceeds) {
        cases.push({
          id: `CASE_${pt.leadTimeHours}h_${pt.timestamp}`,
          timestamp: pt.timestamp,
          leadTimeHours: pt.leadTimeHours,
          stationName: 'WMO Station Reference',
          predictedValue: predVal,
          observedValue: obsVal,
          threshold,
          classification,
          consensusCount: consensus,
          adaptiveBlendValue: pt.adaptiveBlend,
          equalWeightValue: pt.equalWeight,
          ecmwfValue: pt.ecmwf,
          gfsValue: pt.gfs,
          iconValue: pt.icon,
          graphcastValue: pt.graphcast,
          regime: pt.regime
        });
      }

      // Lead time tally
      if (!leadTimeBuckets[pt.leadTimeHours]) {
        leadTimeBuckets[pt.leadTimeHours] = { tp: 0, fp: 0, fn: 0, tn: 0 };
      }
      if (classification === 'TRUE_POSITIVE') leadTimeBuckets[pt.leadTimeHours].tp++;
      if (classification === 'FALSE_POSITIVE') leadTimeBuckets[pt.leadTimeHours].fp++;
      if (classification === 'FALSE_NEGATIVE') leadTimeBuckets[pt.leadTimeHours].fn++;
      if (classification === 'TRUE_NEGATIVE') leadTimeBuckets[pt.leadTimeHours].tn++;

      // Regime tally
      if (!regimeBuckets[pt.regime]) {
        regimeBuckets[pt.regime] = { count: 0, tp: 0, fp: 0, fn: 0, tn: 0 };
      }
      regimeBuckets[pt.regime].count++;
      if (classification === 'TRUE_POSITIVE') regimeBuckets[pt.regime].tp++;
      if (classification === 'FALSE_POSITIVE') regimeBuckets[pt.regime].fp++;
      if (classification === 'FALSE_NEGATIVE') regimeBuckets[pt.regime].fn++;
      if (classification === 'TRUE_NEGATIVE') regimeBuckets[pt.regime].tn++;
    }

    // Calculate core metrics with zero-division safety
    const precision = (tp + fp) > 0 ? Number((tp / (tp + fp)).toFixed(3)) : 0.0;
    const recall = (tp + fn) > 0 ? Number((tp / (tp + fn)).toFixed(3)) : 0.0;
    const f1 = (precision + recall) > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(3)) : 0.0;
    const csi = (tp + fp + fn) > 0 ? Number((tp / (tp + fp + fn)).toFixed(3)) : 0.0;

    const byLeadTime = Object.entries(leadTimeBuckets).map(([ltStr, counts]) => {
      const lt = parseInt(ltStr, 10);
      const p = (counts.tp + counts.fp) > 0 ? Number((counts.tp / (counts.tp + counts.fp)).toFixed(3)) : 0.0;
      const r = (counts.tp + counts.fn) > 0 ? Number((counts.tp / (counts.tp + counts.fn)).toFixed(3)) : 0.0;
      const f = (p + r) > 0 ? Number(((2 * p * r) / (p + r)).toFixed(3)) : 0.0;
      return {
        leadTimeHours: lt,
        tp: counts.tp,
        fp: counts.fp,
        fn: counts.fn,
        tn: counts.tn,
        precision: p,
        recall: r,
        f1: f
      };
    }).sort((a, b) => a.leadTimeHours - b.leadTimeHours);

    const byRegime = Object.entries(regimeBuckets).map(([regimeStr, counts]) => {
      const reg = regimeStr as WeatherRegime;
      const p = (counts.tp + counts.fp) > 0 ? Number((counts.tp / (counts.tp + counts.fp)).toFixed(3)) : 0.0;
      const r = (counts.tp + counts.fn) > 0 ? Number((counts.tp / (counts.tp + counts.fn)).toFixed(3)) : 0.0;
      const f = (p + r) > 0 ? Number(((2 * p * r) / (p + r)).toFixed(3)) : 0.0;
      return {
        regime: reg,
        sampleCount: counts.count,
        tp: counts.tp,
        fp: counts.fp,
        fn: counts.fn,
        tn: counts.tn,
        precision: p,
        recall: r,
        f1: f
      };
    });

    return {
      eventType,
      variable: def.variable,
      threshold,
      durationPeriods,
      sampleCount: dataPoints.length,
      tp,
      fp,
      fn,
      tn,
      precision,
      recall,
      f1,
      csi,
      byLeadTime,
      byRegime,
      cases: cases.slice(0, 30) // Clean top 30 chronological cases
    };
  }

  /**
   * Scan network stations to evaluate active hazard status across all stations.
   * Used for populating the geospatial meteorological event map.
   */
  public static scanNetworkStations(
    eventType: ExtremeEventAlert['eventType'],
    activeThreshold: number
  ): NetworkStationEventStatus[] {
    const isCold = eventType === 'Extreme Cold';
    const def = EVENT_THRESHOLDS.find(d => d.eventType === eventType) || EVENT_THRESHOLDS[0];

    return GLOBAL_STATIONS.map((station) => {
      // Station climatology-informed projections for demo/benchmark environment
      let baseVal = 20.0;
      if (def.variable === 'temperature_2m') {
        baseVal = station.climatology.tempMean;
        if (station.id === 'VIDP') baseVal = 39.4; // New Delhi hot spell
        if (station.id === 'EGLL') baseVal = 18.2;
        if (station.id === 'KJFK') baseVal = 23.5;
        if (station.id === 'LSZH') baseVal = isCold ? -6.2 : 14.1; // Zurich frost risk
      } else if (def.variable === 'precipitation') {
        baseVal = 2.0;
        if (station.id === 'RJTT') baseVal = 22.4; // Tokyo maritime convective rain
        if (station.id === 'VIDP') baseVal = 12.0;
      } else if (def.variable === 'wind_speed_10m') {
        baseVal = station.climatology.windMeanMs * 1.5;
        if (station.id === 'EGLL') baseVal = 19.1; // London gale burst
        if (station.id === 'KJFK') baseVal = 15.4;
      }

      const exceeds = isCold ? baseVal <= activeThreshold : baseVal >= activeThreshold;
      const spread = Number((1.2 + (Math.abs(baseVal - activeThreshold) * 0.1)).toFixed(1));
      
      let consensus = 1;
      if (exceeds) {
        consensus = Math.min(4, Math.max(2, Math.round(2.5 + Math.random())));
      }

      let severity: ExtremeEventAlert['severityRisk'] = 'Information';
      let status: NetworkStationEventStatus['status'] = 'MONITOR';

      if (exceeds && consensus >= 3) {
        severity = 'High Risk';
        status = 'DETECTED';
      } else if (exceeds) {
        severity = 'Elevated Risk';
        status = 'DEVELOPING';
      } else if (isCold ? baseVal <= activeThreshold + 2.0 : baseVal >= activeThreshold * 0.88) {
        severity = 'Watch';
        status = 'MONITOR';
      }

      return {
        station,
        hasEvent: exceeds,
        status,
        severityRisk: severity,
        eventType,
        peakValue: baseVal,
        thresholdValue: activeThreshold,
        leadTimeHours: 48,
        consensusCount: consensus,
        agreementRatio: Number((consensus / 4).toFixed(2)),
        spread
      };
    });
  }
}
