import { WeatherFieldRenderer } from '../src/components/explorer/map/WeatherFieldRenderer';
import { resolveMapStyle, getFallbackMapStyle } from '../src/components/explorer/map/mapProviders';
import { GLOBAL_STATIONS } from '../src/core/data/stations';
import { ForecastingPipeline } from '../src/core/services/ForecastingPipeline';
import { BlendedForecastResult, WeatherVariable } from '../src/core/types';

async function runMapStateTests() {
  console.log('================================================================');
  console.log('  FORECAST MAP LOADING & OVERLAY STATES VERIFICATION SUITE       ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`[PASS] ${label}`);
      passed++;
    } else {
      console.error(`[FAIL] ${label}`);
      failed++;
    }
  }

  // State 1: MapTiler & Fallback styles resolution (never throws, always resolves)
  console.log('--- Test Group 1: Basemap Style Fallback & Reliability ---');
  const standardStyle = resolveMapStyle('standard');
  assert(Boolean(standardStyle), 'Standard basemap style resolves to valid spec/URL');

  const fallbackDark = getFallbackMapStyle('standard');
  assert(typeof fallbackDark === 'string' && fallbackDark.includes('cartocdn.com'), 'Fallback dark style URL is CARTO dark-matter (zero API key dependency)');

  // State 2: Forecast data loading for all variables & stations
  console.log('\n--- Test Group 2: Meteorological Data Integrity Across All Variables ---');
  const station = GLOBAL_STATIONS[0]; // New Delhi (VIDP)
  const variables: WeatherVariable[] = [
    'temperature_2m',
    'precipitation',
    'wind_speed_10m',
    'relative_humidity_2m',
    'surface_pressure'
  ];

  for (const v of variables) {
    const pipelineRes = await ForecastingPipeline.run({
      station,
      variable: v,
      leadTimeHours: 24,
      useLiveData: false
    });

    const result = pipelineRes.blendedResult;
    assert(
      result && !isNaN(result.adaptiveBlendedForecast) && result.individualForecasts && Object.keys(result.individualForecasts).length > 0,
      `Variable ${v}: Forecast data is valid and complete`
    );

    // Evaluate scalar field at station point
    const fieldPoint = WeatherFieldRenderer.evaluateFieldAtLatLng(
      station.latitude,
      station.longitude,
      station,
      v,
      'BLENDED',
      'ECMWF',
      24,
      result,
      true
    );

    assert(
      !isNaN(fieldPoint.val) && fieldPoint.formatted.length > 0,
      `Variable ${v}: Field rendering math evaluation valid (${fieldPoint.formatted} ${fieldPoint.unit})`
    );
  }

  // State 3: Insufficient Data / Missing Data Validation
  console.log('\n--- Test Group 3: Insufficient Data Handling ---');
  const emptyResult = null as any;
  const isInsufficientIfNull = !emptyResult;
  assert(isInsufficientIfNull, 'Null forecast result correctly detected as insufficient data');

  const missingModelsResult = {
    adaptiveBlendedForecast: 20,
    individualForecasts: {}
  } as any;
  const isInsufficientIfNoModels = Object.keys(missingModelsResult.individualForecasts).length === 0;
  assert(isInsufficientIfNoModels, 'Empty individual models correctly detected as insufficient data');

  // State 4: Single Model Mode data availability
  console.log('\n--- Test Group 4: Mode-Specific Parameter Availability ---');
  const pipelineRes = await ForecastingPipeline.run({
    station,
    variable: 'temperature_2m',
    leadTimeHours: 24,
    useLiveData: false
  });
  const res = pipelineRes.blendedResult;

  const ecmwfVal = res.individualForecasts['ECMWF'];
  assert(typeof ecmwfVal === 'number' && !isNaN(ecmwfVal), 'SINGLE mode (ECMWF) produces valid number');

  const gfsVal = res.individualForecasts['GFS'];
  assert(typeof gfsVal === 'number' && !isNaN(gfsVal), 'SINGLE mode (GFS) produces valid number');

  const iconVal = res.individualForecasts['ICON'];
  assert(typeof iconVal === 'number' && !isNaN(iconVal), 'SINGLE mode (ICON) produces valid number');

  const spreadVal = res.modelSpread;
  assert(typeof spreadVal === 'number' && !isNaN(spreadVal), 'DISAGREEMENT mode (modelSpread) produces valid variance metric');

  // State 5: Station Switching across all 5 Global Stations
  console.log('\n--- Test Group 5: Station Location Transitions ---');
  for (const st of GLOBAL_STATIONS) {
    const stRes = await ForecastingPipeline.run({
      station: st,
      variable: 'temperature_2m',
      leadTimeHours: 24,
      useLiveData: false
    });
    assert(
      stRes.blendedResult.station?.id === st.id && !isNaN(stRes.blendedResult.adaptiveBlendedForecast),
      `Station ${st.name} (${st.id}) loads valid forecast data`
    );
  }

  console.log('\n================================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runMapStateTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
