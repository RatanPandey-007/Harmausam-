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
  AlertCircle 
} from 'lucide-react';

export const App: React.FC = () => {
  // Global Operational State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedStation, setSelectedStation] = useState<StationLocation>(GLOBAL_STATIONS[0]); // New Delhi
  const [selectedVariable, setSelectedVariable] = useState<WeatherVariable>('temperature_2m');
  const [leadTimeHours, setLeadTimeHours] = useState<number>(24);
  const [useLiveData, setUseLiveData] = useState<boolean>(false);
  
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
    <div className="min-h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col font-sans selection:bg-white/20 selection:text-white">
      
      {/* Minimal Top Navigation */}
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

      {/* Full-Viewport Editorial Hero (Shown on Overview tab) */}
      {activeTab === 'overview' && (
        <Hero
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
        />
      )}

      {/* Main Product Interface Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {isLoading && !pipelineData ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <div className="text-center font-mono">
              <p className="text-xs uppercase tracking-widest text-slate-400">EXECUTING FORECAST PIPELINE</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Ingesting NWP & AI runs • Classifying Weather Regimes • Optimizing Bayesian Weights
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 rounded border border-rose-500/30 bg-[#0E1015] text-rose-200 space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="font-bold">Pipeline Error: {error}</span>
            </div>
            <p className="text-slate-400">
              Please check connection settings or toggle back to the Benchmark Dataset.
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

            {/* SECTION G: SYSTEM HEALTH */}
            {activeTab === 'health' && (
              <SystemHealth
                providerHealth={pipelineData.providerHealth}
                isDemonstrationData={pipelineData.isDemonstrationData}
                onRefresh={() => {
                  setLeadTimeHours(prev => prev);
                }}
                isLoading={isLoading}
              />
            )}
          </div>
        ) : null}

      </main>

      {/* Minimalist Scientific Footer */}
      <footer className="hairline-t bg-[#08090C] py-10 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4">
            <span className="font-bold tracking-[0.16em] text-white">HARMAUSAM</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="text-slate-400">Context-Aware Hybrid AI–NWP Weather Forecast Blending</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
            <span>MODELS: ECMWF IFS • GFS • ICON • GRAPHCAST</span>
            <button 
              onClick={() => setIsMethodologyOpen(true)}
              className="text-slate-300 hover:text-white transition-colors underline underline-offset-4"
            >
              Scientific Protocol
            </button>
            <button 
              onClick={() => setActiveTab('health')}
              className="text-slate-300 hover:text-white transition-colors"
            >
              System Health
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
