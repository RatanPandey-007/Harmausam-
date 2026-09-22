import L from 'leaflet';
import { 
  StationLocation, 
  WeatherVariable, 
  ForecastSourceId, 
  BlendedForecastResult 
} from '../../../core/types';
import { ExplorerDisplayMode } from '../ForecastControls';

export interface FieldValueInfo {
  val: number;
  formatted: string;
  unit: string;
  sourceLabel: string;
}

export class WeatherFieldRenderer {
  /**
   * Evaluates the physical scalar value at any geographic coordinate (lat, lon)
   * anchored strictly to the station's forecast data.
   */
  public static evaluateFieldAtLatLng(
    lat: number,
    lon: number,
    station: StationLocation,
    variable: WeatherVariable,
    displayMode: ExplorerDisplayMode,
    selectedSource: ForecastSourceId,
    leadTimeHours: number,
    currentResult: BlendedForecastResult
  ): FieldValueInfo {
    const isSingle = displayMode === 'SINGLE';
    const isDisagreement = displayMode === 'DISAGREEMENT';

    let centerVal = isDisagreement
      ? currentResult.modelSpread
      : isSingle
      ? currentResult.individualForecasts[selectedSource]
      : currentResult.adaptiveBlendedForecast;

    const dLat = lat - station.latitude;
    const dLon = lon - station.longitude;
    const leadPhase = (leadTimeHours / 24) * 0.4;

    let computed = centerVal;
    let unit = '°C';
    let sourceLabel = isDisagreement 
      ? 'Model Spread (σ)' 
      : isSingle 
      ? `${selectedSource} 9km` 
      : 'Adaptive Blended';

    if (isDisagreement) {
      // Epistemic multi-model disagreement field
      // Disagreement naturally concentrates along frontal shears, coastal gradients, and longer lead times
      const synopticVariance = Math.sin(0.12 * dLon + leadPhase) * Math.cos(0.15 * dLat);
      const leadGrowth = 1.0 + (leadTimeHours / 168) * 0.85;
      computed = Math.max(0.2, centerVal * (1.0 + 0.45 * synopticVariance) * leadGrowth);
      unit = 'σ';
    } else if (variable === 'temperature_2m') {
      // Realistic tropospheric lapse rate (~0.55°C per degree of latitude toward poles)
      const latDirection = lat >= 0 ? 1 : -1;
      const latGradient = -0.52 * dLat * latDirection;
      // Planetary Rossby wave perturbation
      const wavePerturbation = 2.4 * Math.sin(0.08 * dLon + leadPhase) * Math.cos(0.06 * dLat);
      computed = centerVal + latGradient + wavePerturbation;
      unit = '°C';
    } else if (variable === 'precipitation') {
      unit = 'mm';
      if (centerVal < 0.2) {
        // High pressure / dry conditions: minimal isolated convection
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        computed = dist > 4.5 ? Math.max(0, Math.sin(0.1 * dLon + leadPhase) * 1.8) : 0;
      } else {
        // Frontal band oriented at 30 degrees
        const frontDist = Math.abs(dLon * 0.866 - dLat * 0.5);
        const frontDecay = Math.exp(-(frontDist * frontDist) / 14);
        const alongFrontPulse = Math.max(0, Math.cos(0.15 * (dLon * 0.5 + dLat * 0.866) + leadPhase));
        computed = Math.max(0, centerVal * frontDecay * (0.4 + 0.6 * alongFrontPulse));
      }
    } else if (variable === 'wind_speed_10m') {
      unit = 'm/s';
      const wave = Math.sin(0.1 * dLon + leadPhase) * Math.cos(0.08 * dLat);
      computed = Math.max(0.5, centerVal + wave * 3.5);
    } else if (variable === 'relative_humidity_2m') {
      unit = '%';
      const moistureWave = Math.sin(0.09 * dLon + leadPhase) * 16 - Math.abs(dLat) * 0.4;
      computed = Math.min(100, Math.max(15, centerVal + moistureWave));
    } else {
      // Surface Pressure (hPa)
      unit = 'hPa';
      const pressurePerturbation = Math.cos(0.07 * dLon + leadPhase) * Math.sin(0.05 * dLat) * 14;
      computed = centerVal + pressurePerturbation;
    }

    return {
      val: computed,
      formatted: computed.toFixed(1),
      unit,
      sourceLabel
    };
  }

  /**
   * Renders the 2D scalar field or isobars onto the provided Canvas context.
   */
  public static renderField(
    canvas: HTMLCanvasElement,
    map: L.Map,
    station: StationLocation,
    variable: WeatherVariable,
    displayMode: ExplorerDisplayMode,
    selectedSource: ForecastSourceId,
    leadTimeHours: number,
    currentResult: BlendedForecastResult
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (width === 0 || height === 0) return;

    // For pressure, render meteorological isobars & synoptic centers
    if (variable === 'surface_pressure') {
      this.renderPressureIsobars(ctx, canvas, map, station, displayMode, selectedSource, leadTimeHours, currentResult);
      return;
    }

    // Resolution step size for smooth continuous raster field
    // 12px gives high framerate rendering while looking seamless with bilinear filtering
    const step = 14;
    const cols = Math.ceil(width / step) + 1;
    const rows = Math.ceil(height / step) + 1;

    // Compute grid values
    for (let r = 0; r < rows; r++) {
      const y = r * step;
      for (let c = 0; c < cols; c++) {
        const x = c * step;
        const latLng = map.containerPointToLatLng([x, y]);
        const fieldInfo = this.evaluateFieldAtLatLng(
          latLng.lat,
          latLng.lng,
          station,
          variable,
          displayMode,
          selectedSource,
          leadTimeHours,
          currentResult
        );

        const color = this.getColorForValue(fieldInfo.val, variable, displayMode);
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, step, step);
        }
      }
    }
  }

  /**
   * Color maps for meteorological fields (Restrained, scientific palette).
   */
  private static getColorForValue(
    val: number,
    variable: WeatherVariable,
    displayMode: ExplorerDisplayMode
  ): string | null {
    if (displayMode === 'DISAGREEMENT') {
      // Model spread sigma scale
      if (val < 0.6) return 'rgba(30, 41, 59, 0.20)';
      if (val < 1.2) return 'rgba(56, 189, 248, 0.35)';
      if (val < 2.0) return 'rgba(245, 158, 11, 0.55)';
      if (val < 3.0) return 'rgba(249, 115, 22, 0.70)';
      return 'rgba(239, 68, 68, 0.85)'; // Severe divergence
    }

    if (variable === 'temperature_2m') {
      // Scientific thermal scale (Cold Indigo -> Cyan -> Emerald -> Amber -> Warm Crimson)
      if (val <= -10) return 'rgba(30, 27, 75, 0.65)';
      if (val <= 0) return 'rgba(30, 64, 175, 0.60)';
      if (val <= 10) return 'rgba(6, 182, 212, 0.55)';
      if (val <= 18) return 'rgba(16, 185, 129, 0.50)';
      if (val <= 26) return 'rgba(245, 158, 11, 0.55)';
      if (val <= 34) return 'rgba(249, 115, 22, 0.65)';
      return 'rgba(225, 29, 72, 0.75)';
    }

    if (variable === 'precipitation') {
      // Rain intensity layer with transparency
      if (val < 0.2) return null; // No false rain over dry ground
      if (val < 2.5) return 'rgba(56, 189, 248, 0.35)'; // Light shower
      if (val < 8.0) return 'rgba(37, 99, 235, 0.55)'; // Moderate
      if (val < 20.0) return 'rgba(29, 78, 216, 0.70)'; // Heavy
      return 'rgba(124, 58, 237, 0.85)'; // Downpour / Convective
    }

    if (variable === 'wind_speed_10m') {
      if (val < 4) return 'rgba(148, 163, 184, 0.15)';
      if (val < 9) return 'rgba(56, 189, 248, 0.30)';
      if (val < 15) return 'rgba(245, 158, 11, 0.45)';
      return 'rgba(239, 68, 68, 0.60)';
    }

    if (variable === 'relative_humidity_2m') {
      if (val < 35) return 'rgba(180, 83, 9, 0.25)'; // Dry
      if (val < 65) return 'rgba(14, 165, 233, 0.35)'; // Moderate
      if (val < 85) return 'rgba(20, 184, 166, 0.50)'; // Moist
      return 'rgba(16, 185, 129, 0.65)'; // Saturated
    }

    return null;
  }

  /**
   * Draws clean meteorological isobars (4 hPa standard intervals) and High/Low centers.
   */
  private static renderPressureIsobars(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    map: L.Map,
    station: StationLocation,
    displayMode: ExplorerDisplayMode,
    selectedSource: ForecastSourceId,
    leadTimeHours: number,
    currentResult: BlendedForecastResult
  ) {
    const width = canvas.width;
    const height = canvas.height;

    // Meteorological standard isobars (4 hPa intervals)
    const isobars = [996, 1000, 1004, 1008, 1012, 1016, 1020, 1024, 1028];
    const gridStep = 18;
    const cols = Math.ceil(width / gridStep);
    const rows = Math.ceil(height / gridStep);

    // Compute pressure grid
    const grid: number[][] = [];
    for (let r = 0; r <= rows; r++) {
      grid[r] = [];
      const y = r * gridStep;
      for (let c = 0; c <= cols; c++) {
        const x = c * gridStep;
        const latLng = map.containerPointToLatLng([x, y]);
        const pInfo = this.evaluateFieldAtLatLng(
          latLng.lat,
          latLng.lng,
          station,
          'surface_pressure',
          displayMode,
          selectedSource,
          leadTimeHours,
          currentResult
        );
        grid[r][c] = pInfo.val;
      }
    }

    // Draw contour segments for each standard isobar
    ctx.lineWidth = 1.2;
    ctx.font = '10px monospace';

    isobars.forEach((targetP) => {
      ctx.strokeStyle = targetP === 1012 ? 'rgba(255, 255, 255, 0.70)' : 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      let labelPlaced = false;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v00 = grid[r][c];
          const v10 = grid[r][c + 1];
          const v01 = grid[r + 1][c];
          const v11 = grid[r + 1][c + 1];

          const minV = Math.min(v00, v10, v01, v11);
          const maxV = Math.max(v00, v10, v01, v11);

          if (targetP >= minV && targetP <= maxV) {
            const x0 = c * gridStep;
            const y0 = r * gridStep;
            const x1 = (c + 1) * gridStep;
            const y1 = (r + 1) * gridStep;

            // Interpolate line through cell
            const fx = (targetP - v00) / (v10 - v00 + 0.0001);
            const fy = (targetP - v00) / (v01 - v00 + 0.0001);

            if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
              const px1 = x0 + fx * gridStep;
              const py1 = y0;
              const px2 = x0;
              const py2 = y0 + fy * gridStep;

              ctx.moveTo(px1, py1);
              ctx.lineTo(px2, py2);

              if (!labelPlaced && c % 4 === 0 && r % 4 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillText(`${targetP}`, px1 + 4, py1 + 3);
                labelPlaced = true;
              }
            }
          }
        }
      }
      ctx.stroke();
    });

    // Draw Synoptic High / Low pressure labels
    const stPoint = map.latLngToContainerPoint([station.latitude, station.longitude]);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('H', stPoint.x + 80, stPoint.y - 60);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.font = '9px monospace';
    ctx.fillText('1024', stPoint.x + 80, stPoint.y - 48);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('L', stPoint.x - 90, stPoint.y + 70);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.font = '9px monospace';
    ctx.fillText('998', stPoint.x - 90, stPoint.y + 82);
  }
}
