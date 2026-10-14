import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { ThemeColorKey, BarStyleKey } from '../types';
import { IslamicPlaque, IslamicPlaqueDivider } from './IslamicPlaque';
import { getThemePalette } from '../utils/themePalettes';

interface DoaAdzanOverlayProps {
  durationSeconds?: number;
  isTestMode?: boolean;
  themeColor?: ThemeColorKey;
  barStyle?: BarStyleKey;
  darkMode?: boolean;
  mosqueName?: string;
  prayerName?: string;
  onComplete: () => void;
}

export const DoaAdzanOverlay: React.FC<DoaAdzanOverlayProps> = ({
  durationSeconds = 60,
  isTestMode = false,
  themeColor = 'gold',
  darkMode = false,
  mosqueName,
  prayerName: _prayerName,
  onComplete
}) => {
  const theme = getThemePalette(themeColor);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const targetEndTimeRef = useRef<number>(Date.now() + durationSeconds * 1000);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);

  useEffect(() => {
    targetEndTimeRef.current = Date.now() + durationSeconds * 1000;
    setSecondsRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow escape to skip during test mode
      if (e.key === 'Escape' && isTestMode) {
        onCompleteRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTestMode]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;
      const remainingSec = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsRemaining(remainingSec);

      if (diffMs <= 0) {
        clearInterval(timer);
        onCompleteRef.current();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 100);
    return () => clearInterval(timer);
  }, [durationSeconds]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const countdownFormatted = `-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <IslamicPlaque 
      themeColor={themeColor}
      darkMode={darkMode}
      mosqueName={mosqueName}
    >
      {/* Tombol Lewati: HANYA MUNCUL DI MODE PERCOBAAN (Sesuai Permintaan DKM) */}
      {isTestMode && (
        <button
          onClick={onComplete}
          className={`absolute top-4 right-6 sm:top-6 sm:right-8 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur border shadow-md transition-all active:scale-95 ${
            darkMode 
              ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' 
              : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
          title="Lewati (Mode Percobaan)"
        >
          <span>Lewati</span>
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* TOP COUNTDOWN TIMER: -00:54 */}
      <div 
        className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight leading-none select-none my-1 drop-shadow-md"
        style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
      >
        {countdownFormatted}
      </div>

      {/* CENTER ORNAMENTAL GOLDEN DIVIDER —◆— */}
      <IslamicPlaqueDivider themeColor={themeColor} className="my-1.5 sm:my-2.5 scale-100 sm:scale-110" />

      {/* MAIN TITLE: Doa Sesudah Adzan */}
      <h1 
        className={`font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight my-1.5 sm:my-2.5 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}
      >
        Doa Sesudah Adzan
      </h1>

      {/* COMPLETE ARABIC PRAYER CARD */}
      <div 
        className={`my-1.5 sm:my-2 px-6 sm:px-8 py-3.5 sm:py-4.5 rounded-2xl sm:rounded-3xl max-w-4xl border backdrop-blur-sm shadow-md transition-all ${
          darkMode 
            ? 'bg-white/[0.06] border-white/15' 
            : 'bg-black/[0.03] border-black/10'
        }`}
      >
        <p 
          className="font-['Amiri',serif] text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-[1.8] font-bold select-none text-center" 
          dir="rtl"
          style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}
        >
          اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ ، وَالصَّلَاةِ الْقَائِمَةِ ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ
        </p>
      </div>

      {/* TRANSLATION & HADITH NOTE */}
      <div className="mt-2 sm:mt-2.5 max-w-3xl px-4 text-center space-y-2 sm:space-y-2.5">
        <p 
          className={`font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed font-medium sm:font-semibold italic ${
            darkMode ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          "Ya Allah, Tuhan Pemilik panggilan yang sempurna ini dan sholat yang akan didirikan, berikanlah wasilah dan keutamaan kepada Nabi Muhammad, serta tempatkanlah beliau pada kedudukan terpuji sebagaimana telah Engkau janjikan."
        </p>
        
        <div 
          className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-sm"
          style={{ 
            backgroundColor: `${theme.primary}20`,
            color: theme.primary,
            border: `1.5px solid ${theme.primary}50`
          }}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Keutamaan: Mendapatkan Syafa'at Rasulullah SAW (HR. Bukhari)</span>
        </div>
      </div>

    </IslamicPlaque>
  );
};
