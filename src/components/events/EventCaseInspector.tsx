import React from 'react';
import { HistoricalEventCase, EventThresholdDefinition } from '../../core/events/ExtremeEventEngine';

interface EventCaseInspectorProps {
  cases: HistoricalEventCase[];
  inspectedCase: HistoricalEventCase | null;
  onSelectCase: (id: string) => void;
  activeDef: EventThresholdDefinition;
}

export const EventCaseInspector: React.FC<EventCaseInspectorProps> = ({
  cases,
  inspectedCase,
  onSelectCase,
  activeDef,
}) => {
  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#0D0F15] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 hairline-b pb-4">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
            CHRONOLOGICAL EVENT LOG
          </div>
          <h3 className="text-lg font-bold text-white font-sans">
            Evaluated Significant Weather Events & Ground Outcomes
          </h3>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
          SHOWING TOP {cases.length} HISTORICAL CASES
        </div>
      </div>

      {/* Case List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="hairline-b text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="py-2 pr-3">Timestamp</th>
              <th className="py-2 px-3">Lead</th>
              <th className="py-2 px-3">Synoptic Regime</th>
              <th className="py-2 px-3 text-right">Predicted (Blend)</th>
              <th className="py-2 px-3 text-right">Observed (Truth)</th>
              <th className="py-2 px-3 text-center">Consensus</th>
              <th className="py-2 px-3 text-center">Outcome</th>
              <th className="py-2 pl-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cases.map((c) => {
              const isSelected = inspectedCase?.id === c.id;

              let badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white/5 text-slate-400">CORRECT NEGATIVE</span>;
              if (c.classification === 'TRUE_POSITIVE') {
                badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">HIT (TP)</span>;
              } else if (c.classification === 'FALSE_POSITIVE') {
                badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">FALSE ALARM (FP)</span>;
              } else if (c.classification === 'FALSE_NEGATIVE') {
                badge = <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">MISS (FN)</span>;
              }

              return (
                <tr 
                  key={c.id} 
                  className={`transition-colors cursor-pointer ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => onSelectCase(c.id)}
                >
                  <td className="py-2.5 pr-3 text-slate-300">
                    {new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: '2-digit' })}{' '}
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 text-white font-semibold">
                    +{c.leadTimeHours}h
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {c.regime}
                  </td>
                  <td className="py-2.5 px-3 text-right text-white font-bold">
                    {c.predictedValue.toFixed(1)} {activeDef.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {c.observedValue.toFixed(1)} {activeDef.unit}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-300">
                    {c.consensusCount} / 4 systems
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {badge}
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c.id);
                      }}
                      className="text-[10px] text-sky-400 hover:text-sky-300 uppercase font-semibold"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Inspector Panel */}
      {inspectedCase && (
        <div className="p-4 rounded-lg border border-white/10 bg-black/60 space-y-3 font-mono text-xs hairline-t pt-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider">
              DOSSIER INSPECTOR: {inspectedCase.id}
            </span>
            <span>VALID TIME: {new Date(inspectedCase.timestamp).toUTCString()}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded bg-white/5 border border-white/5">
              <div className="text-[10px] text-slate-400">ECMWF IFS 9km</div>
              <div className="text-sm font-bold text-white">{inspectedCase.ecmwfValue.toFixed(1)} {activeDef.unit}</div>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/5">
              <div className="text-[10px] text-slate-400">NCEP GFS 13km</div>
              <div className="text-sm font-bold text-white">{inspectedCase.gfsValue.toFixed(1)} {activeDef.unit}</div>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/5">
              <div className="text-[10px] text-slate-400">DWD ICON 13km</div>
              <div className="text-sm font-bold text-white">{inspectedCase.iconValue.toFixed(1)} {activeDef.unit}</div>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/5">
              <div className="text-[10px] text-slate-400">GraphCast AI 0.25°</div>
              <div className="text-sm font-bold text-white">{inspectedCase.graphcastValue.toFixed(1)} {activeDef.unit}</div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 hairline-t pt-2">
            <div>
              Delta vs Observed Truth: <strong className="text-white font-mono">
                {(inspectedCase.predictedValue - inspectedCase.observedValue).toFixed(2)} {activeDef.unit}
              </strong>
            </div>
            <div className="text-slate-300">
              Ground Outcome Status: <strong className="text-white">{inspectedCase.classification}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
