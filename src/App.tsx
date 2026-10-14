import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MosqueConfig, MurattalProgress, DisplayState, PrayerKey } from './types';
import { DEFAULT_MOSQUE_CONFIG, DEFAULT_MURATTAL_PROGRESS } from './utils/defaultConfig';
import { calculatePrayerTimes, getNextPrayer, NextPrayerInfo, getPrayerTimestamp } from './utils/prayerTimes';
import { getHijriDate, HijriDateResult } from './utils/hijriCalendar';
import { HeaderBar } from './components/HeaderBar';
import { PrayerTimesBar } from './components/PrayerTimesBar';
import { RunningTextMarquee } from './components/RunningTextMarquee';
import { MediaSlider } from './components/MediaSlider';
import { AdzanOverlay } from './components/AdzanOverlay';
import { DoaAdzanOverlay } from './components/DoaAdzanOverlay';
import { IqamahOverlay } from './components/IqamahOverlay';
import { SecretLineTrigger } from './components/SecretLineTrigger';
import { AdminDrawer } from './components/AdminDrawer';
import { KasMasjidBadge } from './components/KasMasjidBadge';
import { FridayMurattalPlayer } from './components/FridayMurattalPlayer';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { 
  saveMosqueConfig, 
  loadMosqueConfig, 
  safeLocalStorageGet, 
  prepareConfigForFirestore,
  mergeCloudWithLocalMedia
} from './utils/storageManager';

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [config, setConfig] = useState<MosqueConfig>(() => {
    const local = safeLocalStorageGet<MosqueConfig>('mosque_config');
    return {
      ...DEFAULT_MOSQUE_CONFIG,
      ...(local || {}),
      slides: Array.isArray(local?.slides) ? local.slides : [],
      runningTexts: Array.isArray(local?.runningTexts) && local.runningTexts.length > 0
        ? local.runningTexts
        : DEFAULT_MOSQUE_CONFIG.runningTexts
    };
  });

  // Load complete configuration (including high-resolution slides) from IndexedDB
  useEffect(() => {
    loadMosqueConfig().then((loaded) => {
      if (loaded && loaded.mosqueName) {
        setConfig((prev) => ({
          ...DEFAULT_MOSQUE_CONFIG,
          ...prev,
          ...loaded,
          slides: Array.isArray(loaded.slides) ? loaded.slides : (Array.isArray(prev.slides) ? prev.slides : []),
          runningTexts: Array.isArray(loaded.runningTexts) && loaded.runningTexts.length > 0
            ? loaded.runningTexts
            : (Array.isArray(prev.runningTexts) && prev.runningTexts.length > 0 ? prev.runningTexts : DEFAULT_MOSQUE_CONFIG.runningTexts)
        }));
      }
    });
  }, []);

  const [murattalProgress, setMurattalProgress] = useState<MurattalProgress>(DEFAULT_MURATTAL_PROGRESS);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [displayState, setDisplayState] = useState<DisplayState>('normal');
  const [activePrayerKey, setActivePrayerKey] = useState<PrayerKey>('magrib');
  const [showSafeZoneGuide, setShowSafeZoneGuide] = useState<boolean>(false);
  
  // Custom durations for simulation or demo mode
  const [adzanPhase, setAdzanPhase] = useState<'pre_adzan' | 'adzan'>('pre_adzan');
  const [targetPrayerTimestamp, setTargetPrayerTimestamp] = useState<number | undefined>(undefined);
  const [customPreAdzanSec, setCustomPreAdzanSec] = useState<number>(180); // 3 minutes
  const [customAdzanSec, setCustomAdzanSec] = useState<number>(180); // 3 minutes
  const [customDoaSec, setCustomDoaSec] = useState<number>(60); // 1 minute
  const [customIqamahMin, setCustomIqamahMin] = useState<number>(10); // 10 minutes
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [testModeType, setTestModeType] = useState<'none' | 'single_test' | 'sequence'>('none');

  // Prevent repeated automatic triggers in the same cycle
  const lastTriggeredPrayerRef = useRef<string | null>(null);

  // Real-time tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Firestore config in real-time & hydrate local media
  useEffect(() => {
    // Immediately load local media & settings from IndexedDB
    loadMosqueConfig().then((local) => {
      if (local) setConfig(local);
    }).catch(() => {});

    const configDocRef = doc(db, 'settings', 'main');
    
    // Seed initial document if not exists
    getDoc(configDocRef).then((snap) => {
      if (!snap.exists()) {
        const payload = prepareConfigForFirestore(DEFAULT_MOSQUE_CONFIG);
        setDoc(configDocRef, payload).catch(() => {});
      } else {
        setIsCloudSynced(true);
      }
    }).catch(() => {});

    const unsubscribe = onSnapshot(configDocRef, async (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data() as MosqueConfig;
        const currentLocal = await loadMosqueConfig();
        const merged = await mergeCloudWithLocalMedia(cloudData, currentLocal);
        const safeMerged: MosqueConfig = {
          ...DEFAULT_MOSQUE_CONFIG,
          ...merged,
          slides: Array.isArray(merged.slides) ? merged.slides : [],
          runningTexts: Array.isArray(merged.runningTexts) && merged.runningTexts.length > 0
            ? merged.runningTexts
            : DEFAULT_MOSQUE_CONFIG.runningTexts
        };
        setConfig(safeMerged);
        await saveMosqueConfig(safeMerged);
        setIsCloudSynced(true);

        // If cloud data still contained legacy demo slides, sanitize cloud document
        const hasLegacySample = Array.isArray(cloudData.slides) && cloudData.slides.some(
          s => s.id === 'slide-1' || s.id === 'default-mosque-banner' || (s.url && s.url.includes('masjid_al_mujahidin_bg'))
        );
        if (hasLegacySample) {
          const cleanedPayload = prepareConfigForFirestore(merged);
          setDoc(configDocRef, cleanedPayload, { merge: true }).catch(() => {});
        }
      }
    }, (error) => {
      // Offline fallback: keep local configuration active
      console.warn("Firestore snapshot notice:", error?.message);
      setIsCloudSynced(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate prayer times
  const prayerTimes = useMemo(() => {
    return calculatePrayerTimes(
      currentTime,
      config.latitude,
      config.longitude,
      config.timezoneOffset,
      config.prayerOffsets
    );
  }, [currentTime, config.latitude, config.longitude, config.timezoneOffset, config.prayerOffsets]);

  // Next prayer and countdown
  const nextPrayer: NextPrayerInfo = useMemo(() => {
    return getNextPrayer(prayerTimes, currentTime);
  }, [prayerTimes, currentTime]);

  // Hijri date
  const hijriDate: HijriDateResult = useMemo(() => {
    return getHijriDate(currentTime, config.hijriAdjustment);
  }, [currentTime, config.hijriAdjustment]);

  // EXACT USER REQUIREMENT:
  // "halaman menjelang azan itu muncul 3 menit sebelum jam azan dan 5 detik di akhir bunyikan alaram 1 kali per detik"
  // "azan di hitung 3 menit. dan langsung berubah ke tampilah pada gambar kedua. 
  // gambar keduaa hanya muncul 1 menit dan langsung ke gambar ke tiga dengan lama 10 menit. 
  // setelah itu kembali ketampilan biasa. tampilan ini hanya muncul pada saat menjelang azan."
  useEffect(() => {
    if (displayState !== 'normal') return;

    const prayerKeysToCheck: PrayerKey[] = ['subuh', 'dzuhur', 'ashar', 'magrib', 'isya'];
    const nowMs = currentTime.getTime();

    for (const pKey of prayerKeysToCheck) {
      const pTimeStr = prayerTimes[pKey];
      if (!pTimeStr) continue;

      const pTimestamp = getPrayerTimestamp(pTimeStr, currentTime);
      const diffMs = pTimestamp - nowMs;

      const configuredAdzanSec = Math.max(30, (config.adzanDurationMinutes || 3) * 60);
      // 3 minutes before adzan = 180,000 ms
      const is3MinPreAdzan = diffMs > 0 && diffMs <= 3 * 60 * 1000;
      const isExactAdzan = diffMs <= 0 && diffMs >= -configuredAdzanSec * 1000; // within configured adzan duration

      const cycleKey = `${pKey}-${currentTime.toDateString()}`;

      if (is3MinPreAdzan && lastTriggeredPrayerRef.current !== cycleKey) {
        lastTriggeredPrayerRef.current = cycleKey;
        setIsTestMode(false);
        setTestModeType('none');
        setActivePrayerKey(pKey);
        setAdzanPhase('pre_adzan');
        setTargetPrayerTimestamp(pTimestamp);
        setCustomPreAdzanSec(Math.max(5, Math.ceil(diffMs / 1000))); // Exact remaining seconds up to 180s
        setCustomAdzanSec(configuredAdzanSec); // Adzan duration configured by user
        setCustomDoaSec(60); // 1 minute doa adzan
        setCustomIqamahMin(config.iqamahDurations?.[pKey] || 10);
        setDisplayState('adzan');
        break;
      } else if (isExactAdzan && lastTriggeredPrayerRef.current !== cycleKey) {
        lastTriggeredPrayerRef.current = cycleKey;
        setIsTestMode(false);
        setTestModeType('none');
        setActivePrayerKey(pKey);
        setAdzanPhase('adzan');
        setTargetPrayerTimestamp(undefined);
        setCustomAdzanSec(Math.max(10, configuredAdzanSec - Math.floor(Math.abs(diffMs) / 1000)));
        setCustomDoaSec(60);
        setCustomIqamahMin(config.iqamahDurations?.[pKey] || 10);
        setDisplayState('adzan');
        break;
      }
    }
  }, [currentTime, prayerTimes, displayState, config.adzanDurationMinutes, config.iqamahDurations]);

  // Save config safely to IndexedDB, safe local storage, and Firestore
  const handleSaveConfig = useCallback(async (newConfig: MosqueConfig) => {
    const updated = {
      ...newConfig,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);

    // Persist reliably to IndexedDB and safe localStorage (never throws QuotaExceededError)
    await saveMosqueConfig(updated);

    try {
      const configDocRef = doc(db, 'settings', 'main');
      const firestorePayload = prepareConfigForFirestore(updated);
      await setDoc(configDocRef, firestorePayload, { merge: true });
      setIsCloudSynced(true);
    } catch {
      // Offline fallback: data is securely saved in IndexedDB & localStorage
      setIsCloudSynced(false);
    }
  }, []);

  // Save murattal progress to cloud
  const handleUpdateMurattalProgress = useCallback(async (part: Partial<MurattalProgress>) => {
    const updated: MurattalProgress = {
      ...murattalProgress,
      ...part,
      lastUpdated: new Date().toISOString()
    };
    setMurattalProgress(updated);
    try {
      const ref = doc(db, 'murattal_progress', 'current');
      await setDoc(ref, updated, { merge: true });
    } catch (err) {
      console.warn("Failed to update murattal progress:", err);
    }
  }, [murattalProgress]);

  // Test overlay modes (individual, full sequence, or fast demo)
  const handleTestDisplay = (mode: 'pre_adzan' | 'adzan' | 'doa_adzan' | 'iqamah' | 'full_sequence' | 'quick_demo') => {
    setActivePrayerKey('magrib');
    setTargetPrayerTimestamp(undefined); // Use custom durations for tests
    setIsTestMode(true);

    if (mode === 'quick_demo') {
      // 10 seconds demo per phase
      setTestModeType('sequence');
      setAdzanPhase('pre_adzan');
      setCustomPreAdzanSec(10); // 10s pre-adzan
      setCustomAdzanSec(10); // 10s adzan with alarm
      setCustomDoaSec(10); // 10s doa
      setCustomIqamahMin(1); // 1 minute (will finish fast)
      setDisplayState('adzan');
    } else if (mode === 'full_sequence') {
      const configuredAdzanSec = Math.max(30, (config.adzanDurationMinutes || 3) * 60);
      setTestModeType('sequence');
      setAdzanPhase('pre_adzan');
      setCustomPreAdzanSec(180); // 3 minutes before adzan
      setCustomAdzanSec(configuredAdzanSec); // Adzan duration according to user config
      setCustomDoaSec(60); // 1 minute doa
      setCustomIqamahMin(10); // 10 minutes iqamah
      setDisplayState('adzan');
    } else if (mode === 'pre_adzan') {
      const configuredAdzanSec = Math.max(30, (config.adzanDurationMinutes || 3) * 60);
      setTestModeType('single_test');
      setAdzanPhase('pre_adzan');
      setCustomPreAdzanSec(180); // 3 minutes (180 detik)
      setCustomAdzanSec(configuredAdzanSec);
      setDisplayState('adzan');
    } else if (mode === 'adzan') {
      const configuredAdzanSec = Math.max(30, (config.adzanDurationMinutes || 3) * 60);
      setTestModeType('single_test');
      setAdzanPhase('adzan');
      setCustomAdzanSec(configuredAdzanSec);
      setDisplayState('adzan');
    } else if (mode === 'doa_adzan') {
      setTestModeType('single_test');
      setCustomDoaSec(60);
      setDisplayState('doa_adzan');
    } else if (mode === 'iqamah') {
      setTestModeType('single_test');
      setCustomIqamahMin(10);
      setDisplayState('iqamah');
    } else {
      setTestModeType('single_test');
      setDisplayState(mode);
    }
  };

  const prayerLabels: Record<PrayerKey, string> = {
    imsak: 'Imsak',
    subuh: 'Subuh',
    syuruq: 'Syuruq',
    dzuhur: 'Dzuhur',
    ashar: 'Ashar',
    magrib: 'Maghrib',
    isya: "Isya'"
  };

  const currentPrayerName = prayerLabels[activePrayerKey] || 'Sholat';
  const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

  // Fullscreen support: Smart TV / PC / Monitor display
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.webkitCurrentFullScreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const lastToggleTimeRef = useRef(0);

  const toggleFullscreen = useCallback(() => {
    const now = Date.now();
    // Debounce to prevent rapid double toggle
    if (now - lastToggleTimeRef.current < 350) return;
    lastToggleTimeRef.current = now;

    const doc = document as any;
    const elem = (document.documentElement || document.body) as any;

    const isCurrentlyFullscreen = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.webkitCurrentFullScreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      const requestMethod =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.webkitRequestFullScreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen;

      if (requestMethod) {
        try {
          const promise = requestMethod.call(elem);
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => {
              console.warn('requestFullscreen on documentElement failed, trying document.body:', err);
              const body = document.body as any;
              const bodyMethod = body.requestFullscreen || body.webkitRequestFullscreen;
              if (bodyMethod) {
                bodyMethod.call(body).catch?.(() => {});
              }
            });
          }
        } catch (err) {
          console.warn('Error invoking requestFullscreen:', err);
        }
      }
    } else {
      const exitMethod =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.webkitCancelFullScreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;

      if (exitMethod) {
        try {
          const promise = exitMethod.call(doc);
          if (promise && typeof promise.catch === 'function') {
            promise.catch?.(() => {});
          }
        } catch (err) {
          console.warn('Error invoking exitFullscreen:', err);
        }
      }
    }
  }, []);

  // Global double click listener: guarantees double-click anywhere on preview enters/exits fullscreen
  useEffect(() => {
    const handleGlobalDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not toggle fullscreen if interacting inside Admin drawer or form inputs
      if (target?.closest('input, textarea, button, select, [role="dialog"], .admin-drawer-content')) {
        return;
      }
      toggleFullscreen();
    };

    window.addEventListener('dblclick', handleGlobalDblClick);
    return () => window.removeEventListener('dblclick', handleGlobalDblClick);
  }, [toggleFullscreen]);

  // Touch screen double-tap support (for touch monitors / Smart TV remotes)
  useEffect(() => {
    let lastTap = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, button, select, [role="dialog"]')) {
        return;
      }
      const now = Date.now();
      const diff = now - lastTap;
      if (diff > 50 && diff < 350) {
        toggleFullscreen();
      }
      lastTap = now;
    };

    window.addEventListener('touchend', handleTouchEnd);
    return () => window.removeEventListener('touchend', handleTouchEnd);
  }, [toggleFullscreen]);

  // Keyboard shortcut: Press 'F' or 'F11' to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  return (
    <div 
      onDoubleClick={toggleFullscreen}
      className={`fixed inset-0 w-full h-full min-h-screen overflow-hidden flex flex-col justify-between font-sans select-none ${config.darkMode ? 'dark' : ''}`}
    >
      
      {/* Background Media Slideshow */}
      <MediaSlider 
        slides={config.slides} 
        intervalSeconds={config.slideTransitionDuration}
        transitionEffect={config.slideTransitionEffect}
        mosqueName={config.mosqueName}
      />

      {/* Kas Masjid amount badge prominently displayed on main page */}
      {config.kasMasjid?.enabled && (
        <KasMasjidBadge 
          kas={config.kasMasjid} 
          themeColor={config.themeColor} 
        />
      )}

      {/* Friday 30 Juz Murattal Audio Player */}
      <FridayMurattalPlayer
        currentTime={currentTime}
        dzuhurTimeStr={prayerTimes.dzuhur}
        config={config}
        onProgressUpdate={setMurattalProgress}
      />

      {/* TOP: Header Bar (Matches User Image 1) */}
      <HeaderBar
        currentTime={currentTime}
        config={config}
        hijriDate={hijriDate}
        isCloudSynced={isCloudSynced}
        isMurattalPlaying={murattalProgress.isPlaying}
        onToggleTheme={() => handleSaveConfig({ ...config, darkMode: !config.darkMode })}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Center Flexible Spacing / Viewport Content */}
      <div className="flex-1 w-full" />

      {/* BOTTOM: Running Text & Prayer Times Bar */}
      <div className="flex flex-col w-full z-20">
        <RunningTextMarquee 
          items={config.runningTexts || []} 
          speed={config.marqueeSpeed} 
          themeColor={config.themeColor} 
          bgStyle={config.marqueeBgStyle}
        />
        <PrayerTimesBar
          prayerTimes={prayerTimes}
          nextPrayer={nextPrayer}
          isDarkMode={config.darkMode}
          themeColor={config.themeColor}
          barStyle={config.barStyle}
          opacity={config.prayerBarOpacity ?? 1.0}
        />
      </div>

      {/* SECRET ADMIN TRIGGER: Thin subtle white line on right edge + Fullscreen quick button */}
      <SecretLineTrigger 
        onOpenAdmin={() => setIsAdminOpen(true)} 
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* SECRET ADMIN DRAWER */}
      <AdminDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        murattalProgress={murattalProgress}
        onSaveConfig={handleSaveConfig}
        onUpdateMurattalProgress={handleUpdateMurattalProgress}
        isCloudSynced={isCloudSynced}
        onTestDisplay={handleTestDisplay}
        showSafeZoneGuide={showSafeZoneGuide}
        onToggleSafeZoneGuide={() => setShowSafeZoneGuide(prev => !prev)}
      />

      {/* SAFE ZONE VISUAL GUIDE OVERLAY (Saat diaktifkan oleh admin untuk kalibrasi gambar latar) */}
      {showSafeZoneGuide && (
        <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between animate-fade-in select-none">
          {/* Top Occlusion Guide Bar */}
          <div className="w-full h-[115px] bg-rose-500/25 border-b-2 border-dashed border-rose-400 flex items-center justify-center">
            <span className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs px-3.5 py-1 rounded-full font-bold shadow-lg">
              ⛔ AREA TERTUTUP BILAH JAM ATAS (~115px) — Hindari Teks / Objek Penting Disini
            </span>
          </div>

          {/* Center Safe Zone */}
          <div className="flex-1 w-full flex items-center justify-center relative my-2 px-6">
            <div className="border-2 border-dashed border-emerald-400/90 bg-emerald-500/10 rounded-3xl w-full h-full flex flex-col items-center justify-center p-6 text-center shadow-inner">
              <span className="bg-emerald-950/90 border-2 border-emerald-400 text-emerald-300 text-sm font-extrabold px-5 py-2 rounded-full shadow-2xl tracking-wide">
                ★ AREA AMAN UTAMA GAMBAR (SAFE ZONE 16:9) ★
              </span>
              <p className="text-white text-xs font-bold mt-2 drop-shadow-md max-w-lg">
                Tempatkan foto kubah/mihrab masjid, poster kegiatan, kaligrafi, dan teks di area hijau ini agar 100% bebas dari tutupan jam atas & jadwal bawah.
              </p>
              <div className="mt-2 text-[11px] text-emerald-200 font-mono bg-black/40 px-3 py-1 rounded-full border border-emerald-500/40">
                Resolusi Ideal: 1920 × 1080 px (Area Bebas: ~760 px di tengah)
              </div>
            </div>
          </div>

          {/* Bottom Occlusion Guide Bar */}
          <div className="w-full h-[190px] bg-rose-500/25 border-t-2 border-dashed border-rose-400 flex items-center justify-center">
            <span className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs px-3.5 py-1 rounded-full font-bold shadow-lg">
              ⛔ AREA TERTUTUP RUNNING TEXT & JADWAL SHOLAT BAWAH (~190px)
            </span>
          </div>

          {/* Floating close button for safe zone guide */}
          <div className="absolute top-24 right-8 pointer-events-auto">
            <button
              onClick={() => setShowSafeZoneGuide(false)}
              className="bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>Tutup Garis Panduan Layar</span>
            </button>
          </div>
        </div>
      )}

      {/* GAMBAR 1: 3 Menit Sebelum Adzan & Saat Adzan 3 Menit (Alarm 5 Detik 1x/detik di akhir) */}
      {displayState === 'adzan' && (
        <AdzanOverlay
          prayerName={currentPrayerName}
          prayerKey={activePrayerKey}
          currentTimeStr={currentTimeStr}
          prayerTimeStr={prayerTimes[activePrayerKey]}
          targetPrayerTimestamp={targetPrayerTimestamp}
          initialPhase={adzanPhase}
          preAdzanDurationSeconds={customPreAdzanSec}
          adzanDurationSeconds={customAdzanSec}
          alarmTone={config.alarmTone}
          themeColor={config.themeColor}
          barStyle={config.barStyle}
          darkMode={config.darkMode}
          mosqueName={config.mosqueName}
          enableSound={config.enableSoundAlerts}
          onComplete={() => {
            if (testModeType === 'single_test') {
              setDisplayState('normal');
              setIsTestMode(false);
              setTestModeType('none');
            } else {
              // Sesuai permintaan pengguna:
              // "doa sesudah azan jangan di hilangkan tapi. hilangakan tobol lewati saja. dan tombol itu hanya muncul di percobaan"
              // Doa Sesudah Adzan tetap masuk dalam siklus otomatis & berurutan
              setDisplayState('doa_adzan');
            }
          }}
        />
      )}

      {/* GAMBAR 2: Doa Sesudah Adzan (1 Menit, Tombol Lewati Hanya Muncul di Mode Percobaan) */}
      {displayState === 'doa_adzan' && (
        <DoaAdzanOverlay
          durationSeconds={customDoaSec}
          isTestMode={isTestMode}
          themeColor={config.themeColor}
          barStyle={config.barStyle}
          darkMode={config.darkMode}
          mosqueName={config.mosqueName}
          prayerName={currentPrayerName}
          onComplete={() => {
            if (testModeType === 'single_test') {
              setDisplayState('normal');
              setIsTestMode(false);
              setTestModeType('none');
            } else {
              setDisplayState('iqamah');
            }
          }}
        />
      )}

      {/* GAMBAR 3: Menjelang Iqamah (Muncul Selama 10 Menit, lalu Kembali ke Tampilan Biasa) */}
      {displayState === 'iqamah' && (
        <IqamahOverlay
          prayerName={currentPrayerName}
          prayerKey={activePrayerKey}
          durationMinutes={customIqamahMin} // Tepat 10 menit
          themeColor={config.themeColor}
          barStyle={config.barStyle}
          darkMode={config.darkMode}
          mosqueName={config.mosqueName}
          enableSound={config.enableSoundAlerts}
          onComplete={() => {
            setDisplayState('normal');
            setIsTestMode(false);
            setTestModeType('none');
          }}
        />
      )}

    </div>
  );
}
