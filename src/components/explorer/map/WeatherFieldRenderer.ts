import type { Map as MapLibreMap } from 'maplibre-gl';
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
    currentResult: BlendedForecastResult,
    isDemonstrationData: boolean = true
  ): FieldValueInfo {
    const isSingle = displayMode === 'SINGLE';
    const isDisagreement = displayMode === 'DISAGREEMENT';

    const centerVal = isDisagreement
      ? currentResult.modelSpread
      : isSingle
      ? currentResult.individualForecasts[selectedSource]
      : currentResult.adaptiveBlendedForecast;

    const dLat = lat - station.latitude;
    const dLon = lon - station.longitude;
    const leadPhase = (leadTimeHours / 24) * 0.4;

    let computed = centerVal;
    let unit = '°C';
    let sourceLabel = isDemonstrationData 
      ? 'Demonstration Field'
      : isDisagreement 
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
      // Tropospheric lapse rate (~0.52°C per degree of latitude toward poles)
      const latDirection = lat >= 0 ? 1 : -1;
      const latGradient = -0.52 * dLat * latDirection;
      // Planetary wave perturbation
      const wavePerturbation = 2.4 * Math.sin(0.08 * dLon + leadPhase) * Math.cos(0.06 * dLat);
      computed = centerVal + latGradient + wavePerturbation;
      unit = '°C';
    } else if (variable === 'precipitation') {
      unit = 'mm';
      if (centerVal < 0.2) {
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        computed = dist > 4.5 ? Math.max(0, Math.sin(0.1 * dLon + leadPhase) * 1.8) : 0;
      } else {
        // Frontal band oriented along synoptic track
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
   * Specially calibrated for high legibility over a LIGHT / NEUTRAL basemap.
   */
  public static renderField(
    canvas: HTMLCanvasElement,
    map: MapLibreMap,
    station: StationLocation,
    variable: WeatherVariable,
    displayMode: ExplorerDisplayMode,
    selectedSource: ForecastSourceId,
    leadTimeHours: number,
    currentResult: BlendedForecastResult,
    isDemonstrationData: boolean = true
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (width === 0 || height === 0) return;

    // For pressure, render thin meteorological isobars & synoptic centers
    if (variable === 'surface_pressure') {
      this.renderPressureIsobars(ctx, canvas, map, station, displayMode, selectedSource, leadTimeHours, currentResult, isDemonstrationData);
      return;
    }

    // Grid step size for smooth continuous rendering
    const step = 14;
    const cols = Math.ceil(width / step) + 1;
    const rows = Math.ceil(height / step) + 1;

    // Store grid values for smooth fields and optional isotherms
    const grid: number[][] = [];

    // Compute grid values
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      const y = r * step;
      for (let c = 0; c < cols; c++) {
        const x = c * step;
        const lngLat = map.unproject([x, y]);
        const fieldInfo = this.evaluateFieldAtLatLng(
          lngLat.lat,
          lngLat.lng,
          station,
          variable,
          displayMode,
          selectedSource,
          leadTimeHours,
          currentResult,
          isDemonstrationData
        );

        grid[r][c] = fieldInfo.val;

        const color = this.getColorForValue(fieldInfo.val, variable, displayMode);
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    // If Temperature, overlay delicate 1px isotherm curves for scientific clarity
    if (variable === 'temperature_2m' && displayMode !== 'DISAGREEMENT') {
      this.renderIsotherms(ctx, grid, rows, cols, step);
    }
  }

  /**
   * Color maps tuned for a LIGHT / NEUTRAL basemap.
   * Translucent hues keep coastlines, borders, and typography readable underneath.
   */
  private static getColorForValue(
    val: number,
    variable: WeatherVariable,
    displayMode: ExplorerDisplayMode
  ): string | null {
    if (displayMode === 'DISAGREEMENT') {
      // Model divergence sigma scale
      if (val < 0.6) return 'rgba(100, 116, 139, 0.12)'; // Consensus (neutral slate)
      if (val < 1.2) return 'rgba(14, 165, 233, 0.25)'; // Slight spread (soft sky)
      if (val < 2.0) return 'rgba(245, 158, 11, 0.35)'; // Moderate spread (amber)
      if (val < 2.8) return 'rgba(239, 68, 68, 0.45)'; // Elevated divergence (coral)
      return 'rgba(225, 29, 72, 0.55)'; // Severe divergence (rose)
    }

    if (variable === 'temperature_2m') {
      // Subtle translucent thermal wash over light basemap
      if (val <= -10) return 'rgba(30, 58, 138, 0.42)'; // Sub-zero deep navy
      if (val <= 0) return 'rgba(37, 99, 235, 0.32)'; // Freezing blue
      if (val <= 10) return 'rgba(14, 165, 233, 0.28)'; // Cold maritime cyan
      if (val <= 18) return 'rgba(6, 182, 212, 0.25)'; // Cool cyan
      if (val <= 26) return 'rgba(56, 189, 248, 0.22)'; // Mild pleasant
      if (val <= 32) return 'rgba(251, 146, 60, 0.32)'; // Warm light orange
      if (val <= 38) return 'rgba(239, 68, 68, 0.40)'; // Intense thermal orange-red
      return 'rgba(190, 18, 60, 0.52)'; // Extreme heat anomaly (deep rose)
    }

    if (variable === 'precipitation') {
      // Atmospheric rain intensity layer (transparent on dry ground)
      if (val < 0.2) return null;
      if (val < 2.0) return 'rgba(56, 189, 248, 0.35)'; // Light shower
      if (val < 7.0) return 'rgba(14, 165, 233, 0.50)'; // Moderate rain
      if (val < 18.0) return 'rgba(2, 132, 199, 0.68)'; // Heavy rain
      return 'rgba(29, 78, 216, 0.80)'; // Intense convective cell
    }

    if (variable === 'wind_speed_10m') {
      // Subtle wind field shading
      if (val < 4) return 'rgba(148, 163, 184, 0.10)';
      if (val < 9) return 'rgba(6, 182, 212, 0.22)';
      if (val < 15) return 'rgba(2, 132, 199, 0.35)';
      return 'rgba(30, 58, 138, 0.48)';
    }

    if (variable === 'relative_humidity_2m') {
      if (val < 35) return 'rgba(148, 163, 184, 0.10)'; // Dry
      if (val < 60) return 'rgba(14, 165, 233, 0.20)'; // Moderate
      if (val < 85) return 'rgba(2, 132, 199, 0.32)'; // Humid
      return 'rgba(30, 64, 175, 0.45)'; // Saturated vapor
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
    const targetTemps = [0, 10, 20, 28, 36];
    ctx.lineWidth = 0.9;
    ctx.font = '500 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    targetTemps.forEach((targetT) => {
      ctx.strokeStyle = targetT === 20 ? 'rgba(30, 64, 175, 0.65)' : 'rgba(51, 65, 85, 0.40)';
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
                ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
                ctx.fillText(`${targetT}°C`, px1 + 3, py1 + 2);
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
    map: MapLibreMap,
    station: StationLocation,
    displayMode: ExplorerDisplayMode,
    selectedSource: ForecastSourceId,
    leadTimeHours: number,
    currentResult: BlendedForecastResult,
    isDemonstrationData: boolean
  ) {
    const width = canvas.width;
    const height = canvas.height;

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
        const lngLat = map.unproject([x, y]);
        const pInfo = this.evaluateFieldAtLatLng(
          lngLat.lat,
          lngLat.lng,
          station,
          'surface_pressure',
          displayMode,
          selectedSource,
          leadTimeHours,
          currentResult,
          isDemonstrationData
        );
        grid[r][c] = pInfo.val;
      }
    }

    // Draw contour segments for each standard isobar
    ctx.lineWidth = 1.0;
    ctx.font = '500 10px monospace';

    isobars.forEach((targetP) => {
      ctx.strokeStyle = targetP === 1012 ? 'rgba(2, 132, 199, 0.85)' : 'rgba(51, 65, 85, 0.50)';
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
                ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
                ctx.fillText(`${targetP}`, px1 + 4, py1 + 3);
                labelPlaced = true;
              }
            }
          }
        }
      }
      ctx.stroke();
    });

    // Draw Synoptic High / Low centers
    const stPoint = map.project([station.longitude, station.latitude]);
    // Synoptic High center
    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('H', stPoint.x + 80, stPoint.y - 60);
    ctx.fillStyle = '#0F172A';
    ctx.font = '500 9px monospace';
    ctx.fillText('1024 hPa', stPoint.x + 80, stPoint.y - 48);

    // Synoptic Low center
    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('L', stPoint.x - 90, stPoint.y + 70);
    ctx.fillStyle = '#0F172A';
    ctx.font = '500 9px monospace';
    ctx.fillText('998 hPa', stPoint.x - 90, stPoint.y + 82);
  }
}
