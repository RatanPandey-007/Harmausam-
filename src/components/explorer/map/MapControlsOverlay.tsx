import React from 'react';
import { Plus, Minus, Compass } from 'lucide-react';

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
    <div className="absolute top-3 right-3 z-20 flex flex-col space-y-1 bg-[#08090C]/90 border border-white/15 backdrop-blur-md p-0.5 rounded shadow-xl font-mono">
      <button
        onClick={onZoomIn}
        aria-label="Zoom in"
        className="w-6 h-6 rounded hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
        title="Zoom in (+)"
      >
        <Plus className="w-3 h-3" />
      </button>

      <div className="w-full h-px bg-white/10" />

      <button
        onClick={onZoomOut}
        aria-label="Zoom out"
        className="w-6 h-6 rounded hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
        title="Zoom out (-)"
      >
        <Minus className="w-3 h-3" />
      </button>

      <div className="w-full h-px bg-white/10" />

      <button
        onClick={onRecenter}
        aria-label="Recenter on selected station"
        className="w-6 h-6 rounded hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
        title="Recenter location"
      >
        <Compass className="w-3 h-3" />
      </button>
    </div>
  );
};
