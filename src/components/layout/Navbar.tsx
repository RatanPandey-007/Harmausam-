import React, { useState } from 'react';
import { 
  ChevronDown, 
  Menu, 
  X, 
  Radio, 
  BookOpen, 
  Compass
} from 'lucide-react';
import { StationLocation } from '../../core/types';
import { GLOBAL_STATIONS } from '../../core/data/stations';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'explorer', label: 'Forecast' },
    { id: 'blending', label: 'Blend' },
    { id: 'verification', label: 'Verification' },
    { id: 'events', label: 'Extreme Events' },
    { id: 'explain', label: 'Diagnostics' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#08090C]/90 backdrop-blur-md hairline-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left Brand Identity: Tesla/SpaceX simplicity */}
          <div 
            onClick={() => { setActiveTab('overview'); }}
            className="flex flex-col cursor-pointer select-none group"
          >
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-[0.16em] text-white font-sans uppercase">
                HARMAUSAM
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-[0.24em] text-slate-400 uppercase">
              WEATHER INTELLIGENCE
            </span>
          </div>

          {/* Center Navigation Links: Restrained, generous whitespace */}
          <nav className="hidden md:flex items-center space-x-8 text-[13px] font-medium tracking-tight">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`transition-colors py-1 ${
                    isActive 
                      ? 'text-white border-b-2 border-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            <button
              onClick={onOpenMethodology}
              className="text-slate-400 hover:text-slate-200 transition-colors py-1 flex items-center space-x-1"
            >
              <span>Methodology</span>
            </button>
          </nav>

          {/* Right Controls: Region Selector + Subtle Mode Indicator */}
          <div className="hidden sm:flex items-center space-x-4">
            
            {/* Minimal Region Dropdown */}
            <div className="relative">
              <select
                value={selectedStation.id}
                onChange={(e) => {
                  const st = GLOBAL_STATIONS.find(s => s.id === e.target.value);
                  if (st) setSelectedStation(st);
                }}
                className="appearance-none bg-transparent hover:bg-white/5 border border-white/10 text-white text-xs rounded px-3 py-1.5 pr-7 focus:outline-none focus:border-white/30 cursor-pointer font-sans transition-colors"
              >
                {GLOBAL_STATIONS.map((st) => (
                  <option key={st.id} value={st.id} className="bg-[#0E1015] text-white">
                    {st.name.split(' (')[0]} ({st.country})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Unobtrusive Data Feed Toggle */}
            <button
              onClick={() => setUseLiveData(!useLiveData)}
              className={`flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
                useLiveData 
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' 
                  : 'border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
              title="Toggle Live Open-Meteo multi-model feed or historical benchmark dataset"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${useLiveData ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{useLiveData ? 'LIVE FEED' : 'BENCHMARK'}</span>
            </button>

          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#08090C] hairline-b px-4 py-4 space-y-3 text-sm">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 ${
                activeTab === link.id ? 'text-white font-semibold' : 'text-slate-400'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              onOpenMethodology();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-slate-400"
          >
            Methodology
          </button>

          <div className="pt-3 hairline-t flex items-center justify-between">
            <select
              value={selectedStation.id}
              onChange={(e) => {
                const st = GLOBAL_STATIONS.find(s => s.id === e.target.value);
                if (st) setSelectedStation(st);
              }}
              className="bg-transparent border border-white/10 text-white text-xs rounded px-2.5 py-1.5"
            >
              {GLOBAL_STATIONS.map((st) => (
                <option key={st.id} value={st.id} className="bg-[#0E1015] text-white">
                  {st.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setUseLiveData(!useLiveData)}
              className="text-xs font-mono text-slate-300 border border-white/10 px-2 py-1 rounded"
            >
              {useLiveData ? 'LIVE NWP' : 'BENCHMARK'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
