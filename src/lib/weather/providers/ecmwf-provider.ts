/**
 * Centralized Weather Data Architecture — ECMWF IFS Provider
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Dedicated ECMWF IFS model endpoint ingestion (https://api.open-meteo.com/v1/ecmwf)
 * - Strict metadata provenance:
 *   - sourceId: "ecmwf-ifs"
 *   - provider: "ECMWF"
 *   - model: "IFS"
 * - Horizontal resolution: ~9.0 km (0.1° Regular Gaussian)
 * - Zero fabricated model metadata or accuracy claims
 */

import { BaseOpenMeteoProvider } from './base-open-meteo';

export class ECMWFProvider extends BaseOpenMeteoProvider {
  constructor(endpointOverride?: string) {
    super({
      sourceId: 'ECMWF',
      explicitSourceId: 'ecmwf-ifs',
      providerOrg: 'ECMWF',
      modelName: 'IFS',
      endpointUrl: endpointOverride || 'https://api.open-meteo.com/v1/ecmwf',
      resolutionKm: 9.0,
      timeoutMs: 12000,
    });
  }
}
