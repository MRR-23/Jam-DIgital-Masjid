import React from 'react';
import { ThemeColorKey } from '../types';
import { getThemePalette } from '../utils/themePalettes';

interface IslamicPlaqueProps {
  themeColor?: ThemeColorKey;
  darkMode?: boolean;
  mosqueName?: string;
  children: React.ReactNode;
  className?: string;
}

export const IslamicPlaque: React.FC<IslamicPlaqueProps> = ({
  themeColor = 'gold',
  darkMode = false,
  mosqueName,
  children,
  className = ''
}) => {
  const theme = getThemePalette(themeColor);

  return (
    <div 
      className={`fixed inset-0 z-50 w-full h-full min-h-screen select-none overflow-hidden flex flex-col justify-between ${
        darkMode ? 'bg-gradient-to-b from-[#060c18] via-[#09152a] to-[#040810] text-white' : 'bg-gradient-to-b from-[#faf5eb] via-[#fffdf7] to-[#f4ebe0] text-slate-900'
      }`}
    >
      {/* 1. FULLSCREEN ISLAMIC ARABESQUE WATERMARK PATTERN (1920x1080) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.07] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, ${theme.primary} 1.5px, transparent 2px),
            linear-gradient(45deg, transparent 48%, ${theme.primary} 49%, ${theme.primary} 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, ${theme.primary} 49%, ${theme.primary} 51%, transparent 52%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 40px 40px'
        }}
      />

      {/* 2. SUBTLE RADIAL GLOW IN CENTER */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkMode
            ? `radial-gradient(circle at 50% 45%, ${theme.glow} 0%, transparent 65%)`
            : `radial-gradient(circle at 50% 45%, rgba(220, 195, 140, 0.25) 0%, transparent 70%)`
        }}
      />

      {/* 3. SVG FULLSCREEN 1920x1080 ISLAMIC ARCHITECTURAL FRAME */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        viewBox="0 0 1920 1080" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="plaqueBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="50%" stopColor={theme.accent} />
            <stop offset="100%" stopColor={theme.primary} />
          </linearGradient>
          <filter id="plaqueGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={theme.primary} floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Outer Rect Border (1920x1080 edge-to-edge with 14px inset) */}
        <rect
          x="14"
          y="14"
          width="1892"
          height="1052"
          rx="18"
          fill="none"
          stroke="url(#plaqueBorderGrad)"
          strokeWidth="3.5"
          filter="url(#plaqueGlow)"
        />

        {/* Inner Fine Hairline Border */}
        <rect
          x="24"
          y="24"
          width="1872"
          height="1032"
          rx="14"
          fill="none"
          stroke={theme.accent}
          strokeWidth="1.2"
          opacity="0.6"
        />

        {/* TOP ARCHED CREST ACCENT (Mihrab crown at the very top edge) */}
        <path
          d="M 800 14
             L 860 14
             Q 960 48 1060 14
             L 1120 14"
          fill="none"
          stroke={theme.primary}
          strokeWidth="3.5"
        />
        <circle cx="960" cy="38" r="4" fill={theme.accent} />

        {/* BOTTOM ARCHED CREST ACCENT */}
        <path
          d="M 800 1066
             L 860 1066
             Q 960 1032 1060 1066
             L 1120 1066"
          fill="none"
          stroke={theme.primary}
          strokeWidth="3.5"
        />
        <circle cx="960" cy="1042" r="4" fill={theme.accent} />

        {/* CORNER 1: TOP-LEFT ISLAMIC ARABESQUE BRACKET */}
        <g transform="translate(24, 24)">
          <path d="M 0 50 L 50 0 M 0 35 L 35 0 M 0 20 L 20 0" stroke={theme.primary} strokeWidth="1.5" opacity="0.75" />
          <polygon points="26,12 32,26 46,32 32,38 26,52 20,38 6,32 20,26" fill={theme.primary} opacity="0.8" />
          <circle cx="26" cy="32" r="2.5" fill="#ffffff" />
        </g>

        {/* CORNER 2: TOP-RIGHT ISLAMIC ARABESQUE BRACKET */}
        <g transform="translate(1896, 24) scale(-1, 1)">
          <path d="M 0 50 L 50 0 M 0 35 L 35 0 M 0 20 L 20 0" stroke={theme.primary} strokeWidth="1.5" opacity="0.75" />
          <polygon points="26,12 32,26 46,32 32,38 26,52 20,38 6,32 20,26" fill={theme.primary} opacity="0.8" />
          <circle cx="26" cy="32" r="2.5" fill="#ffffff" />
        </g>

        {/* CORNER 3: BOTTOM-LEFT ISLAMIC ARABESQUE BRACKET */}
        <g transform="translate(24, 1056) scale(1, -1)">
          <path d="M 0 50 L 50 0 M 0 35 L 35 0 M 0 20 L 20 0" stroke={theme.primary} strokeWidth="1.5" opacity="0.75" />
          <polygon points="26,12 32,26 46,32 32,38 26,52 20,38 6,32 20,26" fill={theme.primary} opacity="0.8" />
          <circle cx="26" cy="32" r="2.5" fill="#ffffff" />
        </g>

        {/* CORNER 4: BOTTOM-RIGHT ISLAMIC ARABESQUE BRACKET */}
        <g transform="translate(1896, 1056) scale(-1, -1)">
          <path d="M 0 50 L 50 0 M 0 35 L 35 0 M 0 20 L 20 0" stroke={theme.primary} strokeWidth="1.5" opacity="0.75" />
          <polygon points="26,12 32,26 46,32 32,38 26,52 20,38 6,32 20,26" fill={theme.primary} opacity="0.8" />
          <circle cx="26" cy="32" r="2.5" fill="#ffffff" />
        </g>
      </svg>

      {/* 4. TOP ISLAMIC HEADER BAND (Tutup bagian atas sepenuhnya tanpa celah) */}
      <header className="relative z-20 w-full pt-8 sm:pt-12 md:pt-14 pb-2 px-8 flex items-center justify-between shrink-0">
        {/* Left: Decorative corner badge / Islamic crescent */}
        <div className="flex items-center gap-2 mt-2 sm:mt-4">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-lg font-bold shadow-md"
            style={{ 
              backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: theme.primary,
              border: `1px solid ${theme.primary}40`
            }}
          >
            ☪
          </div>
          <span 
            className="text-xs font-bold tracking-widest uppercase hidden sm:inline-block"
            style={{ color: theme.primary }}
          >
            TV Digital Masjid
          </span>
        </div>

        {/* Center: Bismillah Calligraphy & Mosque Name */}
        <div className="flex flex-col items-center justify-center text-center mt-4 sm:mt-6 md:mt-8">
          <span 
            className="font-['Amiri',serif] text-xl sm:text-2xl md:text-3xl font-bold leading-tight select-none tracking-wide drop-shadow-sm pt-2"
            style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
            dir="rtl"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </span>
          {mosqueName && (
            <span 
              className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase mt-1.5 opacity-75"
              style={{ color: theme.primary }}
            >
              {mosqueName}
            </span>
          )}
        </div>

        {/* Right slot: Space for skip button (absolute) or symmetric ornament */}
        <div className="w-8 h-8 sm:w-28 flex items-center justify-end" />
      </header>

      {/* 5. CENTER MAIN STAGE (100% Guaranteed no bottom cutoff) */}
      <main className={`relative z-20 flex-1 w-full flex flex-col items-center justify-center text-center px-4 sm:px-8 md:px-16 py-1 max-w-[1600px] mx-auto ${className}`}>
        {children}
      </main>

      {/* 6. BOTTOM DECORATIVE FOOTER BAND */}
      <footer className="relative z-20 w-full pb-3 sm:pb-4 pt-1 px-8 flex items-center justify-center shrink-0">
        <div className="flex items-center justify-center gap-3 w-full max-w-lg opacity-60">
          <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${theme.primary})` }} />
          <span className="text-xs font-serif" style={{ color: theme.primary }}>۞</span>
          <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(to left, transparent, ${theme.primary})` }} />
        </div>
      </footer>

    </div>
  );
};

// Reusable Ornamental Golden Divider matching photo ( —◆— )
export const IslamicPlaqueDivider: React.FC<{ 
  themeColor?: ThemeColorKey; 
  className?: string;
}> = ({
  themeColor = 'gold',
  className = 'my-2 sm:my-3'
}) => {
  const theme = getThemePalette(themeColor);

  return (
    <div className={`flex items-center justify-center w-full max-w-[280px] sm:max-w-[360px] md:max-w-[420px] shrink-0 ${className}`}>
      {/* Left line with round endpoint */}
      <div 
        className="flex-1 h-[2px] rounded-full" 
        style={{ background: `linear-gradient(to right, transparent, ${theme.primary})` }} 
      />
      
      {/* Left small accent bead */}
      <div 
        className="w-1.5 h-1.5 rounded-full mx-1.5 shrink-0" 
        style={{ backgroundColor: theme.primary }} 
      />

      {/* Center 8-point geometric diamond / star emblem (Rub el Hizb) */}
      <div className="shrink-0 flex items-center justify-center mx-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M 12 2 L 15 9 L 22 12 L 15 15 L 12 22 L 9 15 L 2 12 L 9 9 Z"
            fill={theme.primary}
          />
          <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Right small accent bead */}
      <div 
        className="w-1.5 h-1.5 rounded-full mx-1.5 shrink-0" 
        style={{ backgroundColor: theme.primary }} 
      />

      {/* Right line with round endpoint */}
      <div 
        className="flex-1 h-[2px] rounded-full" 
        style={{ background: `linear-gradient(to left, transparent, ${theme.primary})` }} 
      />
    </div>
  );
};
