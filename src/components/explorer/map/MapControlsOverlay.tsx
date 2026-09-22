import React from 'react';
import { Plus, Minus, Crosshair } from 'lucide-react';

interface MapControlsOverlayProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export const MapControlsOverlay: React.FC<MapControlsOverlayProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col space-y-1 bg-[#08090C]/85 border border-white/10 backdrop-blur-md p-1 rounded shadow-xl">
      <button
        onClick={onZoomIn}
        aria-label="Zoom in"
        className="w-7 h-7 rounded hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-mono"
        title="Zoom in (+)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <div className="w-full h-px bg-white/10" />

      <button
        onClick={onZoomOut}
        aria-label="Zoom out"
        className="w-7 h-7 rounded hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-mono"
        title="Zoom out (-)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="w-full h-px bg-white/10" />

      <button
        onClick={onRecenter}
        aria-label="Recenter on selected station"
        className="w-7 h-7 rounded hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-mono"
        title="Recenter on active location"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
