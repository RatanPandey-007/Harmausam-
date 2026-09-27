/**
 * Climatological & Geographic Region Classification
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Implements deterministic geographic region identification from
 * station coordinates, station identifiers, or metadata.
 */

export interface RegionDefinition {
  id: string;
  name: string;
  climateCharacteristics: string;
  referenceStations: string[];
}

export const CLIMATOLOGICAL_REGIONS: Record<string, RegionDefinition> = {
  NORTHERN_PLAIN: {
    id: 'NORTHERN_PLAIN',
    name: 'Indo-Gangetic Northern Plain',
    climateCharacteristics: 'Extreme continental temperature range, dense winter fog (Western Disturbances), severe summer heatwaves, intense monsoonal bursts.',
    referenceStations: ['VIDP', 'NEW_DELHI', 'LUCKNOW', 'VARANASI'],
  },
  WESTERN_HIMALAYAS: {
    id: 'WESTERN_HIMALAYAS',
    name: 'Western Himalayas & High Alpine',
    climateCharacteristics: 'Complex orographic lifting, rapid freeze-thaw cycles, snowpack variability, cloudburst vulnerability.',
    referenceStations: ['SRINAGAR', 'SHIMLA', 'LEH'],
  },
  COASTAL_PENINSULA: {
    id: 'COASTAL_PENINSULA',
    name: 'Peninsular Coastal Maritime',
    climateCharacteristics: 'High relative humidity, diurnal land-sea breeze regimes, monsoon surges, tropical cyclonic landfall susceptibility.',
    referenceStations: ['MUMBAI', 'CHENNAI', 'KOCHI'],
  },
  DECCAN_PLATEAU: {
    id: 'DECCAN_PLATEAU',
    name: 'Deccan Semi-Arid Plateau',
    climateCharacteristics: 'Rain-shadow monsoonal attenuation, elevated plateau diurnal temperature swings, moderate convective storms.',
    referenceStations: ['BENGALURU', 'HYDERABAD', 'PUNE'],
  },
  WESTERN_EUROPE_MARITIME: {
    id: 'WESTERN_EUROPE_MARITIME',
    name: 'Western Europe Maritime',
    climateCharacteristics: 'Frequent Atlantic extratropical depressions, moderated oceanic temperatures, year-round precipitation.',
    referenceStations: ['EGLL', 'LONDON', 'PARIS'],
  },
  CENTRAL_EUROPE_ALPINE: {
    id: 'CENTRAL_EUROPE_ALPINE',
    name: 'Central Europe Alpine Foothills',
    climateCharacteristics: 'Continental-oceanic transition, Föhn wind events, complex orographic precipitation.',
    referenceStations: ['LSZH', 'ZURICH', 'GENEVA', 'VIENNA'],
  },
  NORTH_AMERICA_CONTINENTAL: {
    id: 'NORTH_AMERICA_CONTINENTAL',
    name: 'North America East Coast Continental',
    climateCharacteristics: 'Nor\'easter winter storms, humid subtropical summer maritime air, high seasonal temperature variance.',
    referenceStations: ['KJFK', 'NEW_YORK', 'BOSTON'],
  },
  EAST_ASIA_MARITIME: {
    id: 'EAST_ASIA_MARITIME',
    name: 'East Asia Pacific Maritime',
    climateCharacteristics: 'Meiyu-Baiu frontal rainbands, typhoon tracks, humid subtropical maritime influence.',
    referenceStations: ['RJTT', 'TOKYO', 'OSAKA'],
  },
  GLOBAL_GENERIC: {
    id: 'GLOBAL_GENERIC',
    name: 'Global Continental / Maritime',
    climateCharacteristics: 'Standard synoptic-scale atmospheric dynamics.',
    referenceStations: [],
  },
};

/**
 * Determine climatological region ID from coordinates and optional stationId
 */
export function getRegionFromCoordinates(
  lat: number,
  lon: number,
  stationId?: string
): string {
  if (stationId) {
    const sId = stationId.toUpperCase();
    if (sId === 'VIDP' || sId.includes('DELHI')) return 'NORTHERN_PLAIN';
    if (sId === 'EGLL' || sId.includes('LONDON')) return 'WESTERN_EUROPE_MARITIME';
    if (sId === 'LSZH' || sId.includes('ZURICH')) return 'CENTRAL_EUROPE_ALPINE';
    if (sId === 'KJFK' || sId.includes('YORK')) return 'NORTH_AMERICA_CONTINENTAL';
    if (sId === 'RJTT' || sId.includes('TOKYO')) return 'EAST_ASIA_MARITIME';
  }

  // Geographic coordinate bounding boxes
  // Northern Plain of India: Lat 24-32°N, Lon 73-88°E
  if (lat >= 24.0 && lat <= 32.0 && lon >= 73.0 && lon <= 88.0) {
    return 'NORTHERN_PLAIN';
  }

  // Western Himalayas: Lat 31-37°N, Lon 73-80°E
  if (lat >= 31.0 && lat <= 37.0 && lon >= 73.0 && lon <= 80.0) {
    return 'WESTERN_HIMALAYAS';
  }

  // Deccan Plateau: Lat 12-21°N, Lon 74-81°E
  if (lat >= 12.0 && lat <= 21.0 && lon >= 74.0 && lon <= 81.0) {
    return 'DECCAN_PLATEAU';
  }

  // Peninsular Coastal: Lat 8-22°N, Lon 68-74°E (West) or 80-86°E (East)
  if (lat >= 8.0 && lat <= 22.0 && ((lon >= 68.0 && lon <= 74.0) || (lon >= 80.0 && lon <= 86.0))) {
    return 'COASTAL_PENINSULA';
  }

  // Western Europe: Lat 48-60°N, Lon -10-5°E
  if (lat >= 48.0 && lat <= 60.0 && lon >= -10.0 && lon <= 5.0) {
    return 'WESTERN_EUROPE_MARITIME';
  }

  // Central Europe Alpine: Lat 45-50°N, Lon 5-16°E
  if (lat >= 45.0 && lat <= 50.0 && lon >= 5.0 && lon <= 16.0) {
    return 'CENTRAL_EUROPE_ALPINE';
  }

  // North America East Coast: Lat 36-45°N, Lon -78--68°W
  if (lat >= 36.0 && lat <= 45.0 && lon >= -78.0 && lon <= -68.0) {
    return 'NORTH_AMERICA_CONTINENTAL';
  }

  // Japan / East Asia: Lat 30-45°N, Lon 128-145°E
  if (lat >= 30.0 && lat <= 45.0 && lon >= 128.0 && lon <= 145.0) {
    return 'EAST_ASIA_MARITIME';
  }

  return 'GLOBAL_GENERIC';
}

/**
 * Returns human-readable region display name
 */
export function getRegionDisplayName(regionId: string): string {
  return CLIMATOLOGICAL_REGIONS[regionId]?.name ?? regionId;
}
