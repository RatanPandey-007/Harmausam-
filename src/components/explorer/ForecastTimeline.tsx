import React from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Clock 
} from 'lucide-react';

interface ForecastTimelineProps {
  leadTimeHours: number;
  setLeadTimeHours: (lead: number) => void;
  validTimestamp: string;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
}

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  leadTimeHours,
  setLeadTimeHours,
  validTimestamp,
  isPlaying,
  setIsPlaying,
}) => {
  const leadTimes = [0, 6, 12, 24, 48, 72, 120, 168];

  const handleStepBack = () => {
    const idx = leadTimes.indexOf(leadTimeHours);
    if (idx > 0) setLeadTimeHours(leadTimes[idx - 1]);
  };

  const handleStepForward = () => {
    const idx = leadTimes.indexOf(leadTimeHours);
    if (idx < leadTimes.length - 1) setLeadTimeHours(leadTimes[idx + 1]);
  };

  return (
    <div className="p-4 rounded border border-white/10 bg-[#0D0F15] space-y-3 font-mono text-xs">
      
      {/* Top Scrubber Header: Play / Step controls + Valid Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded hover:bg-white/10 text-white transition-colors"
            title={isPlaying ? 'Pause timeline animation' : 'Play timeline animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={handleStepBack}
            disabled={leadTimes.indexOf(leadTimeHours) === 0}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            title="Step backward"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleStepForward}
            disabled={leadTimes.indexOf(leadTimeHours) === leadTimes.length - 1}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            title="Step forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-slate-400 text-[11px] uppercase tracking-wider">FORECAST HORIZON:</span>
          <span className="text-white font-bold text-sm">+{leadTimeHours} Hours</span>
        </div>

        <div className="text-slate-400 text-[11px] flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Valid: <strong className="text-white">{new Date(validTimestamp).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} UTC</strong></span>
        </div>

      </div>

      {/* Discrete Timeline Interval Buttons (NOW ─── +24h ─── +48h ─── +72h ─── +120h ─── +168h) */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
        {leadTimes.map((lt) => {
          const isActive = lt === leadTimeHours;
          return (
            <button
              key={lt}
              onClick={() => setLeadTimeHours(lt)}
              className={`py-2 px-1 text-center font-mono rounded transition-colors border ${
                isActive 
                  ? 'border-white bg-white text-black font-bold shadow' 
                  : 'border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="text-xs">{lt === 0 ? 'NOW' : `+${lt}h`}</div>
              <div className="text-[9px] opacity-60">
                {lt === 0 ? '0h Analysis' : lt <= 24 ? 'Day 1' : lt <= 48 ? 'Day 2' : lt <= 72 ? 'Day 3' : lt <= 120 ? 'Day 5' : 'Day 7'}
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};
