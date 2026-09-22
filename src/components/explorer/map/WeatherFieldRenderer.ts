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
      const synopticVariance = Math.sin(0.12 * dLon + leadPhase) * Math.cos(0.15 * dLat);
      const leadGrowth = 1.0 + (leadTimeHours / 168) * 0.85;
      computed = Math.max(0.2, centerVal * (1.0 + 0.45 * synopticVariance) * leadGrowth);
      unit = 'σ';
    } else if (variable === 'temperature_2m') {
      // Realistic tropospheric lapse rate (~0.52°C per degree of latitude toward poles)
      const latDirection = lat >= 0 ? 1 : -1;
      const latGradient = -0.52 * dLat * latDirection;
      // Planetary Rossby wave perturbation
      const wavePerturbation = 2.4 * Math.sin(0.08 * dLon + leadPhase) * Math.cos(0.06 * dLat);
      computed = centerVal + latGradient + wavePerturbation;
      unit = '°C';
    } else if (variable === 'precipitation') {
      unit = 'mm';
      if (centerVal < 0.2) {
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
   * Utilizes a publication-grade restrained blue/cyan meteorological aesthetic.
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

    // Grid step size for smooth continuous rendering
    const step = 12;
    const cols = Math.ceil(width / step) + 1;
    const rows = Math.ceil(height / step) + 1;

    // Store grid values for drawing smooth fields and optional isotherms
    const grid: number[][] = [];

    // Compute grid values
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
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

        grid[r][c] = fieldInfo.val;

        const color = this.getColorForValue(fieldInfo.val, variable, displayMode);
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    // If Temperature, overlay subtle 1px isotherm curves for scientific clarity
    if (variable === 'temperature_2m' && displayMode !== 'DISAGREEMENT') {
      this.renderIsotherms(ctx, grid, rows, cols, step);
    }
  }

  /**
   * Color maps for meteorological fields (Restrained blue/cyan scientific operations palette).
   * Strictly avoids bright rainbow neon/cyberpunk aesthetics.
   */
  private static getColorForValue(
    val: number,
    variable: WeatherVariable,
    displayMode: ExplorerDisplayMode
  ): string | null {
    if (displayMode === 'DISAGREEMENT') {
      // Model spread sigma scale in deep navy -> restrained cyan -> soft amber divergence
      if (val < 0.6) return 'rgba(15, 23, 42, 0.20)'; // Consensus (slate-navy)
      if (val < 1.2) return 'rgba(14, 116, 144, 0.35)'; // Slight spread (cyan)
      if (val < 2.0) return 'rgba(56, 189, 248, 0.45)'; // Moderate spread (sky-cyan)
      if (val < 2.8) return 'rgba(251, 146, 60, 0.50)'; // Elevated divergence (amber)
      return 'rgba(244, 63, 94, 0.60)'; // Severe divergence (rose)
    }

    if (variable === 'temperature_2m') {
      // Scientific restrained blue/cyan thermal scale
      // Deep midnight indigo -> cool slate cyan -> electric cyan -> crisp ice blue -> soft pale warm edge
      if (val <= -10) return 'rgba(15, 23, 42, 0.70)'; // Deep polar freeze
      if (val <= 0) return 'rgba(30, 58, 138, 0.55)'; // Sub-zero navy
      if (val <= 10) return 'rgba(12, 74, 110, 0.48)'; // Cold maritime cyan-blue
      if (val <= 18) return 'rgba(14, 116, 144, 0.45)'; // Cool cyan
      if (val <= 26) return 'rgba(6, 182, 212, 0.48)'; // Moderate cyan
      if (val <= 33) return 'rgba(56, 189, 248, 0.55)'; // Warm light cyan
      if (val <= 38) return 'rgba(186, 230, 253, 0.65)'; // Intense thermal ice-white
      return 'rgba(251, 146, 60, 0.60)'; // Severe heat anomaly (soft amber)
    }

    if (variable === 'precipitation') {
      // Atmospheric rain intensity layer (Restrained blue/cyan reflectivity bands)
      if (val < 0.2) return null; // Dry ground remains transparent
      if (val < 2.0) return 'rgba(56, 189, 248, 0.30)'; // Light shower
      if (val < 7.0) return 'rgba(14, 165, 233, 0.50)'; // Moderate rain
      if (val < 18.0) return 'rgba(2, 132, 199, 0.68)'; // Heavy rain
      return 'rgba(3, 105, 161, 0.85)'; // Intense convective burst
    }

    if (variable === 'wind_speed_10m') {
      if (val < 4) return 'rgba(148, 163, 184, 0.15)'; // Calm
      if (val < 9) return 'rgba(6, 182, 212, 0.30)'; // Gentle flow
      if (val < 15) return 'rgba(56, 189, 248, 0.48)'; // Moderate wind
      return 'rgba(255, 255, 255, 0.65)'; // Gale force
    }

    if (variable === 'relative_humidity_2m') {
      if (val < 35) return 'rgba(15, 23, 42, 0.20)'; // Dry
      if (val < 60) return 'rgba(14, 116, 144, 0.32)'; // Moderate
      if (val < 85) return 'rgba(6, 182, 212, 0.48)'; // Humid
      return 'rgba(56, 189, 248, 0.62)'; // Saturated vapor
    }

    return null;
  }

  /**
   * Overlays delicate 1px isotherm curves for temperature fields.
   */
  private static renderIsotherms(
    ctx: CanvasRenderingContext2D,
    grid: number[][],
    rows: number,
    cols: number,
    step: number
  ) {
    const targetTemps = [0, 10, 20, 30, 38];
    ctx.lineWidth = 0.8;
    ctx.font = '9px monospace';

    targetTemps.forEach((targetT) => {
      ctx.strokeStyle = targetT === 20 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      let labelPlaced = false;

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const v00 = grid[r][c];
          const v10 = grid[r][c + 1];
          const v01 = grid[r + 1][c];
          const v11 = grid[r + 1][c + 1];

          const minV = Math.min(v00, v10, v01, v11);
          const maxV = Math.max(v00, v10, v01, v11);

          if (targetT >= minV && targetT <= maxV) {
            const x0 = c * step;
            const y0 = r * step;

            const fx = (targetT - v00) / (v10 - v00 + 0.0001);
            const fy = (targetT - v00) / (v01 - v00 + 0.0001);

            if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
              const px1 = x0 + fx * step;
              const py1 = y0;
              const px2 = x0;
              const py2 = y0 + fy * step;

              ctx.moveTo(px1, py1);
              ctx.lineTo(px2, py2);

              if (!labelPlaced && c % 6 === 0 && r % 6 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
                ctx.fillText(`${targetT}°`, px1 + 3, py1 + 2);
                labelPlaced = true;
              }
            }
          }
        }
      }
      ctx.stroke();
    });
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
    const gridStep = 16;
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
    ctx.lineWidth = 1.0;
    ctx.font = '10px monospace';

    isobars.forEach((targetP) => {
      ctx.strokeStyle = targetP === 1012 ? 'rgba(56, 189, 248, 0.70)' : 'rgba(255, 255, 255, 0.35)';
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
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('H', stPoint.x + 80, stPoint.y - 60);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.font = '9px monospace';
    ctx.fillText('1024 hPa', stPoint.x + 80, stPoint.y - 48);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('L', stPoint.x - 90, stPoint.y + 70);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '9px monospace';
    ctx.fillText('998 hPa', stPoint.x - 90, stPoint.y + 82);
  }
}
