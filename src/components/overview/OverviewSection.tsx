import React from 'react';
import { 
  Thermometer, 
  CloudRain, 
  Wind, 
  Droplets, 
  Gauge, 
  ArrowUpRight, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp,
  Cpu,
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { 
  BlendedForecastResult, 
  StationLocation, 
  WeatherVariable, 
  ExtremeEventAlert,
  WeatherRegime
} from '../../core/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ActiveTab } from '../layout/Navbar';

interface OverviewSectionProps {
  currentResult: BlendedForecastResult;
  station: StationLocation;
  leadTimeHours: number;
  selectedVariable: WeatherVariable;
  setSelectedVariable: (v: WeatherVariable) => void;
  alerts: ExtremeEventAlert[];
  onNavigate: (tab: ActiveTab) => void;
  isDemonstrationData: boolean;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  currentResult,
  station,
  leadTimeHours,
  selectedVariable,
  setSelectedVariable,
  alerts,
  onNavigate,
  isDemonstrationData,
}) => {
  const { context, individualForecasts, adaptiveWeights, modelSpread, confidenceIndicator, confidenceTier, uncertaintyInterval } = currentResult;

  // Format units
  const getUnit = (v: WeatherVariable) => {
    switch (v) {
      case 'temperature_2m': return '°C';
      case 'precipitation': return 'mm/3h';
      case 'wind_speed_10m': return 'm/s';
      case 'relative_humidity_2m': return '%';
      case 'surface_pressure': return 'hPa';
    }
  };

  const getVariableIcon = (v: WeatherVariable) => {
    switch (v) {
      case 'temperature_2m': return <Thermometer className="w-4 h-4 text-cyan-400" />;
      case 'precipitation': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'wind_speed_10m': return <Wind className="w-4 h-4 text-teal-400" />;
      case 'relative_humidity_2m': return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'surface_pressure': return <Gauge className="w-4 h-4 text-amber-400" />;
    }
  };

  // Regime color badge helper
  const getRegimeBadgeVariant = (regime: WeatherRegime) => {
    switch (regime) {
      case 'Heavy Rainfall': return 'danger';
      case 'Convective / Rapid Change': return 'warning';
      case 'Heatwave': return 'danger';
      case 'High Wind': return 'warning';
      case 'Extreme Cold': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Station Context & Operational Telemetry */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                {station.name}
              </h2>
              <Badge variant="outline" className="font-mono text-xs border-slate-700 text-slate-300">
                {station.id}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                {station.country}
              </Badge>
              <Badge variant={getRegimeBadgeVariant(context.detectedRegime)} className="text-xs">
                {context.detectedRegime} Regime
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400 font-mono">
              Coordinates: {station.latitude.toFixed(2)}°N, {station.longitude.toFixed(2)}°E | Elev: {station.elevationMeters}m | Climate: {station.climateZone}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Target Lead:</span>
              <span className="text-cyan-300 font-bold">+{leadTimeHours}h</span>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-slate-400">Ensemble Spread:</span>
              <span className={`font-bold ${modelSpread > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                σ = {modelSpread.toFixed(2)} {getUnit(selectedVariable)}
              </span>
            </div>

            <Button
              onClick={() => onNavigate('explorer')}
              size="sm"
              variant="outline"
              className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
            >
              <span>Open Map & Scrubber</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid: Blended Forecast, Disagreement, Active Regime Signals, Extreme Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Primary Blended Value */}
        <Card className="border-slate-800/90 bg-[#0E1422] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            {getVariableIcon(selectedVariable)}
          </div>
          <CardHeader className="pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Context-Aware Adaptive Blend
            </span>
            <CardTitle className="text-3xl font-bold font-mono text-white flex items-baseline gap-1 mt-1">
              <span>{currentResult.adaptiveBlendedForecast.toFixed(1)}</span>
              <span className="text-sm font-normal text-slate-400">{getUnit(selectedVariable)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono py-1 border-b border-slate-800/60">
              <span>90% Confidence Interval:</span>
              <span className="text-slate-200">[{uncertaintyInterval.lower90}, {uncertaintyInterval.upper90}]</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono py-1 mt-0.5">
              <span>Equal-Weight Mean:</span>
              <span className="text-slate-400">{currentResult.equalWeightForecast.toFixed(1)} {getUnit(selectedVariable)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Model Disagreement & Spread */}
        <Card className="border-slate-800/90 bg-[#0E1422]">
          <CardHeader className="pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Inter-Model Disagreement
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {context.disagreementLevel}
              </span>
              <Badge 
                variant={confidenceTier === 'High' ? 'success' : confidenceTier === 'Moderate' ? 'warning' : 'danger'}
                className="text-[11px] font-mono"
              >
                {confidenceIndicator}% Conf
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs font-mono space-y-1.5">
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className={`h-full ${confidenceIndicator > 70 ? 'bg-emerald-500' : confidenceIndicator > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${confidenceIndicator}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Spread σ = {modelSpread.toFixed(2)}. Calibrated against climatological variance.
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Active Weather Regime */}
        <Card className="border-slate-800/90 bg-[#0E1422]">
          <CardHeader className="pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Detected Weather Regime
            </span>
            <CardTitle className="text-lg font-bold font-sans text-cyan-300 mt-1 flex items-center justify-between">
              <span>{context.detectedRegime}</span>
              <Info className="w-4 h-4 text-slate-400 cursor-pointer" onClick={() => onNavigate('explain')} />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs font-mono text-slate-400">
            <div className="truncate">
              {context.regimeSignals.find(s => s.triggered)?.name || 'Within normal seasonal climatology'}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Trigger:</span>
              <span className="text-amber-400 font-medium">
                {context.regimeSignals.find(s => s.triggered)?.value || 'Normal variance'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Extreme Hazard Alerts */}
        <Card className={`border-slate-800/90 bg-[#0E1422] ${alerts.length > 0 ? 'border-amber-500/40' : ''}`}>
          <CardHeader className="pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Severe Weather Alert Status
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-bold font-sans text-white">
                {alerts.length > 0 ? `${alerts.length} Active Hazard(s)` : 'No Extreme Alerts'}
              </span>
              {alerts.length > 0 ? (
                <Badge variant="warning" className="text-[10px]">
                  {alerts[0].severityRisk.toUpperCase()}
                </Badge>
              ) : (
                <Badge variant="success" className="text-[10px]">NOMINAL</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-slate-400">
            {alerts.length > 0 ? (
              <div className="flex items-center justify-between">
                <span className="truncate text-amber-300">{alerts[0].eventType} ({alerts[0].probabilityOfExceedance}%)</span>
                <button onClick={() => onNavigate('events')} className="text-cyan-400 hover:underline text-[11px]">
                  View
                </button>
              </div>
            ) : (
              <p className="text-[11px]">All variables remain below critical danger thresholds.</p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Middle Row: Multi-Model Weights & Baseline Comparison Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Source Contribution Breakdown */}
        <Card className="lg:col-span-2 border-slate-800 bg-[#0E1422]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Multi-Model Weight Allocation</CardTitle>
                <CardDescription>
                  Dynamic weights derived from historical skill in <span className="text-cyan-300 font-mono">{context.detectedRegime}</span> regime at <span className="text-cyan-300 font-mono">+{leadTimeHours}h</span> lead time
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('blending')}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Detailed Math <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {(['ECMWF', 'GFS', 'ICON', 'GRAPHCAST'] as const).map((src) => {
                const sw = adaptiveWeights[src];
                const val = individualForecasts[src];
                const pct = Math.round((sw?.weight ?? 0.25) * 100);
                const colorClass = src === 'ECMWF' ? 'bg-blue-500' : src === 'GFS' ? 'bg-emerald-500' : src === 'ICON' ? 'bg-amber-500' : 'bg-purple-500';

                return (
                  <div key={src} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                        <span className="font-semibold text-slate-200">{src}</span>
                        <span className="text-slate-400">({src === 'GRAPHCAST' ? 'AI Surrogate' : 'NWP Physics'})</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-slate-400">Raw: {val.toFixed(1)} {getUnit(selectedVariable)}</span>
                        <span className="font-bold text-white w-12 text-right">{pct}% w</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/80">
                      <div 
                        className={`h-full ${colorClass} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Baseline Comparator Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Equal-Weight (EM)</span>
                <span className="text-sm font-bold text-slate-200">{currentResult.equalWeightForecast.toFixed(1)}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Fixed-Weight OLS</span>
                <span className="text-sm font-bold text-slate-200">{currentResult.fixedWeightForecast.toFixed(1)}</span>
              </div>
              <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/40">
                <span className="text-[10px] text-cyan-400 block uppercase">Adaptive Blend</span>
                <span className="text-sm font-bold text-cyan-200">{currentResult.adaptiveBlendedForecast.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explainability Mini-Diagnostic */}
        <Card className="border-slate-800 bg-[#0E1422] flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Diagnostic Reasoning</CardTitle>
            <CardDescription>
              Why these weights were dynamically computed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300 font-sans">
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-mono text-[11px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>BAYESIAN ATTRIBUTION TRACE</span>
              </div>
              <p className="leading-relaxed text-slate-300 text-xs">
                In <span className="text-white font-medium">{context.detectedRegime}</span> conditions, 
                high-resolution ECMWF holds a historical RMSE advantage ({adaptiveWeights.ECMWF?.historicalRmseInRegime.toFixed(2)} vs GFS {adaptiveWeights.GFS?.historicalRmseInRegime.toFixed(2)}), 
                earning primary allocation.
              </p>
              <p className="leading-relaxed text-slate-400 text-xs">
                {context.disagreementLevel === 'Low' 
                  ? 'High model consensus bounds epistemic uncertainty and reinforces confidence.'
                  : `Model divergence of σ=${modelSpread.toFixed(1)} applied a conservative smoothing penalty.`}
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('explain')}
                className="w-full text-xs border-slate-700 hover:bg-slate-800 text-slate-200"
              >
                Inspect Waterfall Breakdown & Counterfactuals
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
};
