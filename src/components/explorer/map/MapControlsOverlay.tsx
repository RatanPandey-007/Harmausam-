import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Compass, Layers } from 'lucide-react';
import { MapStyleType } from './mapProviders';

interface MapControlsOverlayProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  activeStyle: MapStyleType;
  onChangeStyle: (style: MapStyleType) => void;
}

export const MapControlsOverlay: React.FC<MapControlsOverlayProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  activeStyle,
  onChangeStyle,
}) => {
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close style switcher menu when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsStyleMenuOpen(false);
      }
    }
    if (isStyleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStyleMenuOpen]);

  const styleOptions: { id: MapStyleType; label: string; desc: string }[] = [
    { id: 'standard', label: 'Dark Operational', desc: 'MapTiler Dataviz Dark' },
    { id: 'satellite', label: 'Satellite Imagery', desc: 'True Color Orthophoto' },
    { id: 'terrain', label: 'Topographic Relief', desc: 'Contour & Hillshade' },
  ];

  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col items-end space-y-2 pointer-events-auto" ref={menuRef}>
      {/* Control Card Group */}
      <div className="flex flex-col bg-[#0E1015]/95 border border-slate-800/90 shadow-2xl rounded-xl p-1 backdrop-blur-md">
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors"
          title="Zoom in (+)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="w-full h-px bg-slate-800 my-0.5" />

        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors"
          title="Zoom out (−)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="w-full h-px bg-slate-800 my-0.5" />

        <button
          onClick={onRecenter}
          aria-label="Recenter on selected station"
          className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors"
          title="Recenter location"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        <div className="w-full h-px bg-slate-800 my-0.5" />

        <button
          onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
          aria-label="Change basemap style"
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isStyleMenuOpen || activeStyle !== 'standard'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Basemap style"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Style Switcher Popover */}
      {isStyleMenuOpen && (
        <div className="w-48 bg-[#0E1015]/95 border border-slate-800 shadow-2xl rounded-xl p-1.5 backdrop-blur-md animate-fade-in font-sans">
          <div className="px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            BASEMAP STYLE
          </div>
          <div className="space-y-0.5 mt-1">
            {styleOptions.map((opt) => {
              const isSelected = activeStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChangeStyle(opt.id);
                    setIsStyleMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex flex-col transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
