import React, { useEffect, useState, useRef } from 'react';
import { soundManager } from '../utils/audioAlerts';
import { BellOff, X } from 'lucide-react';
import { ThemeColorKey, BarStyleKey, PrayerKey } from '../types';
import { IslamicPlaque, IslamicPlaqueDivider } from './IslamicPlaque';
import { getThemePalette } from '../utils/themePalettes';

interface IqamahOverlayProps {
  prayerName: string;
  prayerKey?: PrayerKey;
  durationMinutes: number;
  themeColor?: ThemeColorKey;
  barStyle?: BarStyleKey;
  darkMode?: boolean;
  mosqueName?: string;
  onComplete: () => void;
  enableSound?: boolean;
}

export const IqamahOverlay: React.FC<IqamahOverlayProps> = ({
  prayerName,
  prayerKey: _prayerKey,
  durationMinutes,
  themeColor = 'gold',
  darkMode = false,
  mosqueName,
  onComplete,
  enableSound = true
}) => {
  const theme = getThemePalette(themeColor);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  const targetEndTimeRef = useRef(Date.now() + durationMinutes * 60 * 1000);
  const lastWarningBeepRef = useRef<number | null>(null);

  useEffect(() => {
    targetEndTimeRef.current = Date.now() + durationMinutes * 60 * 1000;
  }, [durationMinutes]);

  useEffect(() => {
    const checkTimer = () => {
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsLeft(remaining);

      // Warning beeps in last 5 seconds (5, 4, 3, 2, 1)
      if (remaining <= 5 && remaining >= 1 && enableSound) {
        if (lastWarningBeepRef.current !== remaining) {
          lastWarningBeepRef.current = remaining;
          soundManager.playIqamahWarningBeep(remaining === 1, remaining === 1 ? 1.0 : 0.8);
        }
      }

      if (diffMs <= 0) {
        if (enableSound) {
          soundManager.playIqamahArrivalAlert(1.0);
        }
        onComplete();
      }
    };

    const intervalId = setInterval(checkTimer, 200);
    return () => clearInterval(intervalId);
  }, [onComplete, enableSound]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const minStr = minutes.toString().padStart(2, '0');
  const secStr = seconds.toString().padStart(2, '0');
  const countdownFormatted = `-${minStr}:${secStr}`;
  const isLast5Sec = secondsLeft <= 5 && secondsLeft >= 1;

  return (
    <IslamicPlaque 
      themeColor={themeColor}
      darkMode={darkMode}
      mosqueName={mosqueName}
    >
      {/* Skip button in top right for admin convenience */}
      <button
        onClick={onComplete}
        className={`absolute top-4 right-6 sm:top-6 sm:right-8 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur border shadow-md transition-all active:scale-95 ${
          darkMode 
            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' 
            : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200'
        }`}
        title="Lewati (Esc)"
      >
        <span>Lewati</span>
        <X className="w-3.5 h-3.5" />
      </button>

      {/* TOP COUNTDOWN TIMER: -09:51 */}
      <div 
        className={`font-['Plus_Jakarta_Sans',sans-serif] text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9.5rem] font-black tracking-tight leading-none select-none my-1 sm:my-1.5 transition-transform duration-200 ${
          isLast5Sec ? 'scale-105 animate-pulse drop-shadow-xl' : 'drop-shadow-md'
        }`}
        style={{
          color: isLast5Sec ? '#f59e0b' : (darkMode ? '#ffffff' : '#0f172a')
        }}
      >
        {countdownFormatted}
      </div>

      {/* CENTER ORNAMENTAL GOLDEN DIVIDER —◆— */}
      <IslamicPlaqueDivider themeColor={themeColor} className="my-1.5 sm:my-2.5 scale-100 sm:scale-110" />

      {/* MAIN TITLE: Menjelang Iqamah */}
      <h1 
        className={`font-['Plus_Jakarta_Sans',sans-serif] text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight my-1.5 sm:my-2.5 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}
      >
        Menjelang Iqamah {prayerName ? <span className="capitalize" style={{ color: theme.primary }}>{prayerName}</span> : ''}
      </h1>

      {/* BOTTOM MESSAGE WITH SILENT PHONE ICONS */}
      <div 
        className={`flex items-center justify-center gap-3 sm:gap-5 max-w-3xl px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border backdrop-blur-sm mt-2 sm:mt-3 shadow-lg ${
          darkMode 
            ? 'bg-white/[0.06] border-white/15 text-slate-100' 
            : 'bg-black/[0.04] border-black/10 text-slate-900'
        }`}
      >
        <div className="shrink-0 p-1.5 rounded-full" style={{ color: theme.primary, backgroundColor: `${theme.primary}18` }}>
          <BellOff className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </div>

        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold leading-relaxed text-center">
          Para jamaah mohon untuk bersiap, dan alat komunikasi mohon dalam mode senyap, terima kasih
        </p>

        <div className="shrink-0 p-1.5 rounded-full" style={{ color: theme.primary, backgroundColor: `${theme.primary}18` }}>
          <BellOff className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </div>
      </div>

      <div 
        className={`text-xs sm:text-sm font-medium italic mt-2.5 px-4 ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        "Luruskan dan rapatkan shaf untuk kesempurnaan shalat berjamaah"
      </div>

    </IslamicPlaque>
  );
};
