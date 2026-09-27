import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ---------------- WordsPullUp ---------------- */
export interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ 
  text, 
  className = "", 
  showAsterisk = false, 
  style 
}: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
export interface Segment {
  text: string;
  className?: string;
}

export interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({ 
  segments, 
  className = "", 
  style 
}: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- PrismaHero (Harmausam Extreme Events Edition) ---------------- */
export interface PrismaHeroProps {
  onExplore?: () => void;
  onSelectCategory?: (category: 'Heatwave' | 'Heavy rainfall' | 'High wind' | 'Extreme Cold') => void;
}

const navItems: { label: string; category?: 'Heatwave' | 'Heavy rainfall' | 'High wind' | 'Extreme Cold' }[] = [
  { label: "Heatwaves", category: "Heatwave" },
  { label: "Heavy Rain", category: "Heavy rainfall" },
  { label: "High Wind", category: "High wind" },
  { label: "Cold Waves", category: "Extreme Cold" },
  { label: "Verification" }
];

export const PrismaHero: React.FC<PrismaHeroProps> = ({ 
  onExplore,
  onSelectCategory 
}) => {
  const [videoError, setVideoError] = useState(false);

  const handleScrollToConsole = () => {
    if (onExplore) {
      onExplore();
    } else {
      const el = document.getElementById("event-monitoring-console");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="h-[90vh] min-h-[640px] max-h-[960px] w-full mb-8">
      <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem] bg-[#0E1015] border border-white/10 shadow-2xl">
        
        {/* Background video */}
        {!videoError ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="absolute inset-0 h-full w-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-[#121622] via-[#0E1017] to-[#08090C]" />
        )}

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

        {/* Centered Top Floating Navbar */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-b-2xl bg-black/90 backdrop-blur-md px-4 py-2 border-b border-x border-white/10 sm:gap-6 md:gap-10 md:rounded-b-3xl md:px-8 lg:gap-12">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.category && onSelectCategory) {
                    onSelectCategory(item.category);
                  }
                  handleScrollToConsole();
                }}
                className="text-[10px] transition-colors sm:text-xs md:text-sm font-mono cursor-pointer whitespace-nowrap"
                style={{ color: "rgba(225, 224, 204, 0.8)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-6 md:px-10 lg:pb-8">
          <div className="grid grid-cols-12 items-end gap-4">
            
            {/* Bottom-left: Large Typography */}
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-medium leading-[0.88] tracking-[-0.06em] text-[15vw] sm:text-[13vw] md:text-[11vw] lg:text-[9.5vw] xl:text-[9vw] select-none"
                style={{ color: "#E1E0CC" }}
              >
                <WordsPullUp text="Extreme Events" showAsterisk />
              </h1>
            </div>

            {/* Bottom-right: Animated paragraph & CTA */}
            <div className="col-span-12 flex flex-col gap-5 pb-4 lg:col-span-4 lg:pb-6">
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-sm md:text-base font-sans"
                style={{ color: "rgba(225, 224, 204, 0.8)", lineHeight: 1.35 }}
              >
                Harmausam evaluates high-consequence weather anomalies across deterministic and neural forecasting systems, strictly distinguishing predictive warning signals from confirmed ground truth observations.
              </motion.p>

              <motion.button
                type="button"
                onClick={handleScrollToConsole}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex items-center gap-2 self-start rounded-full py-1 pl-5 pr-1 text-sm font-semibold text-black transition-all hover:gap-3 sm:text-base cursor-pointer shadow-lg"
                style={{ backgroundColor: "#E1E0CC" }}
              >
                <span>Explore Detections</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4" style={{ color: "#E1E0CC" }} />
                </span>
              </motion.button>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PrismaHero;
