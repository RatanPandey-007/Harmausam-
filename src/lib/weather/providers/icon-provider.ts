/**
 * Centralized Weather Data Architecture — DWD ICON Global Provider
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Dedicated DWD ICON model endpoint ingestion (https://api.open-meteo.com/v1/dwd-icon)
 * - Explicit parameter: `models=icon_global` (strictly ICON Global; never switches to ICON-EU or ICON-D2)
 * - Strict metadata provenance:
 *   - sourceId: "dwd-icon"
 *   - provider: "DWD"
 *   - model: "ICON"
 * - Horizontal resolution: ~13.0 km (Icosahedral grid)
 */

import { BaseOpenMeteoProvider } from './base-open-meteo';

export class ICONProvider extends BaseOpenMeteoProvider {
  constructor(endpointOverride?: string) {
    super({
      sourceId: 'ICON',
      explicitSourceId: 'dwd-icon',
      providerOrg: 'DWD',
      modelName: 'ICON',
      endpointUrl: endpointOverride || 'https://api.open-meteo.com/v1/dwd-icon',
      resolutionKm: 13.0,
      extraParams: {
        models: 'icon_global', // Strictly enforce ICON Global operational run
      },
      timeoutMs: 12000,
    });
  }
}
