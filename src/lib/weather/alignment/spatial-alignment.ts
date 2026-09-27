/**
 * Centralized Weather Data Architecture — Spatial Consistency & Point Alignment
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Deterministic spatial validation for point forecasts against target station coordinates
 * - Tolerance validation: verifies grid cell centroids lie within acceptable threshold (default: ≤0.25°)
 * - Location identity standardization (stationId, normalized WGS84 coordinates)
 * - Preparation for gridded / spatial array alignment without artificial global grid assumptions
 */

import { ForecastPoint } from '../types';
import { normalizeCoordinates } from '../normalization';

export interface SpatialAlignmentResult {
  isAligned: boolean;
  stationId: string;
  targetLatitude: number;
  targetLongitude: number;
  discrepancies: {
    sourceId: string;
    reportedLatitude: number;
    reportedLongitude: number;
    deltaDegrees: number;
  }[];
}

export class SpatialAlignmentEngine {
  /**
   * Calculate haversine or Euclidean angular distance in degrees between two coordinates
   */
  public static calculateAngularDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLat = lat1 - lat2;
    const dLon = lon1 - lon2;
    return Math.sqrt(dLat * dLat + dLon * dLon);
  }

  /**
   * Verify spatial consistency across all model points against requested target coordinates
   */
  public static verifySpatialAlignment(
    stationId: string,
    targetLat: number,
    targetLon: number,
    points: ForecastPoint[],
    maxDeltaDegrees: number = 0.25
  ): SpatialAlignmentResult {
    const { latitude: normTargetLat, longitude: normTargetLon } = normalizeCoordinates(targetLat, targetLon);
    const discrepancies: SpatialAlignmentResult['discrepancies'] = [];
    let isAligned = true;

    for (const pt of points) {
      const dist = SpatialAlignmentEngine.calculateAngularDistance(
        normTargetLat,
        normTargetLon,
        pt.latitude,
        pt.longitude
      );

      if (dist > maxDeltaDegrees) {
        isAligned = false;
        discrepancies.push({
          sourceId: pt.sourceId,
          reportedLatitude: pt.latitude,
          reportedLongitude: pt.longitude,
          deltaDegrees: Math.round(dist * 1000) / 1000,
        });
      }
    }

    return {
      isAligned,
      stationId,
      targetLatitude: normTargetLat,
      targetLongitude: normTargetLon,
      discrepancies,
    };
  }
}
