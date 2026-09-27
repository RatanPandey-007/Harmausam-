import React, { useRef } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useReducedMotion, 
  MotionValue 
} from 'framer-motion';

export interface ScrollRevealTextProps {
  children?: string;
  text?: string;
  label?: string;
  subtext?: string;
  className?: string;
  containerHeight?: string;
}

interface WordItemProps {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  isReducedMotion: boolean;
}

const WordItem: React.FC<WordItemProps> = ({ 
  word, 
  progress, 
  range, 
  isReducedMotion 
}) => {
  // If reduced motion is requested, render static high-contrast text
  const opacity = useTransform(progress, range, [0.18, 1]);
  const y = useTransform(progress, range, [8, 0]);

  if (isReducedMotion) {
    return (
      <span className="inline-block mr-[0.28em] text-white">
        {word}
      </span>
    );
  }

  return (
    <motion.span
      style={{ opacity, y }}
      className="inline-block mr-[0.28em] text-white transition-colors duration-200"
    >
      {word}
    </motion.span>
  );
};

export const ScrollRevealText: React.FC<ScrollRevealTextProps> = ({
  children,
  text,
  label = "OPERATIONAL METEOROLOGICAL PRINCIPLE",
  subtext,
  className = "",
  containerHeight = "h-[180vh]",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Track scroll progress through the pinned container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const rawText = (children || text || "").trim();
  const words = rawText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // Header and subtext subtle fades
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.4]);
  const subtextOpacity = useTransform(scrollYProgress, [0.7, 0.85], [0, 1]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full ${containerHeight} select-none`}
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Subtle radial ambient background behind text */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[300px] rounded-full bg-sky-500/[0.03] blur-[120px]" />
        </div>

        <div className={`relative max-w-4xl mx-auto text-center space-y-6 ${className}`}>
          
          {/* Scientific Label / Monograph Tag */}
          {label && (
            <motion.div 
              style={{ opacity: prefersReducedMotion ? 1 : headerOpacity }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>{label}</span>
            </motion.div>
          )}

          {/* Editorial Progressive Scroll Reveal Text */}
          <div className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-medium tracking-tight leading-[1.28] sm:leading-[1.24] font-sans text-center">
            {words.map((word, idx) => {
              // Distribute reveal progress between 10% and 82% of container scroll
              const revealStart = 0.10 + (idx / totalWords) * 0.72;
              const revealEnd = revealStart + (1 / totalWords) * 0.72;

              return (
                <WordItem
                  key={`${word}-${idx}`}
                  word={word}
                  progress={scrollYProgress}
                  range={[revealStart, Math.min(revealEnd, 0.92)]}
                  isReducedMotion={prefersReducedMotion}
                />
              );
            })}
          </div>

          {/* Optional Supporting Subtext */}
          {subtext && (
            <motion.p
              style={{ opacity: prefersReducedMotion ? 1 : subtextOpacity }}
              className="text-xs sm:text-sm font-sans text-slate-400 max-w-2xl mx-auto leading-relaxed pt-2"
            >
              {subtext}
            </motion.p>
          )}

        </div>

      </div>
    </div>
  );
};

export default ScrollRevealText;
