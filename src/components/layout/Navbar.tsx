import React from 'react';
import { 
  CloudSun, 
  Layers, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { StationLocation } from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export type ActiveTab = 
  | 'overview' 
  | 'explorer' 
  | 'blending' 
  | 'verification' 
  | 'events' 
  | 'explain' 
  | 'health';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedStation: StationLocation;
  setSelectedStation: (station: StationLocation) => void;
  useLiveData: boolean;
  setUseLiveData: (val: boolean) => void;
  isDemonstrationData: boolean;
  onOpenMethodology: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedStation,
  setSelectedStation,
  useLiveData,
  setUseLiveData,
  isDemonstrationData,
  onOpenMethodology,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-md">
      {/* Top Telemetry & Data Honesty Strip */}
      <div className="flex h-7 items-center justify-between px-4 lg:px-8 border-b border-slate-800/40 text-[11px] font-mono text-slate-400 bg-slate-950/60">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isDemonstrationData ? 'bg-amber-400 opacity-75' : 'bg-emerald-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isDemonstrationData ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-slate-300">
              {isDemonstrationData ? (
                <span className="text-amber-400 flex items-center gap-1">
                  DEMONSTRATION DATASET <span className="text-slate-500">•</span> Peer-grade historical test suite
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  OPERATIONAL STREAM <span className="text-slate-500">•</span> Live Open-Meteo Multi-Model Ensemble
                </span>
              )}
            </span>
          </div>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">
            MODELS: <span className="text-slate-200">ECMWF IFS (9km)</span>, <span className="text-slate-200">GFS (13km)</span>, <span className="text-slate-200">ICON (13km)</span>, <span className="text-slate-200">GraphCast AI (0.25°)</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-slate-400">
            SPLIT: <span className="text-cyan-300">Chronological Block (No Leakage)</span>
          </span>
          <button
            onClick={onOpenMethodology}
            className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Methodology</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation & Controls Bar */}
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Brand / Title */}
        <div className="flex items-center space-x-3">
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 group-hover:border-cyan-500/60 transition-all shadow-inner">
              <CloudSun className="h-5 w-5 text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-sans">HARMAUSAM</span>
                <Badge variant="scientific" className="hidden sm:inline-flex text-[9px] py-0 px-1.5 border-cyan-500/30 text-cyan-400">
                  v1.0 RESEARCH
                </Badge>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:block">
                Context-Aware AI–NWP Forecast Blending
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'overview' 
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'explorer' 
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Forecast Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('blending')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'blending' 
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Blending</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'verification' 
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verification</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'events' 
                ? 'bg-slate-800 text-rose-300 shadow-sm border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Extreme Events</span>
          </button>

          <button
            onClick={() => setActiveTab('explain')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'explain' 
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explainability</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'health' 
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>System Health</span>
          </button>
        </nav>

        {/* Global Controls: Station Selector & Live Toggle */}
        <div className="flex items-center space-x-3">
          {/* Station Selector */}
          <div className="relative flex items-center">
            <MapPin className="absolute left-2.5 h-3.5 w-3.5 text-cyan-400 pointer-events-none" />
            <select
              value={selectedStation.id}
              onChange={(e) => {
                const s = GLOBAL_STATIONS.find(st => st.id === e.target.value);
                if (s) setSelectedStation(s);
              }}
              className="h-8 pl-8 pr-3 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md font-sans focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer hover:bg-slate-800 transition-colors"
            >
              {GLOBAL_STATIONS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.country})
                </option>
              ))}
            </select>
          </div>

          {/* Live vs Benchmark Toggle */}
          <button
            onClick={() => setUseLiveData(!useLiveData)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              useLiveData 
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle between live Open-Meteo multi-model feed and research verification benchmark dataset"
          >
            <Radio className={`w-3 h-3 ${useLiveData ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{useLiveData ? 'Live NWP' : 'Demo Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-slate-800/60 space-x-2 scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`whitespace-nowrap px-3 py-1 rounded ${activeTab === 'overview' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`whitespace-nowrap px-3 py-1 rounded ${activeTab === 'explorer' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Forecast Explorer
        </button>
        <button
          onClick={() => setActiveTab('blending')}
          className={`whitespace-nowrap px-3 py-1 rounded ${activeTab === 'blending' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          AI Blending
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`whitespace-nowrap px-3 py-1 rounded ${activeTab === 'verification' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Verification
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`whitespace-nowrap px-3 py-1 rounded ${activeTab === 'events' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
        >
          Extreme Events
        </button>
        <button
          onClick={() => setActiveTab('explain')}
          className={`whitespace-nowrap px-3 py-1 rounded ${activeTab === 'explain' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Explainability
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`whitespace-nowrap px-3 py-1 rounded ${activeTab === 'health' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          System Health
        </button>
      </div>
    </header>
  );
};
