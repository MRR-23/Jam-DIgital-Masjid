import React, { useRef, useEffect, useState } from 'react';
import { RunningTextItem, ThemeColorKey, MarqueeColorStyle } from '../types';
import { Megaphone } from 'lucide-react';
import { getThemePalette } from '../utils/themePalettes';

interface RunningTextMarqueeProps {
  items: RunningTextItem[];
  speed?: number; // speed in pixels per second (e.g. 35 - 55 px/s)
  themeColor?: ThemeColorKey;
  bgStyle?: MarqueeColorStyle; // 'dark' | 'white' | 'gold' | 'glass'
}

export const RunningTextMarquee: React.FC<RunningTextMarqueeProps> = ({
  items,
  speed = 45, // default 45 px/sec (calm, legible)
  themeColor = 'gold',
  bgStyle = 'dark'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number>(40);

  const safeItems = Array.isArray(items) ? items : [];
  const activeItems = safeItems.filter(i => i && i.active);
  const theme = getThemePalette(themeColor);

  const combinedText = activeItems.map(item => item.text).join('   ❖   ');

  // Recalculate duration whenever text or speed changes to ensure exact constant velocity (px/sec)
  useEffect(() => {
    if (textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      const totalDistance = textWidth + containerWidth;
      
      // Target velocity: speed px per second
      const targetSpeed = Math.max(15, speed);
      const calculatedDuration = totalDistance / targetSpeed;
      setDuration(calculatedDuration);
    }
  }, [combinedText, speed]);

  if (activeItems.length === 0) return null;

  // Container styling based on bgStyle (termasuk warna putih)
  const getContainerStyle = () => {
    switch (bgStyle) {
      case 'white':
        return 'bg-white/95 text-slate-900 border-2 border-slate-200/90 shadow-2xl';
      case 'gold':
        return 'bg-amber-950/90 text-amber-100 border border-amber-500/40 shadow-xl';
      case 'glass':
        return 'bg-white/70 dark:bg-black/70 backdrop-blur-md text-slate-900 dark:text-white border border-white/30 dark:border-white/10 shadow-lg';
      case 'dark':
      default:
        return 'bg-black/85 backdrop-blur-md text-amber-100 border border-white/10 shadow-lg';
    }
  };

  const getTextColor = () => {
    switch (bgStyle) {
      case 'white':
        return 'text-slate-900 font-semibold';
      case 'gold':
        return 'text-amber-100 font-medium';
      case 'glass':
        return 'text-slate-900 dark:text-slate-100 font-semibold';
      case 'dark':
      default:
        return 'text-amber-100 font-medium';
    }
  };

  return (
    <div className="relative z-20 w-full px-3 sm:px-6 mb-1 sm:mb-1.5 select-none">
      <div 
        ref={containerRef}
        className={`w-full max-w-full rounded-full py-1 sm:py-1.5 px-3 sm:px-4 flex items-center overflow-hidden transition-colors duration-300 ${getContainerStyle()}`}
      >
        {/* Fixed Badge with Theme Accent */}
        <div 
          className="flex items-center space-x-1.5 text-slate-950 px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase tracking-wider shrink-0 mr-3 shadow-sm z-10"
          style={{ backgroundColor: theme.accent }}
        >
          <Megaphone className="w-3 h-3" />
          <span>INFO</span>
        </div>

        {/* Marquee Animation with measured duration for exact readable velocity */}
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={textRef}
            className={`whitespace-nowrap inline-block text-xs lg:text-sm will-change-transform ${getTextColor()}`}
            style={{
              animation: `calibratedMarquee ${duration}s linear infinite`,
            }}
          >
            {combinedText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {combinedText}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes calibratedMarquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};
