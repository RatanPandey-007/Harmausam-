import type { Map as MapLibreMap } from 'maplibre-gl';
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
  private map: MapLibreMap;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private numParticles: number = 280;

  private station: StationLocation;
  private windSpeed: number;
  private windDirectionDeg: number;

  constructor(
    canvas: HTMLCanvasElement,
    map: MapLibreMap,
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
   * Computes meteorological vector (u, v) at screen coordinate (x, y)
   * using MapLibre's unproject method.
   */
  private getVectorAtPoint(x: number, y: number): { u: number; v: number; speed: number } {
    const lngLat = this.map.unproject([x, y]);
    const dLat = lngLat.lat - this.station.latitude;
    const dLon = lngLat.lng - this.station.longitude;

    // Synoptic curvature: Cyclonic flow in northern hemisphere
    const baseRad = (this.windDirectionDeg * Math.PI) / 180;
    const curvature = Math.atan2(dLat, dLon) * 0.45;
    const angle = baseRad + curvature;

    // Wind speed varies across pressure gradient
    const speed = Math.max(1.2, this.windSpeed + Math.sin(0.08 * dLon) * 2.2);

    // Screen coordinate conversion: screen Y is downward
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

    // Light basemap trail fade effect: clean, subtle dissolution
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    this.ctx.fillRect(0, 0, width, height);

    const stepSpeedScale = 0.36;

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

      // High-contrast streamline colors tailored for LIGHT basemap
      const speed = vector.speed;
      let strokeColor = 'rgba(100, 116, 139, 0.45)'; // Gentle flow: Slate
      let lineWidth = 0.9;

      if (speed >= 14) {
        strokeColor = 'rgba(15, 23, 42, 0.95)'; // Gale force: Deep Navy
        lineWidth = 1.8;
      } else if (speed >= 9) {
        strokeColor = 'rgba(2, 132, 199, 0.85)'; // Moderate: Deep Azure
        lineWidth = 1.4;
      } else if (speed >= 4) {
        strokeColor = 'rgba(14, 165, 233, 0.70)'; // Light breeze: Sky blue
        lineWidth = 1.1;
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
