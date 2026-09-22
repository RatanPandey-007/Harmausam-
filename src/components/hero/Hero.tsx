import React, { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { ActiveTab } from '../layout/Navbar';

interface HeroProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenMethodology: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onOpenMethodology }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Atmospheric flow streamlines simulation (NASA Earth Observatory / ECMWF fluid vector field)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 700);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate physical stream particles along an atmospheric Rossby wave / jet stream
    const particleCount = 280;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.8 + Math.random() * 1.5,
      length: 15 + Math.random() * 35,
      alpha: 0.08 + Math.random() * 0.28,
      layer: Math.random() > 0.35 ? 1 : 2, // 1 = tropospheric jet, 2 = isobaric eddies
    }));

    const render = () => {
      // Gentle decay for atmospheric motion streaks
      ctx.fillStyle = 'rgba(8, 9, 12, 0.16)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        // Rossby wave sinusoidal trajectory + cyclonic vortex in upper right
        const angle = Math.sin((p.x / width) * Math.PI * 2.5) * 0.45;
        const vortexDx = p.x - width * 0.72;
        const vortexDy = p.y - height * 0.45;
        const vortexDist = Math.sqrt(vortexDx * vortexDx + vortexDy * vortexDy);
        
        let vx = Math.cos(angle) * p.speed * 2.2;
        let vy = Math.sin(angle) * p.speed * 1.2;

        // Apply cyclonic circulation near atmospheric low
        if (vortexDist < 300) {
          const cyclonicForce = (300 - vortexDist) / 300;
          vx += -vortexDy * 0.012 * cyclonicForce;
          vy += vortexDx * 0.012 * cyclonicForce;
        }

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - vx * (p.length / 5), p.y - vy * (p.length / 5));

        if (p.layer === 1) {
          ctx.strokeStyle = `rgba(210, 225, 245, ${p.alpha})`; // Tropospheric stream
          ctx.lineWidth = 1.0;
        } else {
          ctx.strokeStyle = `rgba(59, 130, 246, ${p.alpha * 0.85})`; // Deep atmospheric flow
          ctx.lineWidth = 1.4;
        }
        ctx.stroke();

        p.x += vx;
        p.y += vy;

        // Wrap around boundaries
        if (p.x > width + 40) p.x = -40;
        if (p.x < -40) p.x = width + 40;
        if (p.y > height + 40) p.y = -40;
        if (p.y < -40) p.y = height + 40;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="relative w-full min-h-[85vh] flex flex-col justify-end overflow-hidden hairline-b bg-[#08090C]">
      
      {/* Background: Atmospheric Streamline Simulation Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-80">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Subtle Vignette Gradient: ensuring text is razor-sharp */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090C] via-[#08090C]/80 to-transparent w-full md:w-3/4" />
      </div>

      {/* Main Editorial Content: Left / Lower-Left Positioned */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-32">
        <div className="max-w-3xl">
          
          {/* Scientific Descriptor */}
          <div className="flex items-center space-x-3 mb-6">
            <span className="h-px w-6 bg-slate-600" />
            <span className="text-[11px] font-mono tracking-[0.24em] text-slate-400 uppercase">
              Context-Aware Weather Forecast Intelligence
            </span>
          </div>

          {/* Huge Editorial Headline (SpaceX / Tesla Scale) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-[-0.035em] text-white font-sans leading-[1.02] text-balance">
            Forecasting beyond a single model.
          </h1>

          {/* Restrained Scientific Thesis Paragraph */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 font-normal leading-relaxed text-balance max-w-2xl">
            A research system that dynamically blends Numerical Weather Prediction (ECMWF, GFS, ICON) with AI neural surrogates (GraphCast) using historical regime skill, lead time degradation, and physical consensus.
          </p>

          {/* Clean, Purposeful Actions */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('explorer')}
              className="inline-flex items-center space-x-2.5 px-6 py-3 rounded bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors tracking-tight"
            >
              <span>Explore Forecast</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenMethodology}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded border border-white/20 text-white font-medium text-sm hover:bg-white/5 hover:border-white/40 transition-colors tracking-tight"
            >
              <span>View Methodology</span>
            </button>
          </div>

        </div>
      </div>

      {/* Subtle Bottom Mission Indicator */}
      <div className="relative z-10 w-full hairline-t bg-[#08090C]/80 py-3 px-4 sm:px-8 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>OPERATIONAL ENSEMBLE: <strong>ECMWF IFS</strong> • <strong>GFS</strong> • <strong>ICON</strong> • <strong>GRAPHCAST</strong></span>
        </div>
        <div className="hidden sm:flex items-center space-x-2">
          <span>EVALUATION: STRICT CHRONOLOGICAL (ZERO LEAKAGE)</span>
        </div>
      </div>

    </section>
  );
};
