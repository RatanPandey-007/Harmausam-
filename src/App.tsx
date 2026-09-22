import React, { useState, useEffect } from 'react';
import { 
  Navbar, 
  ActiveTab 
} from './components/layout/Navbar';
import { Hero } from './components/hero/Hero';
import { OverviewSection } from './components/overview/OverviewSection';
import { ForecastExplorer } from './components/explorer/ForecastExplorer';
import { BlendingWorkbench } from './components/blending/BlendingWorkbench';
import { VerificationLab } from './components/verification/VerificationLab';
import { ExtremeEventMonitor } from './components/events/ExtremeEventMonitor';
import { ExplainabilityStudio } from './components/explainability/ExplainabilityStudio';
import { SystemHealth } from './components/health/SystemHealth';
import { MethodologyModal } from './components/methodology/MethodologyModal';

import { 
  WeatherVariable, 
  StationLocation 
} from './core/types';
import { GLOBAL_STATIONS } from './core/data/stations';
import { 
  ForecastingPipeline, 
  PipelineExecutionResult 
} from './core/services/ForecastingPipeline';
import { 
  Loader2, 
  AlertCircle, 
  CloudSun, 
  ShieldCheck, 
  Github, 
  BookOpen 
} from 'lucide-react';

export const App: React.FC = () => {
  // Global Operational State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedStation, setSelectedStation] = useState<StationLocation>(GLOBAL_STATIONS[0]); // New Delhi
  const [selectedVariable, setSelectedVariable] = useState<WeatherVariable>('temperature_2m');
  const [leadTimeHours, setLeadTimeHours] = useState<number>(24);
  const [useLiveData, setUseLiveData] = useState<boolean>(false); // Defaults to peer-grade demonstration benchmark
  
  // Pipeline Results & Telemetry
  const [pipelineData, setPipelineData] = useState<PipelineExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Methodology Modal State
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Re-run forecasting pipeline whenever station, variable, lead time, or live toggle changes
  useEffect(() => {
    let isCancelled = false;

    async function executePipeline() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await ForecastingPipeline.run({
          station: selectedStation,
          variable: selectedVariable,
          leadTimeHours,
          useLiveData,
        });

        if (!isCancelled) {
          setPipelineData(result);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Pipeline execution error:', err);
        if (!isCancelled) {
          setError(err.message || 'Failed to execute forecasting pipeline');
          setIsLoading(false);
        }
      }
    }

    executePipeline();

    return () => {
      isCancelled = true;
    };
  }, [selectedStation, selectedVariable, leadTimeHours, useLiveData]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      
      {/* Top Professional Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedStation={selectedStation}
        setSelectedStation={setSelectedStation}
        useLiveData={useLiveData}
        setUseLiveData={setUseLiveData}
        isDemonstrationData={pipelineData?.isDemonstrationData ?? true}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Hero Section (Presented on Overview tab or as editorial intro) */}
      {activeTab === 'overview' && (
        <Hero
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
        />
      )}

      {/* Main Scientific Application Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isLoading && !pipelineData ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-center font-mono">
              <p className="text-sm font-bold text-slate-200">Executing Meteorological Blending Pipeline</p>
              <p className="text-xs text-slate-400 mt-1">
                Aligning NWP & AI grids • Evaluating Weather Regimes • Calculating Bayesian Weights...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 space-y-3 font-mono">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span className="font-bold">Pipeline Error: {error}</span>
            </div>
            <p className="text-xs text-rose-300">
              Please check connection settings or switch to the Demonstration Dataset.
            </p>
          </div>
        ) : pipelineData ? (
          <div>
            {/* SECTION A: OVERVIEW */}
            {activeTab === 'overview' && (
              <OverviewSection
                currentResult={pipelineData.blendedResult}
                station={selectedStation}
                leadTimeHours={leadTimeHours}
                selectedVariable={selectedVariable}
                setSelectedVariable={setSelectedVariable}
                alerts={pipelineData.alerts}
                onNavigate={(tab) => setActiveTab(tab)}
                isDemonstrationData={pipelineData.isDemonstrationData}
              />
            )}

            {/* SECTION B: FORECAST EXPLORER */}
            {activeTab === 'explorer' && (
              <ForecastExplorer
                currentResult={pipelineData.blendedResult}
                timeSeriesTrajectory={pipelineData.timeSeriesTrajectory}
                station={selectedStation}
                setStation={setSelectedStation}
                selectedVariable={selectedVariable}
                setSelectedVariable={setSelectedVariable}
                leadTimeHours={leadTimeHours}
                setLeadTimeHours={setLeadTimeHours}
                isDemonstrationData={pipelineData.isDemonstrationData}
              />
            )}

            {/* SECTION C: AI BLENDING WORKBENCH */}
            {activeTab === 'blending' && (
              <BlendingWorkbench
                currentResult={pipelineData.blendedResult}
                selectedVariable={selectedVariable}
                leadTimeHours={leadTimeHours}
              />
            )}

            {/* SECTION D: VERIFICATION RESEARCH LAB */}
            {activeTab === 'verification' && (
              <VerificationLab
                verification={pipelineData.verification}
                selectedVariable={selectedVariable}
              />
            )}

            {/* SECTION E: EXTREME EVENT MONITOR */}
            {activeTab === 'events' && (
              <ExtremeEventMonitor
                alerts={pipelineData.alerts}
                station={selectedStation}
                isDemonstrationData={pipelineData.isDemonstrationData}
              />
            )}

            {/* SECTION F: EXPLAINABILITY STUDIO */}
            {activeTab === 'explain' && (
              <ExplainabilityStudio
                explanation={pipelineData.explanation}
                context={pipelineData.blendedResult.context}
                weights={pipelineData.blendedResult.adaptiveWeights}
                individualForecasts={pipelineData.blendedResult.individualForecasts}
                selectedVariable={selectedVariable}
                leadTimeHours={leadTimeHours}
              />
            )}

            {/* SECTION G: SYSTEM & DATA HEALTH */}
            {activeTab === 'health' && (
              <SystemHealth
                providerHealth={pipelineData.providerHealth}
                isDemonstrationData={pipelineData.isDemonstrationData}
                onRefresh={() => {
                  // Force pipeline re-run
                  setLeadTimeHours(prev => prev);
                }}
                isLoading={isLoading}
              />
            )}
          </div>
        ) : null}

      </main>

      {/* Scientific Footer */}
      <footer className="border-t border-slate-800 bg-[#0E1422] py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <CloudSun className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">HARMAUSAM</span>
            <span className="text-slate-600">|</span>
            <span>Explainable Context-Aware Hybrid AI–NWP Weather Forecast Blending</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span>Sources: ECMWF IFS • NCEP GFS • DWD ICON • DeepMind GraphCast</span>
            <button 
              onClick={() => setIsMethodologyOpen(true)}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              <span>Scientific Documentation</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

    </div>
  );
};
