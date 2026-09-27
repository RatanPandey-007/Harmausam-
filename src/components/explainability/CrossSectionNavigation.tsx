import React from 'react';
import { ActiveTab } from '../layout/Navbar';
import { Map, Cpu, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface CrossSectionNavigationProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const CrossSectionNavigation: React.FC<CrossSectionNavigationProps> = ({
  onNavigate,
}) => {
  if (!onNavigate) return null;

  const links: { tab: ActiveTab; label: string; desc: string; icon: any }[] = [
    {
      tab: 'explorer',
      label: 'VIEW FORECAST',
      desc: 'Inspect spatial fields & multi-model divergence on the map',
      icon: Map,
    },
    {
      tab: 'blending',
      label: 'VIEW BLEND',
      desc: 'Explore the AI Bayesian loss formulation & dynamic weights',
      icon: Cpu,
    },
    {
      tab: 'verification',
      label: 'VIEW VERIFICATION',
      desc: 'Review empirical ground-truth error metrics & leaderboards',
      icon: CheckCircle2,
    },
    {
      tab: 'events',
      label: 'VIEW EXTREME EVENTS',
      desc: 'Monitor high-impact weather hazards & threshold alarms',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            CROSS-SECTION OPERATIONAL WORKFLOWS
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white font-sans mt-0.5">
            RELATED METEOROLOGICAL MODULES
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Direct Navigation</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {links.map((link) => {
          const IconComponent = link.icon;
          return (
            <button
              key={link.tab}
              onClick={() => onNavigate(link.tab)}
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
                  {link.label}
                </div>
                <div className="text-xs text-slate-400 font-sans mt-1 leading-snug">
                  {link.desc}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                Navigate to module →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
