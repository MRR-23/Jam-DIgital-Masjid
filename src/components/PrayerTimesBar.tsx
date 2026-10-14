import React from 'react';
import { PrayerKey, ThemeColorKey, BarStyleKey } from '../types';
import { NextPrayerInfo, formatCountdown } from '../utils/prayerTimes';
import { GoldenDivider } from './GoldenDivider';
import { getThemePalette } from '../utils/themePalettes';

interface PrayerTimesBarProps {
  prayerTimes: Record<PrayerKey, string>;
  nextPrayer: NextPrayerInfo;
  isDarkMode: boolean;
  themeColor?: ThemeColorKey;
  barStyle?: BarStyleKey;
  opacity?: number;
}

export const PrayerTimesBar: React.FC<PrayerTimesBarProps> = ({
  prayerTimes,
  nextPrayer,
  themeColor = 'gold',
  barStyle = 'white',
  opacity = 1.0
}) => {
  const prayers: { key: PrayerKey; label: string }[] = [
    { key: 'imsak', label: 'Imsak' },
    { key: 'subuh', label: 'Subuh' },
    { key: 'syuruq', label: 'Syuruq' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'magrib', label: 'Magrib' },
    { key: 'isya', label: "Isya'" },
  ];

  const theme = getThemePalette(themeColor);

  // Background style based on barStyle
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
        return 'shadow-2xl shadow-black/50 border-t border-slate-800/80';
      case 'cream':
        return 'shadow-md border-t border-amber-200/80';
      case 'glass':
        return 'shadow-lg border-t border-white/40 dark:border-slate-800';
      case 'white':
      default:
        return 'shadow-2xl shadow-black/20 border-t border-slate-200/60';
    }
  };

  const getSlotTextColor = (isLabel: boolean) => {
    if (barStyle === 'dark') {
      return isLabel ? 'text-slate-300' : 'text-white';
    }
    if (barStyle === 'cream') {
      return isLabel ? 'text-amber-800' : 'text-amber-950';
    }
    // white & default
    return isLabel ? 'text-slate-700' : 'text-black';
  };

  return (
    <div className="relative z-30 w-full select-none">
      {/* Proportionate bar with isolated background opacity - text and digits stay 100% solid */}
      <div className={`relative w-full rounded-t-[24px] sm:rounded-t-[32px] lg:rounded-t-[36px] overflow-hidden ${getContainerBorderStyle()}`}>
        {/* Background layer: Opacity ONLY applies here behind prayer cards */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-t-[24px] sm:rounded-t-[32px] lg:rounded-t-[36px] transition-all duration-300 ${getBgStyle()} ${
            opacity < 1.0 ? 'backdrop-blur-md' : ''
          }`}
          style={{
            opacity: opacity
          }}
        />

        {/* Foreground Content: 100% OPAQUE numbers and prayer cards */}
        <div className="relative z-10 w-full px-2 sm:px-4 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between">
          {prayers.map((prayer, index) => {
            const isNext = nextPrayer.nextPrayer === prayer.key;
            const timeValue = prayerTimes[prayer.key] || '--:--';
            const isLast = index === prayers.length - 1;

            return (
              <React.Fragment key={prayer.key}>
                {/* Prayer Slot Item */}
                <div className="flex-1 flex items-center justify-center min-w-0">
                  {isNext ? (
                    // Active Prayer Capsule (Matches Dzuhur in reference image) - 100% Solid & Clear
                    <div 
                      className="w-full max-w-[175px] text-white rounded-[18px] sm:rounded-[22px] lg:rounded-[24px] py-1 sm:py-1.5 px-1.5 sm:px-3 flex flex-col items-center justify-center shadow-md transition-all transform -translate-y-0.5"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <span className="text-xs sm:text-sm lg:text-base font-medium tracking-normal leading-tight truncate">
                        {prayer.label}
                      </span>
                      <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none my-0.5 whitespace-nowrap">
                        {timeValue}
                      </span>
                      <span className="font-mono text-[10px] sm:text-xs lg:text-sm font-semibold text-white/95 tracking-wider whitespace-nowrap">
                        {formatCountdown(nextPrayer.timeRemainingMs)}
                      </span>
                    </div>
                  ) : (
                    // Standard Prayer Item - 100% Solid text & digits
                    <div className="flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 text-center min-w-0">
                      <span className={`text-xs sm:text-sm lg:text-base font-medium tracking-normal leading-tight truncate ${getSlotTextColor(true)}`}>
                        {prayer.label}
                      </span>
                      <span className={`font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-none mt-0.5 sm:mt-1 whitespace-nowrap ${getSlotTextColor(false)}`}>
                        {timeValue}
                      </span>
                    </div>
                  )}
                </div>

                {/* Golden divider between prayer times */}
                {!isLast && (
                  <GoldenDivider 
                    className="mx-0.5 sm:mx-1 lg:mx-2" 
                    size="md" 
                    color={theme.accent} 
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
