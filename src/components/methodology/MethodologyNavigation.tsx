import React from 'react';
import { ActiveTab } from '../layout/Navbar';
import { Map, Cpu, CheckCircle2, AlertTriangle, Activity, ArrowRight } from 'lucide-react';

interface MethodologyNavigationProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const MethodologyNavigation: React.FC<MethodologyNavigationProps> = ({
  onNavigate,
}) => {
  if (!onNavigate) return null;

  const sections: { tab: ActiveTab; label: string; desc: string; icon: any }[] = [
    {
      tab: 'explorer',
      label: 'FORECAST EXPLORER',
      desc: 'See the resulting forecast.',
      icon: Map,
    },
    {
      tab: 'blending',
      label: 'AI BLENDING',
      desc: 'Inspect adaptive model contributions.',
      icon: Cpu,
    },
    {
      tab: 'verification',
      label: 'VERIFICATION',
      desc: 'Measure forecast performance.',
      icon: CheckCircle2,
    },
    {
      tab: 'events',
      label: 'EXTREME EVENTS',
      desc: 'Evaluate high-impact weather.',
      icon: AlertTriangle,
    },
    {
      tab: 'explain',
      label: 'DIAGNOSTICS',
      desc: 'Understand why the system made its decision.',
      icon: Activity,
    },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            INTERACTIVE SYSTEM NAVIGATION
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
            EXPLORE THE SYSTEM
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Direct Module Links</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {sections.map((sec) => {
          const IconComponent = sec.icon;
          return (
            <button
              key={sec.tab}
              onClick={() => onNavigate(sec.tab)}
              className="p-4 rounded-xl border border-white/10 bg-[#12141C] hover:bg-[#181B26] hover:border-sky-500/40 text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="mt-3 font-bold font-sans text-sm text-white group-hover:text-sky-300 transition-colors">
                  {sec.label}
                </div>
                <div className="text-xs text-slate-400 font-sans mt-1 leading-snug">
                  {sec.desc}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                Launch section →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
