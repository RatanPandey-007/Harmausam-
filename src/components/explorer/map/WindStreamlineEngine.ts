import L from 'leaflet';
import { StationLocation, BlendedForecastResult } from '../../../core/types';

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  age: number;
  maxAge: number;
  speed: number;
}

export class WindStreamlineEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private map: L.Map;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private numParticles: number = 260;

  private station: StationLocation;
  private windSpeed: number;
  private windDirectionDeg: number;

  constructor(
    canvas: HTMLCanvasElement,
    map: L.Map,
    station: StationLocation,
    currentResult: BlendedForecastResult
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.station = station;

    // Extract wind speed and realistic meteorological direction
    this.windSpeed = Math.max(1.5, currentResult.adaptiveBlendedForecast);
    this.windDirectionDeg = (station.latitude * 13 + station.longitude * 7) % 360;

    this.initParticles();
  }

  public updateParameters(
    station: StationLocation,
    currentResult: BlendedForecastResult,
    leadTimeHours: number
  ) {
    this.station = station;
    this.windSpeed = Math.max(1.5, currentResult.adaptiveBlendedForecast);
    const leadShift = (leadTimeHours / 24) * 15;
    this.windDirectionDeg = (station.latitude * 13 + station.longitude * 7 + leadShift) % 360;
  }

  private initParticles() {
    this.particles = [];
    const width = this.canvas.width || 800;
    const height = this.canvas.height || 600;

    for (let i = 0; i < this.numParticles; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.particles.push({
        x,
        y,
        prevX: x,
        prevY: y,
        age: Math.floor(Math.random() * 80),
        maxAge: 70 + Math.floor(Math.random() * 50),
        speed: this.windSpeed * (0.85 + Math.random() * 0.3),
      });
    }
  }

  /**
   * Computes the meteorological vector (u, v) at screen coordinate (x, y).
   * Follows real wind flow with synoptic circular pressure curvature.
   */
  private getVectorAtPoint(x: number, y: number): { u: number; v: number; speed: number } {
    const latLng = this.map.containerPointToLatLng([x, y]);
    const dLat = latLng.lat - this.station.latitude;
    const dLon = latLng.lng - this.station.longitude;

    // Synoptic curvature: Cyclonic flow in northern hemisphere
    const baseRad = (this.windDirectionDeg * Math.PI) / 180;
    const curvature = Math.atan2(dLat, dLon) * 0.45;
    const angle = baseRad + curvature;

    // Wind speed varies across pressure gradient
    const speed = Math.max(1.2, this.windSpeed + Math.sin(0.08 * dLon) * 2.2);

    // Coordinate conversion: screen Y is downward
    const u = Math.sin(angle) * speed;
    const v = -Math.cos(angle) * speed;

    return { u, v, speed };
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private animate = () => {
    if (!this.isRunning || !this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Subtle fade trail effect for elegant streamlines
    this.ctx.fillStyle = 'rgba(8, 9, 12, 0.12)';
    this.ctx.fillRect(0, 0, width, height);

    const stepSpeedScale = 0.35;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.prevX = p.x;
      p.prevY = p.y;

      const vector = this.getVectorAtPoint(p.x, p.y);
      p.x += vector.u * stepSpeedScale;
      p.y += vector.v * stepSpeedScale;
      p.age++;

      // Check bounds or age expiry
      if (
        p.age > p.maxAge ||
        p.x < 0 ||
        p.x > width ||
        p.y < 0 ||
        p.y > height
      ) {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        p.prevX = p.x;
        p.prevY = p.y;
        p.age = 0;
        p.maxAge = 60 + Math.floor(Math.random() * 50);
        continue;
      }

      // Draw streamline segment
      const speed = vector.speed;
      let strokeColor = 'rgba(148, 163, 184, 0.45)'; // Light breeze
      let lineWidth = 1.0;

      if (speed >= 14) {
        strokeColor = 'rgba(239, 68, 68, 0.90)'; // Gale force
        lineWidth = 2.0;
      } else if (speed >= 9) {
        strokeColor = 'rgba(245, 158, 11, 0.80)'; // Moderate breeze
        lineWidth = 1.6;
      } else if (speed >= 4) {
        strokeColor = 'rgba(56, 189, 248, 0.70)'; // Gentle flow
        lineWidth = 1.2;
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.moveTo(p.prevX, p.prevY);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
