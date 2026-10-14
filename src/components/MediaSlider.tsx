import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MediaSlideItem, SlideTransitionEffect } from '../types';
import { Moon } from 'lucide-react';

interface MediaSliderProps {
  slides: MediaSlideItem[];
  intervalSeconds?: number;
  transitionEffect?: SlideTransitionEffect;
  mosqueName?: string;
}

export const MediaSlider: React.FC<MediaSliderProps> = ({
  slides,
  intervalSeconds = 12,
  transitionEffect = 'fade',
  mosqueName = 'MASJID JAMI AL-MUJAHIDIN'
}) => {
  // Filter active slides that have valid non-empty URLs
  // Discard any legacy sample/default placeholder items
  const activeSlides = useMemo(() => {
    if (!Array.isArray(slides)) return [];

    return slides.filter((s) => {
      if (!s || typeof s.url !== 'string') return false;
      const cleanUrl = s.url.trim();
      if (cleanUrl.length === 0) return false;
      if (s.active === false) return false;
      // Filter out any lingering default placeholder slide
      if (s.id === 'default-mosque-banner' || cleanUrl.includes('masjid_al_mujahidin_bg')) return false;
      return true;
    });
  }, [slides]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Keep index within bounds
  useEffect(() => {
    if (activeSlides.length > 0 && currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  const totalSlides = activeSlides.length;
  const currentSlide = totalSlides > 0 ? (activeSlides[currentIndex] || activeSlides[0]) : null;
  const slideDurationSec = Math.max(4, currentSlide?.durationSeconds || intervalSeconds || 12);

  // Smooth slide timer with progress tracking (only runs when 2+ slides exist)
  useEffect(() => {
    if (totalSlides <= 1) {
      setProgressPercent(100);
      return;
    }

    setProgressPercent(0);
    const startTime = Date.now();
    const durationMs = slideDurationSec * 1000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgressPercent(pct);
    }, 100);

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, durationMs);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [currentIndex, totalSlides, slideDurationSec]);

  // Ensure video autoplay when slide becomes active
  useEffect(() => {
    if (currentSlide?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video autoplay notice:', err);
        });
      }
    }
  }, [currentIndex, currentSlide?.type, currentSlide?.url]);

  // Keyboard navigation: Arrow Left / Arrow Right to manually switch slides
  useEffect(() => {
    if (totalSlides <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentIndex((curr) => (curr + 1) % totalSlides);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentIndex((curr) => (curr - 1 + totalSlides) % totalSlides);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  // Dynamic animation class based on chosen transition effect
  const getTransitionClasses = () => {
    switch (transitionEffect) {
      case 'slide':
        return 'animate-slide-in';
      case 'zoom':
        return 'animate-ken-burns';
      case 'fade':
      default:
        return 'animate-fade-in';
    }
  };

  const handleVideoError = useCallback(() => {
    console.warn('Video slide playback failed, advancing to next slide');
    if (totalSlides > 1) {
      setCurrentIndex((curr) => (curr + 1) % totalSlides);
    }
  }, [totalSlides]);

  const handleVideoEnded = useCallback(() => {
    if (totalSlides > 1) {
      setCurrentIndex((curr) => (curr + 1) % totalSlides);
    }
  }, [totalSlides]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#071C14] pointer-events-none select-none">
      {/* Background Architectural Canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A271B] via-[#071C14] to-[#030D08] z-0" />

      {/* CASE 1: No slides uploaded yet -> Dignified Islamic Ambient Backdrop (ZERO sample stock photos) */}
      {totalSlides === 0 && (
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center px-6 animate-fade-in">
          {/* Subtle Islamic 8-pointed star geometry pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `
                radial-gradient(circle at 35px 35px, #D4AF37 3%, transparent 0%),
                radial-gradient(circle at 105px 105px, #D4AF37 3%, transparent 0%)
              `,
              backgroundSize: '140px 140px'
            }}
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-radial from-transparent via-[#071C14]/60 to-[#030D08]/90 pointer-events-none" />

          {/* Serene Mosque Motif Centerpiece */}
          <div className="relative z-10 flex flex-col items-center space-y-4 max-w-2xl px-4 py-8 rounded-3xl bg-[#071C14]/50 backdrop-blur-xs border border-[#D4AF37]/20 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#0F3526] border border-[#D4AF37]/40 flex items-center justify-center text-[#E5C158] shadow-lg shadow-[#000]/50">
              <Moon className="w-8 h-8 fill-[#E5C158]/20" />
            </div>

            <div className="font-arabic text-2xl sm:text-3xl text-[#E5C158] tracking-wider leading-relaxed">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#FAF6EE] tracking-wide uppercase drop-shadow">
                {mosqueName}
              </h2>
              <p className="text-xs sm:text-sm text-[#C4B79D] font-medium">
                Jadwal Sholat & Media Informasi Digital Masjid
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: User-Uploaded Slides Active (Photos or Videos) */}
      {currentSlide && (
        <div
          key={currentSlide.id + '-' + currentIndex}
          className={`relative w-full h-full ${getTransitionClasses()}`}
        >
          {currentSlide.type === 'video' ? (
            <video
              ref={videoRef}
              src={currentSlide.url}
              autoPlay
              loop={totalSlides === 1}
              muted
              playsInline
              preload="auto"
              onError={handleVideoError}
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover transition-opacity duration-1000"
            />
          ) : (
            <img
              src={currentSlide.url}
              alt={currentSlide.title || 'Slide Masjid'}
              className="w-full h-full object-cover transition-all duration-1000"
            />
          )}

          {/* Vignette & soft lighting overlays to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040E0A]/85 via-black/20 to-[#040E0A]/45" />

          {/* Subtle Islamic geometric star pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25px 25px, #D4AF37 2%, transparent 0%),
                radial-gradient(circle at 75px 75px, #D4AF37 2%, transparent 0%)
              `,
              backgroundSize: '100px 100px'
            }}
          />
        </div>
      )}

      {/* No title text on photo slides for pristine full-screen mosque display */}

      {/* Subtle Micro-Slide Indicators & Slim Golden Progress Line */}
      {totalSlides > 1 && (
        <div className="absolute bottom-[98px] left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
          {/* Micro dots */}
          <div className="flex items-center gap-1.5 bg-[#071C14]/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
            {activeSlides.map((s, idx) => (
              <span
                key={s.id || idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-6 bg-[#E5C158] shadow-[0_0_8px_rgba(229,193,88,0.7)]'
                    : 'w-1.5 bg-[#D4AF37]/30'
                }`}
              />
            ))}
          </div>

          {/* Micro Index Indicator */}
          <div className="text-[10px] font-mono text-[#D4AF37]/80 bg-[#071C14]/60 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
            {currentIndex + 1} / {totalSlides}
          </div>
        </div>
      )}

      {/* Micro progress line at very bottom of screen */}
      {totalSlides > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40 z-10">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37]/40 via-[#E5C158] to-[#D4AF37]/40 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
