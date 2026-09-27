/**
 * Climatological Season Derivation
 * Harmausam Meteorological Intelligence Platform — Phase 4
 *
 * Implements deterministic standard meteorological seasonal categorization
 * based on UTC valid timestamp:
 * - DJF: December, January, February (Winter / Cold Season)
 * - MAM: March, April, May (Pre-Monsoon / Summer Heat)
 * - JJA: June, July, August (Southwest Monsoon)
 * - SON: September, October, November (Post-Monsoon / Autumn Transition)
 */

import { Season } from '../types';

export interface SeasonInfo {
  season: Season;
  name: string;
  subcontinentalPhenology: string;
  monthIndexUtc: number; // 0-11
}

/**
 * Derives the climatological season from an ISO-8601 UTC timestamp or Date object.
 */
export function getSeasonFromTimestamp(timestamp: string | Date): Season {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) {
    // Graceful deterministic fallback if invalid date string
    return 'MAM';
  }

  const month = date.getUTCMonth(); // 0 = Jan, 11 = Dec

  if (month === 11 || month === 0 || month === 1) {
    return 'DJF';
  } else if (month >= 2 && month <= 4) {
    return 'MAM';
  } else if (month >= 5 && month <= 7) {
    return 'JJA';
  } else {
    return 'SON';
  }
}

/**
 * Returns detailed meteorological metadata for the season
 */
export function getSeasonInfo(timestamp: string | Date): SeasonInfo {
  const season = getSeasonFromTimestamp(timestamp);
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const monthIndexUtc = isNaN(date.getTime()) ? 2 : date.getUTCMonth();

  const metadata: Record<Season, { name: string; phenology: string }> = {
    DJF: {
      name: 'Winter (DJF)',
      phenology: 'Cold-weather season; Western Disturbances dominate northwest subcontinent.',
    },
    MAM: {
      name: 'Pre-Monsoon / Summer (MAM)',
      phenology: 'High thermal heating, dry-line severe thunderstorms, heatwave susceptibility.',
    },
    JJA: {
      name: 'Southwest Monsoon (JJA)',
      phenology: 'Peak precipitation regime, maritime moisture flux, widespread convective systems.',
    },
    SON: {
      name: 'Post-Monsoon / Retreating (SON)',
      phenology: 'Cyclonic storm activity in Bay of Bengal/Arabian Sea, rapid anticyclonic shift.',
    },
  };

  return {
    season,
    name: metadata[season].name,
    subcontinentalPhenology: metadata[season].phenology,
    monthIndexUtc,
  };
}
