import type { StyleSpecification } from 'maplibre-gl';

export type MapStyleType = 'standard' | 'satellite' | 'terrain';
export type MapProviderType = 'maptiler' | 'carto' | 'openfreemap';

export interface MapProviderConfig {
  provider: MapProviderType;
  hasApiKey: boolean;
  isDemoMode: boolean;
  statusLabel: string;
}

/**
 * ESRI World Imagery raster style specification (fully licensed, public mapping service)
 */
export const ESRI_SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  name: 'Esri World Imagery',
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

/**
 * ESRI World Topo / Shaded Relief style specification
 */
export const ESRI_TERRAIN_STYLE: StyleSpecification = {
  version: 8,
  name: 'Esri World Topographic',
  sources: {
    'esri-topo': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, METI/NASA'
    }
  },
  layers: [
    {
      id: 'esri-topo-layer',
      type: 'raster',
      source: 'esri-topo',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

/**
 * Fallback dark matter style URL (CARTO GL dark-matter, zero API key required)
 */
export const FALLBACK_DARK_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function getEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] || '';
  }
  return '';
}

/**
 * Determines current map provider configuration from environment variables
 */
export function getMapProviderConfig(): MapProviderConfig {
  const maptilerKey = getEnv('VITE_MAPTILER_API_KEY');
  const hasApiKey = Boolean(maptilerKey && maptilerKey.trim().length > 0);
  const requestedProvider = (getEnv('VITE_MAP_PROVIDER') || (hasApiKey ? 'maptiler' : 'carto')).toLowerCase() as MapProviderType;

  return {
    provider: hasApiKey ? 'maptiler' : requestedProvider,
    hasApiKey,
    isDemoMode: false,
    statusLabel: hasApiKey ? 'MAPTILER BASEMAP' : 'OPERATIONAL BASEMAP',
  };
}

/**
 * Resolves the MapLibre style definition for the requested map style type.
 * When VITE_MAPTILER_API_KEY is configured, delivers MapTiler vector styles.
 * When no key is set or on error, delivers clean, operational dark basemaps.
 */
export function resolveMapStyle(styleType: MapStyleType): string | StyleSpecification {
  const directStyle = getEnv('VITE_MAP_STYLE_URL');
  const maptilerKey = getEnv('VITE_MAPTILER_API_KEY');
  const provider = (getEnv('VITE_MAP_PROVIDER') || 'maptiler').toLowerCase() as MapProviderType;

  // 1. Direct custom style override if specified in environment
  if (directStyle && styleType === 'standard') {
    return directStyle;
  }

  // 2. MapTiler Vector Basemap (when API key is present)
  if (maptilerKey && (provider === 'maptiler' || !provider)) {
    if (styleType === 'satellite') {
      return `https://api.maptiler.com/maps/satellite/style.json?key=${maptilerKey}`;
    }
    if (styleType === 'terrain') {
      return `https://api.maptiler.com/maps/topo-v2/style.json?key=${maptilerKey}`;
    }
    // Dark operational cartography matching Harmausam design language
    return `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${maptilerKey}`;
  }

  // 3. Fallback styles (CARTO / ESRI) if MapTiler key is absent
  return getFallbackMapStyle(styleType);
}

/**
 * Reliable fallback styles that work with zero API key dependencies
 */
export function getFallbackMapStyle(styleType: MapStyleType): string | StyleSpecification {
  if (styleType === 'satellite') {
    return ESRI_SATELLITE_STYLE;
  }
  if (styleType === 'terrain') {
    return ESRI_TERRAIN_STYLE;
  }
  return FALLBACK_DARK_STYLE_URL;
}

/**
 * Map attribution compliant with MapTiler / OpenStreetMap licensing
 */
export function getMapAttribution(styleType: MapStyleType): string {
  const maptilerKey = getEnv('VITE_MAPTILER_API_KEY');

  if (maptilerKey) {
    return '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">&copy; OpenStreetMap contributors</a>';
  }

  if (styleType === 'satellite') {
    return '&copy; Esri &mdash; DigitalGlobe, GeoEye, Earthstar Geographics';
  }
  if (styleType === 'terrain') {
    return '&copy; Esri &mdash; USGS, METI/NASA, OpenStreetMap';
  }
  return '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';
}
