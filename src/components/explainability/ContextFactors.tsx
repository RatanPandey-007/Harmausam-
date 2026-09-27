import React from 'react';
import { StationLocation, WeatherContext } from '../../core/types';
import { Globe, Calendar, Clock, CloudSun } from 'lucide-react';

interface ContextFactorsProps {
  station: StationLocation;
  context: WeatherContext;
}

export const ContextFactors: React.FC<ContextFactorsProps> = ({
  station,
  context,
}) => {
  const shortCity = station.name.split(' (')[0];

  const factors = [
    {
      id: 'region',
      label: 'REGION',
      value: `${shortCity}, ${station.country}`,
      sub: `${station.climateZone}`,
      icon: Globe,
      explanation: 'Historical model performance varies by geographic terrain, elevation, and regional convective climatology.',
    },
    {
      id: 'season',
      label: 'SEASON',
      value: `${context.season.toUpperCase()}`,
      sub: 'Synoptic seasonal regime',
      icon: Calendar,
      explanation: 'Model skill varies systematically across seasonal conditions, monsoonal dynamics, and boundary layer thermodynamics.',
    },
    {
      id: 'lead',
      label: 'LEAD TIME',
      value: `+${context.leadTimeHours} Hours`,
      sub: 'Prediction horizon',
      icon: Clock,
      explanation: 'Forecast uncertainty generally changes with forecast horizon. Statistical AI models often perform strongly at short leads, while NWP physics anchors longer synoptic leads.',
    },
    {
      id: 'regime',
      label: 'WEATHER REGIME',
      value: `${context.detectedRegime}`,
      sub: 'Detected state',
      icon: CloudSun,
      explanation: 'Different models perform differently under distinct weather situations. Convective burst regimes favor high-resolution models, while stable high-pressure regimes favor global IFS ensembles.',
    },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#0D0F15] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 font-mono text-xs">
        <div>
          <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
            SYNOPTIC BOUNDARY CONDITIONS
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
            CONTEXT USED BY THE BLENDER
          </h3>
        </div>
        <div className="text-slate-400 text-[11px]">
          4 Dimensional Epistemic Input Vectors
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {factors.map((f) => {
          const IconComponent = f.icon;
          return (
            <div 
              key={f.id}
              className="p-4 rounded-xl border border-white/5 bg-[#12141C] space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <IconComponent className="w-4 h-4 text-sky-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                    {f.label}
                  </span>
                </div>

                <div className="mt-2.5">
                  <div className="text-base font-bold text-white font-sans truncate" title={f.value}>
                    {f.value}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate" title={f.sub}>
                    {f.sub}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans mt-3 leading-relaxed">
                  {f.explanation}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500">
                Contextual Weight Modifier: Active
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
