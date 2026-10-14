import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MosqueConfig, MurattalProgress } from '../types';
import { POPULAR_SURAHS, JUZ_LIST, getSurahAudioUrl } from '../utils/quranData';
import { Volume2, VolumeX, Play, Pause, Bell, CheckCircle2 } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface FridayMurattalPlayerProps {
  currentTime: Date;
  dzuhurTimeStr: string;
  config: MosqueConfig;
  onProgressUpdate?: (progress: MurattalProgress) => void;
}

export const FridayMurattalPlayer: React.FC<FridayMurattalPlayerProps> = ({
  currentTime,
  dzuhurTimeStr,
  config,
  onProgressUpdate
}) => {
  const [progress, setProgress] = useState<MurattalProgress>({
    currentJuz: 18,
    currentSurah: 18,
    currentSurahName: 'Al-Kahf',
    currentAyah: 1,
    totalAyahs: 110,
    playbackSeconds: 0,
    durationSeconds: 1800,
    isPlaying: false,
    lastUpdated: new Date().toISOString()
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAutoPlayingRef = useRef<boolean>(false);

  // Sync with Firestore in real-time
  useEffect(() => {
    const progressDocRef = doc(db, 'murattal_progress', 'current');
    const unsubscribe = onSnapshot(progressDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as MurattalProgress;
        setProgress((prev) => ({
          ...prev,
          ...data
        }));
      }
    }, (error) => {
      console.warn("Firestore murattal listener error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Save progress to Cloud Firebase
  const saveProgressToCloud = useCallback(async (newProgress: Partial<MurattalProgress>) => {
    try {
      const updated: MurattalProgress = {
        ...progress,
        ...newProgress,
        lastUpdated: new Date().toISOString()
      };
      setProgress(updated);
      onProgressUpdate?.(updated);
      
      const progressDocRef = doc(db, 'murattal_progress', 'current');
      await setDoc(progressDocRef, updated, { merge: true });
    } catch (e) {
      console.warn("Failed to sync murattal to cloud:", e);
    }
  }, [progress, onProgressUpdate]);

  // Push Reminder function (both in-app banner and Web Notification)
  const triggerPushReminder = useCallback((surahName: string, ayahNum: number, juzNum: number) => {
    const title = `Ayat ${ayahNum} Surah ${surahName} selesai diputar`;
    const body = `Al-Qur'an Juz ${juzNum} • Menuju kesiapan ibadah Sholat Jum'at`;

    setNotificationMsg(`${title} (${body})`);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 6000);

    // Request & trigger browser native push notification if enabled
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }, []);

  // Check Friday Pre-Dzuhur automatic trigger (60m to 15m before Dzuhur)
  useEffect(() => {
    if (!config.fridayMurattalEnabled) return;

    const isFriday = currentTime.getDay() === 5; // Friday
    const [h, m] = dzuhurTimeStr.split(':').map(Number);
    const dzuhurDate = new Date(currentTime);
    dzuhurDate.setHours(h, m, 0, 0);

    const diffMinutes = (dzuhurDate.getTime() - currentTime.getTime()) / (60 * 1000);

    const startMinutes = config.fridayMurattalStartMinutesBeforeDzuhur || 60;
    const stopMinutes = config.fridayMurattalStopMinutesBeforeDzuhur || 15;

    const shouldAutoPlay = isFriday && diffMinutes <= startMinutes && diffMinutes >= stopMinutes;

    if (shouldAutoPlay && !progress.isPlaying && !isAutoPlayingRef.current) {
      isAutoPlayingRef.current = true;
      saveProgressToCloud({ isPlaying: true });
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.warn('Autoplay error:', e));
      }
    } else if (isFriday && diffMinutes < stopMinutes && progress.isPlaying && isAutoPlayingRef.current) {
      // Reached 15 minutes before Friday Dzuhur - stop automatically
      isAutoPlayingRef.current = false;
      saveProgressToCloud({ isPlaying: false });
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [
    currentTime,
    dzuhurTimeStr,
    config.fridayMurattalEnabled,
    config.fridayMurattalStartMinutesBeforeDzuhur,
    config.fridayMurattalStopMinutesBeforeDzuhur,
    progress.isPlaying,
    saveProgressToCloud
  ]);

  // Audio events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = Math.floor(audioRef.current.currentTime);
      const dur = Math.floor(audioRef.current.duration) || 1800;
      
      // Calculate simulated current ayah based on percentage through surah
      const surahTotalAyahs = progress.totalAyahs || 110;
      const calculatedAyah = Math.min(surahTotalAyahs, Math.max(1, Math.floor((cur / Math.max(1, dur)) * surahTotalAyahs) + 1));
      
      if (calculatedAyah !== progress.currentAyah) {
        triggerPushReminder(progress.currentSurahName, progress.currentAyah, progress.currentJuz);
        saveProgressToCloud({
          currentAyah: calculatedAyah,
          playbackSeconds: cur,
          durationSeconds: dur
        });
      }
    }
  };

  const handleEnded = () => {
    triggerPushReminder(progress.currentSurahName, progress.totalAyahs, progress.currentJuz);
    // Advance to next surah
    const nextSurahNum = progress.currentSurah >= 114 ? 1 : progress.currentSurah + 1;
    const found = POPULAR_SURAHS.find(s => s.number === nextSurahNum);
    saveProgressToCloud({
      currentSurah: nextSurahNum,
      currentSurahName: found ? found.name : `Surah ${nextSurahNum}`,
      currentAyah: 1,
      totalAyahs: found ? found.numberOfAyahs : 100,
      playbackSeconds: 0
    });
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (progress.isPlaying) {
        audioRef.current.pause();
        saveProgressToCloud({ isPlaying: false });
      } else {
        audioRef.current.play().catch(e => console.warn("Audio play blocked:", e));
        saveProgressToCloud({ isPlaying: true });
        
        // Request notification permission if not yet requested
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    }
  };

  const currentAudioUrl = getSurahAudioUrl(progress.currentSurah, config.selectedQari || 'alafasy');

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Push reminder toast in upper right */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950/95 text-white border-2 border-emerald-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-md animate-bounce">
          <div className="flex items-start space-x-3">
            <Bell className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Push Reminder Murattal
              </div>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">
                {notificationMsg}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Murattal floating mini-status widget (subtle on bottom-left) */}
      {progress.isPlaying && (
        <div className="fixed bottom-24 left-8 z-30 bg-slate-950/85 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/40 shadow-xl flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Murattal Jum'at Otomatis Aktif
            </span>
            <span className="text-xs font-bold text-slate-200">
              Juz {progress.currentJuz} • Surah {progress.currentSurahName} (Ayat {progress.currentAyah}/{progress.totalAyahs})
            </span>
          </div>
          <button
            onClick={togglePlay}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Jeda Murattal"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
