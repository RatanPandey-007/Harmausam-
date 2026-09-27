/**
 * Standalone Research Pipeline CLI Evaluator
 * Harmausam Meteorological Intelligence Platform — Phase 7 (Final Phase)
 *
 * Execution:
 *   npm run research:evaluate
 *   npx tsx scripts/run-research-pipeline.ts [--live] [--station <id>] [--variable <name>]
 *
 * Generates reproducible, auditable research comparisons across all 6 forecasting methods:
 *   1. ECMWF IFS
 *   2. NOAA GFS
 *   3. DWD ICON Global
 *   4. Equal-Weight Baseline (1/N)
 *   5. Fixed-Weight Baseline (Constrained OLS)
 *   6. Adaptive Context-Aware Blend
 */

import * as fs from 'fs';
import * as path from 'path';

// Automatically load .env for CLI research script
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        process.env[k] = v;
      }
    }
  }
} catch {}

import { runResearchPipeline } from '../src/lib/weather/pipeline';
import { GLOBAL_STATIONS } from '../src/core/data/stations';
import { WeatherVariable } from '../src/lib/weather/types';

async function main() {
  console.log('\n================================================================================');
  console.log('  HARMAUSAM METEOROLOGICAL INTELLIGENCE PLATFORM — PHASE 7 RESEARCH EVALUATOR  ');
  console.log('================================================================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const useLiveData = args.includes('--live');
  const stationArgIndex = args.indexOf('--station');
  const variableArgIndex = args.indexOf('--variable');

  const stationId = stationArgIndex !== -1 ? args[stationArgIndex + 1] : 'VIDP';
  const station = GLOBAL_STATIONS.find(s => s.id === stationId) || GLOBAL_STATIONS[0];

  const variable: WeatherVariable =
    variableArgIndex !== -1 ? (args[variableArgIndex + 1] as WeatherVariable) : 'temperature_2m';

  console.log(`[*] Initializing Research Pipeline...`);
  console.log(`    Target Station : ${station.name} (${station.id}) [${station.latitude}°, ${station.longitude}°]`);
  console.log(`    Target Variable: ${variable}`);
  console.log(`    Data Mode      : ${useLiveData ? 'LIVE NWP / METEOSTAT' : 'BENCHMARK ARCHIVE'}`);
  console.log(`    Lead Horizons  : 0h, 6h, 12h, 24h, 48h, 72h, 120h, 168h\n`);

  try {
    const result = await runResearchPipeline({
      station,
      variable,
      useLiveData,
      leadTimesHours: [0, 6, 12, 24, 48, 72, 120, 168],
    });

    // 1. Research Run Header
    console.log('--------------------------------------------------------------------------------');
    console.log('  1. RESEARCH RUN METADATA & TELEMETRY                                          ');
    console.log('--------------------------------------------------------------------------------');
    console.log(`  Run Identifier        : ${result.runId}`);
    console.log(`  Execution Timestamp   : ${result.generatedAt}`);
    console.log(`  Pipeline Version      : ${result.provenance.pipelineVersion}`);
    console.log(`  Training Period       : ${result.config.trainingPeriod.start} to ${result.config.trainingPeriod.end}`);
    console.log(`  Validation Period     : ${result.config.validationPeriod.start} to ${result.config.validationPeriod.end}`);
    console.log(`  Evaluation Period     : ${result.config.evaluationPeriod.start} to ${result.config.evaluationPeriod.end}`);
    console.log(`  Observation Network   : ${result.provenance.observations.source} (${result.provenance.observations.status})`);
    console.log(`  Total Forecast Points : ${result.dataQuality.totalForecastRecords}`);
    console.log(`  Aligned Timesteps     : ${result.dataQuality.alignedRecords}`);
    console.log(`  Valid Observations    : ${result.dataQuality.observationCount}`);
    console.log(`  Forecast Coverage     : ${result.dataQuality.forecastCoveragePercent}%\n`);

    // 2. Continuous Baseline Verification Table (Common Evaluation Cohort)
    console.log('--------------------------------------------------------------------------------');
    console.log('  2. COMMON EVALUATION COHORT PERFORMANCE (Continuous Verification)             ');
    console.log('--------------------------------------------------------------------------------');
    console.log('  Method                         |   MAE   |  RMSE   |  Bias   | Samples | Status');
    console.log('  -------------------------------+---------+---------+---------+---------+-------------');

    for (const b of result.baselineResults) {
      const name = b.methodLabel.padEnd(30, ' ');
      const mae = b.mae !== null ? b.mae.toFixed(3).padStart(7, ' ') : '    N/A';
      const rmse = b.rmse !== null ? b.rmse.toFixed(3).padStart(7, ' ') : '    N/A';
      const bias = b.bias !== null ? (b.bias >= 0 ? `+${b.bias.toFixed(3)}` : b.bias.toFixed(3)).padStart(7, ' ') : '    N/A';
      const samples = `${b.validSampleCount}/${b.sampleCount}`.padStart(7, ' ');
      const status = b.status.padEnd(11, ' ');
      console.log(`  ${name} | ${mae} | ${rmse} | ${bias} | ${samples} | ${status}`);
    }
    console.log('  ------------------------------------------------------------------------------\n');

    // 3. Lead Time Breakdown
    console.log('--------------------------------------------------------------------------------');
    console.log('  3. LEAD-TIME PERFORMANCE BREAKDOWN (MAE per Horizon)                          ');
    console.log('--------------------------------------------------------------------------------');
    console.log('  Horizon | ECMWF   | GFS     | ICON    | Equal Wt| Fixed Wt| Adaptive| Cohort');
    console.log('  --------+---------+---------+---------+---------+---------+---------+-------');
    for (const lt of result.leadTimeResults) {
      const h = `+${lt.leadTimeHours}h`.padEnd(6, ' ');
      const fmt = (v: number | null) => (v !== null ? v.toFixed(2).padStart(7, ' ') : '    N/A');
      const ecmwf = fmt(lt.methods.ECMWF.mae);
      const gfs = fmt(lt.methods.GFS.mae);
      const icon = fmt(lt.methods.ICON.mae);
      const eq = fmt(lt.methods.EQUAL_WEIGHT.mae);
      const fx = fmt(lt.methods.FIXED_WEIGHT.mae);
      const ad = fmt(lt.methods.ADAPTIVE_BLEND.mae);
      const n = String(lt.sampleCount).padStart(5, ' ');
      console.log(`  ${h}  | ${ecmwf} | ${gfs} | ${icon} | ${eq} | ${fx} | ${ad} | ${n}`);
    }
    console.log('  ------------------------------------------------------------------------------\n');

    // 4. Extreme Event Contingency Table
    console.log('--------------------------------------------------------------------------------');
    console.log('  4. EXTREME EVENT CONTINGENCY EVALUATION                                       ');
    console.log('--------------------------------------------------------------------------------');
    console.log('  Method            | Event Type      | TP | FP | FN | Precision | Recall |   F1   ');
    console.log('  ------------------+-----------------+----+----+----+-----------+--------+--------');

    for (const ev of result.extremeEventResults) {
      const m = ev.method.padEnd(16, ' ');
      const et = `${ev.eventType}`.padEnd(15, ' ');
      const tp = String(ev.tp).padStart(2, ' ');
      const fp = String(ev.fp).padStart(2, ' ');
      const fn = String(ev.fn).padStart(2, ' ');
      const prec = ev.precision !== null ? (ev.precision * 100).toFixed(1).padStart(7, ' ') + '%' : '    N/A';
      const rec = ev.recall !== null ? (ev.recall * 100).toFixed(1).padStart(5, ' ') + '%' : '    N/A';
      const f1 = ev.f1 !== null ? ev.f1.toFixed(3).padStart(6, ' ') : '   N/A';
      console.log(`  ${m}  | ${et} | ${tp} | ${fp} | ${fn} | ${prec}  | ${rec} | ${f1} `);
    }
    console.log('  ------------------------------------------------------------------------------\n');

    // 5. Scientific Auditing Results
    console.log('--------------------------------------------------------------------------------');
    console.log('  5. SCIENTIFIC AUDIT REPORT                                                    ');
    console.log('--------------------------------------------------------------------------------');
    const { weightsAudit, uncertaintyAudit, extremeEventAudit, leakageAudit, overallStatus } = result.auditReport;
    console.log(`  Adaptive Weights Normalization (sum=1.0) : [${weightsAudit.sumCheckPassed ? 'PASSED' : 'FAILED'}] (${weightsAudit.auditedCount} steps audited)`);
    console.log(`  Non-Negative Weight Constraints (w_i>=0) : [${weightsAudit.nonNegativePassed ? 'PASSED' : 'FAILED'}]`);
    console.log(`  Uncertainty Disagreement Verification   : [${uncertaintyAudit.passed ? 'PASSED' : 'FAILED'}] (No fake probabilities)`);
    console.log(`  Zero-Denominator Contingency Protection  : [${extremeEventAudit.zeroDenominatorSafe ? 'PASSED' : 'FAILED'}]`);
    console.log(`  Temporal Data Leakage Prevention         : [${leakageAudit.passed ? 'PASSED' : 'FAILED'}] (Disjoint train/eval)`);
    console.log(`  Overall Pipeline Audit Status            : [${overallStatus}]\n`);

    if (result.auditReport.weightsAudit.violations.length > 0) {
      console.log('  [!] Weight Violations:');
      result.auditReport.weightsAudit.violations.forEach(v => console.log(`      - ${v}`));
    }

    // 6. Scientific Limitations & Implementation Status
    console.log('--------------------------------------------------------------------------------');
    console.log('  6. SCIENTIFIC LIMITATIONS & PROVENANCE TRANSPARENCY                           ');
    console.log('--------------------------------------------------------------------------------');
    result.limitations.forEach((lim, i) => {
      console.log(`  [${i + 1}] ${lim}`);
    });
    console.log('\n  Operational Component Status:');
    for (const [comp, stat] of Object.entries(result.implementationStatus)) {
      console.log(`    - ${comp.padEnd(20, ' ')}: ${stat}`);
    }
    console.log('================================================================================\n');

    if (!result.success) {
      console.error('[FAILED] Research pipeline completed with audit or verification failures.');
      process.exit(1);
    } else {
      console.log('[SUCCESS] Research pipeline executed successfully. All scientific audits passed.\n');
      process.exit(0);
    }
  } catch (err: any) {
    console.error('\n[FATAL ERROR] Research pipeline execution failed:');
    console.error(err.message || err);
    console.error(err.stack || '');
    process.exit(1);
  }
}

main();
