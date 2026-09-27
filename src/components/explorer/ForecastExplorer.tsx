import React, { useState } from 'react';
import { 
  StationLocation, 
  WeatherVariable, 
  ForecastSourceId, 
  BlendedForecastResult 
} from '../../core/types';
import { ForecastControls, ExplorerDisplayMode } from './ForecastControls';
import { ForecastMap } from './ForecastMap';
import { ForecastTimeline } from './ForecastTimeline';
import { ForecastComparison } from './ForecastComparison';
import { ForecastBlendedView } from './ForecastBlendedView';
import { ForecastMetadata } from './ForecastMetadata';

interface ForecastExplorerProps {
  currentResult: BlendedForecastResult;
  timeSeriesTrajectory: BlendedForecastResult[];
  station: StationLocation;
  setStation: (station: StationLocation) => void;
  selectedVariable: WeatherVariable;
  setSelectedVariable: (v: WeatherVariable) => void;
  leadTimeHours: number;
  setLeadTimeHours: (lead: number) => void;
  isDemonstrationData: boolean;
  isLoading?: boolean;
}

export const ForecastExplorer: React.FC<ForecastExplorerProps> = ({
  currentResult,
  timeSeriesTrajectory,
  station,
  setStation,
  selectedVariable,
  setSelectedVariable,
  leadTimeHours,
  setLeadTimeHours,
  isDemonstrationData,
  isLoading = false,
}) => {
  const [displayMode, setDisplayMode] = useState<ExplorerDisplayMode>('BLENDED');
  const [selectedSource, setSelectedSource] = useState<ForecastSourceId>('ECMWF');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  return (
    <div className="space-y-8 py-2">
      
      {/* 1. Forecast Controls Toolbar (Location, Variable Layers, Display Modes) */}
      <ForecastControls
        station={station}
        setStation={setStation}
        selectedVariable={selectedVariable}
        setSelectedVariable={setSelectedVariable}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        leadTimeHours={leadTimeHours}
      />

      {/* 2. Dominant Geospatial Weather Map Workspace (65–75% visual prominence) */}
      <ForecastMap
        station={station}
        setStation={setStation}
        selectedVariable={selectedVariable}
        displayMode={displayMode}
        selectedSource={selectedSource}
        leadTimeHours={leadTimeHours}
        currentResult={currentResult}
        timeSeriesTrajectory={timeSeriesTrajectory}
        isDemonstrationData={isDemonstrationData}
        isPipelineLoading={isLoading}
      />

      {/* 3. Operational Timeline Scrubber */}
      <ForecastTimeline
        leadTimeHours={leadTimeHours}
        setLeadTimeHours={setLeadTimeHours}
        validTimestamp={currentResult.timestamp}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {/* 4. Dynamic Display Deck based on Mode (Blended / Comparison / Single) */}
      {displayMode === 'BLENDED' && (
        <ForecastBlendedView
          currentResult={currentResult}
          selectedVariable={selectedVariable}
          leadTimeHours={leadTimeHours}
        />
      )}

      {displayMode === 'COMPARISON' && (
        <ForecastComparison
          currentResult={currentResult}
          timeSeriesTrajectory={timeSeriesTrajectory}
          selectedVariable={selectedVariable}
          leadTimeHours={leadTimeHours}
        />
      )}

      {displayMode === 'DISAGREEMENT' && (
        <div className="space-y-6">
          <div className="p-6 rounded border border-rose-500/20 bg-[#0E0F15] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <div className="text-[10px] text-rose-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                MULTI-MODEL DIVERGENCE DIAGNOSTICS (σ)
              </div>
              <div className="text-xl font-bold text-white font-sans mt-1">
                Point-in-Time Spread: σ = {currentResult.modelSpread.toFixed(2)}
              </div>
              <p className="text-slate-400 mt-1 max-w-xl font-sans text-xs">
                The map displays epistemic uncertainty across geographic space. Areas in amber/rose designate synoptic fronts where NWP physics and AI GraphCast differ significantly.
              </p>
            </div>

            <div className="text-right text-slate-400">
              <div>Detected Regime: <strong className="text-white">{currentResult.context.detectedRegime}</strong></div>
              <div>90% Confidence Interval: <strong className="text-white">[{currentResult.uncertaintyInterval.lower90.toFixed(1)}, {currentResult.uncertaintyInterval.upper90.toFixed(1)}]</strong></div>
            </div>
          </div>

          <ForecastComparison
            currentResult={currentResult}
            timeSeriesTrajectory={timeSeriesTrajectory}
            selectedVariable={selectedVariable}
            leadTimeHours={leadTimeHours}
          />
        </div>
      )}

      {displayMode === 'SINGLE' && (
        <div className="space-y-6">
          <div className="p-6 rounded border border-white/10 bg-[#0D0F15] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">SINGLE SYSTEM FOCUS</div>
              <div className="text-xl font-bold text-white font-sans mt-1">
                {selectedSource} Output: {currentResult.individualForecasts[selectedSource].toFixed(1)} {selectedVariable === 'temperature_2m' ? '°C' : selectedVariable === 'precipitation' ? 'mm' : selectedVariable === 'wind_speed_10m' ? 'm/s' : selectedVariable === 'relative_humidity_2m' ? '%' : 'hPa'}
              </div>
              <div className="text-slate-400 mt-1">
                Regime RMSE: <strong className="text-white">{currentResult.adaptiveWeights[selectedSource]?.historicalRmseInRegime.toFixed(2)}</strong> | Dynamic Weight: <strong className="text-white">{Math.round((currentResult.adaptiveWeights[selectedSource]?.weight ?? 0.25) * 100)}%</strong>
              </div>
            </div>

            <div className="text-right text-slate-400">
              <div>Adaptive Blend Consensus: <strong className="text-white">{currentResult.adaptiveBlendedForecast.toFixed(1)}</strong></div>
              <div>Delta from Blend: <strong className="text-white">{(currentResult.individualForecasts[selectedSource] - currentResult.adaptiveBlendedForecast > 0 ? '+' : '') + (currentResult.individualForecasts[selectedSource] - currentResult.adaptiveBlendedForecast).toFixed(1)}</strong></div>
            </div>
          </div>

          <ForecastComparison
            currentResult={currentResult}
            timeSeriesTrajectory={timeSeriesTrajectory}
            selectedVariable={selectedVariable}
            leadTimeHours={leadTimeHours}
          />
        </div>
      )}

      {/* 5. Scientific Metadata Area & Data Honesty Badge */}
      <ForecastMetadata
        currentResult={currentResult}
        selectedVariable={selectedVariable}
        displayMode={displayMode}
        selectedSource={selectedSource}
        isDemonstrationData={isDemonstrationData}
      />

    </div>
  );
};
