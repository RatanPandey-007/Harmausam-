import { StationLocation } from '../types';

export const GLOBAL_STATIONS: StationLocation[] = [
  {
    id: 'VIDP',
    name: 'New Delhi (Safdarjung)',
    country: 'India',
    region: 'South Asia (Monsoonal Subtropical)',
    latitude: 28.58,
    longitude: 77.21,
    elevationMeters: 216,
    climateZone: 'Cwa - Humid Subtropical / Monsoon',
    climatology: {
      tempMean: 25.1,
      tempStd: 7.8,
      precipAnnualMm: 790,
      windMeanMs: 3.2
    }
  },
  {
    id: 'EGLL',
    name: 'London (Heathrow)',
    country: 'United Kingdom',
    region: 'Western Europe (Maritime)',
    latitude: 51.47,
    longitude: -0.45,
    elevationMeters: 25,
    climateZone: 'Cfb - Temperate Oceanic',
    climatology: {
      tempMean: 11.3,
      tempStd: 5.2,
      precipAnnualMm: 602,
      windMeanMs: 4.8
    }
  },
  {
    id: 'KJFK',
    name: 'New York (JFK International)',
    country: 'United States',
    region: 'North America (East Coast Continental)',
    latitude: 40.64,
    longitude: -73.78,
    elevationMeters: 4,
    climateZone: 'Cfa - Humid Subtropical / Continental Border',
    climatology: {
      tempMean: 13.1,
      tempStd: 9.1,
      precipAnnualMm: 1195,
      windMeanMs: 5.6
    }
  },
  {
    id: 'RJTT',
    name: 'Tokyo (Haneda)',
    country: 'Japan',
    region: 'East Asia (Pacific Maritime)',
    latitude: 35.55,
    longitude: 139.78,
    elevationMeters: 6,
    climateZone: 'Cfa - Humid Subtropical',
    climatology: {
      tempMean: 16.2,
      tempStd: 7.9,
      precipAnnualMm: 1530,
      windMeanMs: 4.3
    }
  },
  {
    id: 'LSZH',
    name: 'Zurich (Kloten)',
    country: 'Switzerland',
    region: 'Central Europe (Alpine Foothills)',
    latitude: 47.46,
    longitude: 8.55,
    elevationMeters: 432,
    climateZone: 'Cfb - Oceanic Alpine Foothills',
    climatology: {
      tempMean: 9.8,
      tempStd: 6.8,
      precipAnnualMm: 1100,
      windMeanMs: 3.5
    }
  }
];

export function getStationById(id: string): StationLocation {
  const station = GLOBAL_STATIONS.find(s => s.id === id);
  if (!station) return GLOBAL_STATIONS[0];
  return station;
}
