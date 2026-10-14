import React, { useEffect, useState, useRef } from 'react';
import { PrayerKey, AlarmToneKey, ThemeColorKey, BarStyleKey } from '../types';
import { Clock, Volume2, AlertCircle, X } from 'lucide-react';
import { soundManager } from '../utils/audioAlerts';
import { IslamicPlaque, IslamicPlaqueDivider } from './IslamicPlaque';
import { getThemePalette } from '../utils/themePalettes';

interface AdzanOverlayProps {
  prayerName: string;
  prayerKey: PrayerKey;
  currentTimeStr: string;
  prayerTimeStr: string; // e.g. "18:11"
  targetPrayerTimestamp?: number;
  initialPhase?: 'pre_adzan' | 'adzan';
  preAdzanDurationSeconds?: number;
  adzanDurationSeconds?: number;
  alarmTone?: AlarmToneKey;
  themeColor?: ThemeColorKey;
  barStyle?: BarStyleKey;
  darkMode?: boolean;
  mosqueName?: string;
  onComplete: () => void;
  enableSound?: boolean;
}

const PRAYER_ARABIC_NAMES: Record<PrayerKey, string> = {
  imsak: 'الإِمْسَاكُ',
  subuh: 'الصُّبْحُ',
  syuruq: 'الشُّرُوقُ',
  dzuhur: 'الظُّهْرُ',
  ashar: 'الْعَصْرُ',
  magrib: 'الْمَغْرِبُ',
  isya: 'الْعِشَاءُ'
};

export const AdzanOverlay: React.FC<AdzanOverlayProps> = ({
  prayerName,
  prayerKey,
  currentTimeStr,
  prayerTimeStr,
  targetPrayerTimestamp,
  initialPhase = 'pre_adzan',
  preAdzanDurationSeconds = 180,
  adzanDurationSeconds = 180,
  alarmTone = 'harmonic_chime',
  themeColor = 'gold',
  darkMode = false,
  mosqueName,
  onComplete,
  enableSound = true
}) => {
  const [phase, setPhase] = useState<'pre_adzan' | 'adzan'>(initialPhase);
  const theme = getThemePalette(themeColor);

  const totalDurationSecRef = useRef<number>(
    initialPhase === 'pre_adzan' ? preAdzanDurationSeconds : adzanDurationSeconds
  );

  const initialEndTime = (initialPhase === 'pre_adzan' && targetPrayerTimestamp && targetPrayerTimestamp > Date.now())
    ? targetPrayerTimestamp
    : Date.now() + (initialPhase === 'pre_adzan' ? preAdzanDurationSeconds : adzanDurationSeconds) * 1000;

  const targetEndTimeRef = useRef<number>(initialEndTime);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.max(0, Math.ceil((initialEndTime - Date.now()) / 1000))
  );

  const lastAlarmBeepSecond = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  useEffect(() => {
    if (phase === 'adzan') {
      targetEndTimeRef.current = Date.now() + adzanDurationSeconds * 1000;
      totalDurationSecRef.current = adzanDurationSeconds;
      setSecondsRemaining(adzanDurationSeconds);
    } else {
      const calcEnd = (targetPrayerTimestamp && targetPrayerTimestamp > Date.now())
        ? targetPrayerTimestamp
        : Date.now() + preAdzanDurationSeconds * 1000;
      targetEndTimeRef.current = calcEnd;
      totalDurationSecRef.current = preAdzanDurationSeconds;
      setSecondsRemaining(Math.max(0, Math.ceil((calcEnd - Date.now()) / 1000)));
    }
  }, [phase, preAdzanDurationSeconds, adzanDurationSeconds, targetPrayerTimestamp]);

  useEffect(() => {
    const checkTimer = () => {
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;
      const remainingSec = Math.max(0, Math.ceil(diffMs / 1000));

      setSecondsRemaining(remainingSec);

      // In pre_adzan phase: 5 detik terakhir bunyikan alarm 1 kali per detik
      if (phase === 'pre_adzan' && remainingSec <= 5 && remainingSec >= 1) {
        if (enableSound && lastAlarmBeepSecond.current !== remainingSec) {
          lastAlarmBeepSecond.current = remainingSec;
          const isFinalBeep = remainingSec === 1;
          soundManager.playAlarmBeepOnce(1.0, isFinalBeep, alarmTone);
        }
      }

      if (diffMs <= 0) {
        if (phase === 'pre_adzan') {
          setPhase('adzan');
          lastAlarmBeepSecond.current = null;
          targetEndTimeRef.current = Date.now() + adzanDurationSeconds * 1000;
          totalDurationSecRef.current = adzanDurationSeconds;
          setSecondsRemaining(adzanDurationSeconds);
        } else {
          onComplete();
        }
      }
    };

    const intervalId = setInterval(checkTimer, 200);
    return () => clearInterval(intervalId);
  }, [phase, adzanDurationSeconds, onComplete, enableSound, alarmTone]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const countdownFormatted = `-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isLast5Seconds = phase === 'pre_adzan' && secondsRemaining <= 5 && secondsRemaining >= 1;
  const prayerArabic = PRAYER_ARABIC_NAMES[prayerKey] || 'الصَّلَاةُ';

  return (
    <IslamicPlaque 
      themeColor={themeColor}
      darkMode={darkMode}
      mosqueName={mosqueName}
    >
      {/* Skip button in top right corner */}
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

      {/* TOP COUNTDOWN TIMER: -02:45 */}
      <div 
        className={`font-['Plus_Jakarta_Sans',sans-serif] text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9.5rem] font-black tracking-tight leading-none select-none my-1 sm:my-1.5 transition-transform duration-200 ${
          isLast5Seconds 
            ? 'scale-105 animate-pulse drop-shadow-xl' 
            : 'drop-shadow-md'
        }`}
        style={{
          color: isLast5Seconds ? '#f59e0b' : (darkMode ? '#ffffff' : '#0f172a')
        }}
      >
        {countdownFormatted}
      </div>

      {/* CENTER ORNAMENTAL GOLDEN DIVIDER —◆— */}
      <IslamicPlaqueDivider themeColor={themeColor} className="my-1.5 sm:my-2.5 scale-100 sm:scale-110" />

      {/* MAIN TITLE: Menjelang Adzan Maghrib / Saat Adzan Maghrib */}
      <div className="flex flex-col items-center my-1.5 sm:my-2">
        <span 
          className="font-['Amiri',serif] text-xl sm:text-3xl lg:text-4xl font-bold leading-none mb-1.5"
          style={{ color: theme.primary }}
          dir="rtl"
        >
          {prayerArabic}
        </span>
        <h1 
          className={`font-['Plus_Jakarta_Sans',sans-serif] text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          {phase === 'pre_adzan' ? 'Menjelang Adzan' : 'Saat Adzan'} <span className="capitalize" style={{ color: theme.primary }}>{prayerName}</span>
        </h1>
      </div>

      {/* BOTTOM MESSAGE WITH RELEVANT ICONS */}
      <div 
        className={`flex items-center justify-center gap-3 sm:gap-5 max-w-3xl px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border backdrop-blur-sm mt-2 sm:mt-3 shadow-lg ${
          darkMode 
            ? 'bg-white/[0.06] border-white/15 text-slate-100' 
            : 'bg-black/[0.04] border-black/10 text-slate-900'
        }`}
      >
        <div className="shrink-0 p-1.5 rounded-full" style={{ color: theme.primary, backgroundColor: `${theme.primary}18` }}>
          {phase === 'pre_adzan' ? (
            <Clock className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          ) : (
            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" strokeWidth={2.4} />
          )}
        </div>

        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold leading-relaxed text-center">
          {phase === 'pre_adzan' ? (
            <>
              Waktu Adzan: <span className="font-extrabold" style={{ color: theme.primary }}>{prayerTimeStr || currentTimeStr}</span>. Para jamaah mohon bersiap mengambil wudhu, terima kasih.
            </>
          ) : (
            <>
              Kumandang Adzan sedang berlangsung. Para jamaah mohon hening dan menjawab seruan muadzin.
            </>
          )}
        </p>

        <div className="shrink-0 p-1.5 rounded-full" style={{ color: theme.primary, backgroundColor: `${theme.primary}18` }}>
          {phase === 'pre_adzan' ? (
            <Clock className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          ) : (
            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" strokeWidth={2.4} />
          )}
        </div>
      </div>

      {/* 5-SECOND COUNTDOWN ALARM BANNER */}
      {isLast5Seconds && (
        <div 
          className="mt-4 px-8 py-3 rounded-full text-white text-sm sm:text-base md:text-lg font-black uppercase tracking-wider flex items-center gap-3 animate-bounce shadow-2xl"
          style={{ backgroundColor: theme.primary }}
        >
          <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          <span>ALARM MASUK ADZAN: TERSISA {secondsRemaining} DETIK</span>
        </div>
      )}

    </IslamicPlaque>
  );
};
