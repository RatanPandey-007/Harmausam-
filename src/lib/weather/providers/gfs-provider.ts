/**
 * Centralized Weather Data Architecture — NOAA GFS Provider
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Dedicated NCEP GFS model endpoint ingestion (https://api.open-meteo.com/v1/gfs)
 * - Strict metadata provenance:
 *   - sourceId: "noaa-gfs"
 *   - provider: "NOAA"
 *   - model: "GFS"
 * - Horizontal resolution: ~13.0 km (0.13° / 0.25° grid)
 * - Explicit distinction: strictly GFS, never HRRR, NAM, or RAP
 */

import { BaseOpenMeteoProvider } from './base-open-meteo';

export class GFSProvider extends BaseOpenMeteoProvider {
  constructor(endpointOverride?: string) {
    super({
      sourceId: 'GFS',
      explicitSourceId: 'noaa-gfs',
      providerOrg: 'NOAA',
      modelName: 'GFS',
      endpointUrl: endpointOverride || 'https://api.open-meteo.com/v1/gfs',
      resolutionKm: 13.0,
      timeoutMs: 12000,
    });
  }
}
