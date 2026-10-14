import React from 'react';
import { MosqueConfig, BarStyleKey } from '../types';
import { HijriDateResult, formatGregorianDate } from '../utils/hijriCalendar';
import { GoldenDivider } from './GoldenDivider';
import { getThemePalette } from '../utils/themePalettes';
import { Settings } from 'lucide-react';

interface HeaderBarProps {
  currentTime: Date;
  config: MosqueConfig;
  hijriDate: HijriDateResult;
  isCloudSynced: boolean;
  isMurattalPlaying: boolean;
  onToggleTheme: () => void;
  onOpenAdmin?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTime,
  config,
  hijriDate,
  onOpenAdmin
}) => {
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const theme = getThemePalette(config.themeColor);
  const barStyle: BarStyleKey = config.barStyle || 'white';

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Determine background color and border style based on barStyle
  const getBgStyle = () => {
    switch (barStyle) {
      case 'dark':
        return 'bg-[#0b0f19]';
      case 'cream':
        return 'bg-[#fffdf2]';
      case 'glass':
        return 'bg-white/80 dark:bg-slate-900/80';
      case 'white':
      default:
        return 'bg-white';
    }
  };

  const getContainerBorderStyle = () => {
    switch (barStyle) {
      case 'dark':
        return 'shadow-2xl shadow-black/50 border-b border-slate-800/80';
      case 'cream':
        return 'shadow-md border-b border-amber-200/80';
      case 'glass':
        return 'shadow-lg border-b border-white/40 dark:border-slate-800';
      case 'white':
      default:
        return 'shadow-md shadow-black/10 border-b border-slate-200/60';
    }
  };

  const getTextColor = (type: 'title' | 'sub' | 'date') => {
    if (barStyle === 'dark') {
      if (type === 'title') return 'text-white';
      if (type === 'sub') return 'text-slate-300';
      return 'text-slate-200';
    }
    if (barStyle === 'cream') {
      if (type === 'title') return 'text-amber-950';
      if (type === 'sub') return 'text-amber-800';
      return 'text-amber-900';
    }
    // white & default
    if (type === 'title') return 'text-black';
    if (type === 'sub') return 'text-slate-700';
    return 'text-slate-800';
  };

  const barOpacity = config.barOpacity !== undefined ? config.barOpacity : 1.0;

  return (
    <header className="relative z-30 w-full select-none">
      {/* Sleek bar with isolated background opacity - text and digits stay 100% solid */}
      <div className={`relative w-full rounded-b-[36px] overflow-hidden ${getContainerBorderStyle()}`}>
        {/* Background layer: Opacity ONLY applies here */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-b-[36px] transition-all duration-300 ${getBgStyle()} ${
            barOpacity < 1.0 ? 'backdrop-blur-md' : ''
          }`}
          style={{
            opacity: barOpacity
          }}
        />

        {/* Foreground Content: 100% OPAQUE numbers and text */}
        <div className="relative z-10 w-full px-6 lg:px-10 py-2.5 flex items-center justify-between">
          {/* Left: Digital Clock (13:00) */}
          <div className="flex items-center min-w-[180px] lg:min-w-[210px]">
            <span className={`font-['Plus_Jakarta_Sans',sans-serif] text-5xl lg:text-6xl font-extrabold tracking-tight leading-none ${getTextColor('title')}`}>
              {hours}:{minutes}
            </span>
          </div>

          {/* Divider Left */}
          <GoldenDivider className="mx-4 lg:mx-6" size="md" color={theme.accent} />

          {/* Center: Mosque Title & Address */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <h1 className={`font-['Plus_Jakarta_Sans',sans-serif] text-xl lg:text-3xl font-extrabold tracking-wide uppercase leading-tight ${getTextColor('title')}`}>
              {config.mosqueName}
            </h1>
            <p className={`text-[11px] lg:text-xs font-semibold mt-0.5 max-w-2xl leading-normal line-clamp-1 ${getTextColor('sub')}`}>
              {config.address}
            </p>

            {/* Kas Masjid amount badge in Header */}
            {config.kasMasjid && config.kasMasjid.enabled && (
              <div className={`flex items-center space-x-1.5 mt-1 px-3 py-0.5 rounded-full border text-[10px] font-bold ${
                config.kasMasjid.colorStyle === 'dark' || barStyle === 'dark' 
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300' 
                  : config.kasMasjid.colorStyle === 'gold'
                  ? 'bg-amber-950/70 border-amber-600/70 text-amber-200'
                  : 'bg-emerald-50 border-emerald-300/80 text-emerald-800'
              }`}>
                <span>Kas Masjid ({config.kasMasjid.periode}):</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {formatRupiah(config.kasMasjid.saldoAkhir)}
                </span>
              </div>
            )}
          </div>

          {/* Divider Right */}
          <GoldenDivider className="mx-4 lg:mx-6" size="md" color={theme.accent} />

          {/* Right: Hijri Date & Gregorian Date & Right-Up Trigger */}
          <div className="min-w-[190px] lg:min-w-[220px] flex items-center justify-center relative group/rightup">
            <div 
              onClick={onOpenAdmin}
              className={`flex flex-col items-center justify-center text-center ${onOpenAdmin ? 'cursor-pointer group' : ''}`}
              title={onOpenAdmin ? "Klik untuk Masuk Pengaturan Admin DKM" : undefined}
            >
              <div className={`font-['Plus_Jakarta_Sans',sans-serif] text-base lg:text-xl font-bold uppercase leading-tight tracking-normal transition-colors ${onOpenAdmin ? 'group-hover:text-amber-400' : ''} ${getTextColor('title')}`}>
                {hijriDate.formatted}
              </div>
              <div className={`text-xs lg:text-sm font-medium mt-0.5 ${getTextColor('sub')}`}>
                {formatGregorianDate(currentTime)}
              </div>
            </div>

            {/* Right-Up Trigger: Transparan secara default, saat kursor di atasnya berubah jadi warna emas */}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAdmin();
                }}
                className="absolute -right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-transparent text-transparent border border-transparent opacity-0 hover:opacity-100 hover:text-amber-400 hover:bg-amber-950/80 hover:border-amber-400/80 hover:shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all duration-300 cursor-pointer flex items-center gap-1.5 z-30"
                title="Pengaturan Admin DKM (Pintasan: F2 / Alt+A)"
              >
                <Settings className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="text-amber-300 font-bold text-xs">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
