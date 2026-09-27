import React from 'react';
import { Sliders, Clock, Info, ShieldAlert } from 'lucide-react';
import { ExtremeEventAlert, WeatherVariable } from '../../core/types';
import { EVENT_THRESHOLDS, EventThresholdDefinition } from '../../core/events/ExtremeEventEngine';

interface EventThresholdControlsProps {
  selectedEventType: ExtremeEventAlert['eventType'];
  onSelectEventType: (t: ExtremeEventAlert['eventType']) => void;
  activeDef: EventThresholdDefinition;
  activeThreshold: number;
  onSelectThreshold: (val: number) => void;
  durationPeriods: number;
  onChangeDuration: (periods: number) => void;
  onSetVariable?: (v: WeatherVariable) => void;
  stationCode: string;
}

export const EventThresholdControls: React.FC<EventThresholdControlsProps> = ({
  selectedEventType,
  onSelectEventType,
  activeDef,
  activeThreshold,
  onSelectThreshold,
  durationPeriods,
  onChangeDuration,
  onSetVariable,
  stationCode,
}) => {
  return (
    <div className="p-5 rounded-xl border border-white/10 bg-[#0D0F15] space-y-5">
      {/* Category Selection Rail */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 hairline-b pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {EVENT_THRESHOLDS.map((def) => {
            const isActive = selectedEventType === def.eventType;
            return (
              <button
                key={def.eventType}
                onClick={() => {
                  onSelectEventType(def.eventType);
                  if (onSetVariable) {
                    onSetVariable(def.variable);
                  }
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{def.eventType.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Operational Context Tag */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
          <span>MONITORED FIELD:</span>
          <span className="text-white font-semibold">{activeDef.variable}</span>
          <span className="text-slate-600">|</span>
          <span>STATION WMO:</span>
          <span className="text-slate-300 font-mono">{stationCode}</span>
        </div>
      </div>

      {/* Threshold & Duration Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
        {/* A. Configurable Threshold Tier Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>EVENT THRESHOLD (τ):</span>
            </span>
            <strong className="text-white font-mono">{activeThreshold.toFixed(1)} {activeDef.unit}</strong>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {activeDef.selectableThresholds.map((t) => {
              const isSelected = activeThreshold === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => onSelectThreshold(t.value)}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-mono text-left transition-colors border ${
                    isSelected
                      ? 'border-white bg-white/15 text-white font-bold'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold">{t.value.toFixed(1)} {activeDef.unit}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                    {t.label.split(' (')[1]?.replace(')', '') || 'Operational Tier'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* B. Configurable Duration Persistence Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>DURATION FILTER (N TIMESTEPS):</span>
            </span>
            <strong className="text-white font-mono">
              {durationPeriods} {durationPeriods === 1 ? 'Period' : 'Consecutive'}
            </strong>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { periods: 1, label: 'Instantaneous', desc: '>=1 forecast step' },
              { periods: 2, label: 'Sustained', desc: '>=6h continuous' },
              { periods: 3, label: 'Persistent', desc: '>=12h continuous' }
            ].map((d) => {
              const isSelected = durationPeriods === d.periods;
              return (
                <button
                  key={d.periods}
                  onClick={() => onChangeDuration(d.periods)}
                  className={`px-2 py-1.5 rounded text-[11px] font-mono text-center transition-colors border ${
                    isSelected
                      ? 'border-white bg-white/15 text-white font-bold'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  <div>N = {d.periods}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {d.periods === 1 ? 'Single' : `${d.periods * 3}h+`}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] font-mono text-slate-500 leading-tight">
            Filters out single-timestep convective noise by requiring persistent threshold exceedance across timesteps.
          </p>
        </div>

        {/* C. Meteorological Standard Reference */}
        <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
            <Info className="w-3 h-3 text-sky-400" />
            <span className="font-semibold">METEOROLOGICAL STANDARD REFERENCE</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {activeDef.description}
          </p>
          <div className="text-[10px] text-slate-400 hairline-t pt-1.5 font-mono truncate">
            CRITERIA: {activeDef.wmoStandardReference}
          </div>
        </div>
      </div>
    </div>
  );
};
