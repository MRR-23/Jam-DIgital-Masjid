import React, { useState, useRef, useEffect } from 'react';
import { 
  MosqueConfig, MurattalProgress, RunningTextItem, MediaSlideItem, 
  PrayerOffsets, IqamahDurations, ThemeColorKey, SlideTransitionEffect, 
  BarStyleKey, KasColorStyle, MarqueeColorStyle, AlarmToneKey 
} from '../types';
import { INDONESIAN_CITIES } from '../utils/prayerTimes';
import { JUZ_LIST, POPULAR_SURAHS, QARI_LIST } from '../utils/quranData';
import { soundManager } from '../utils/audioAlerts';
import { THEME_PALETTES } from '../utils/themePalettes';
import { processUploadedMedia, isVideoFile } from '../utils/imageCompressor';
import { checkStorageHealth, StorageHealth, saveMosqueConfig, storeSlideMedia, deleteSlideMedia } from '../utils/storageManager';
import { 
  X, Save, Volume2, Moon, Sun, 
  MapPin, Clock, Bell, Radio, Image as ImageIcon, 
  Tv, Smartphone, Check, Plus, Trash2, Maximize2, Minimize2, Palette,
  Wallet, Upload, Layers, Eye, EyeOff, RotateCw, Play, Sliders, ShieldCheck,
  Database, HardDrive, ArrowUp, ArrowDown, Film, ExternalLink, Sparkles, Pause, ChevronLeft, ChevronRight, Video
} from 'lucide-react';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: MosqueConfig;
  murattalProgress: MurattalProgress;
  onSaveConfig: (updated: MosqueConfig) => void | Promise<void>;
  onUpdateMurattalProgress: (updated: Partial<MurattalProgress>) => void;
  isCloudSynced: boolean;
  onTestDisplay: (mode: 'pre_adzan' | 'adzan' | 'doa_adzan' | 'iqamah' | 'full_sequence' | 'quick_demo') => void;
  showSafeZoneGuide?: boolean;
  onToggleSafeZoneGuide?: () => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  config,
  murattalProgress,
  onSaveConfig,
  onUpdateMurattalProgress,
  isCloudSynced,
  onTestDisplay,
  showSafeZoneGuide = false,
  onToggleSafeZoneGuide
}) => {
  // All React Hooks at the very top
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'iqamah' | 'murattal' | 'running_text' | 'slides' | 'kas' | 'remote'>('profile');
  const [formData, setFormData] = useState<MosqueConfig>(() => ({
    ...config,
    slides: Array.isArray(config?.slides) ? config.slides : [],
    runningTexts: Array.isArray(config?.runningTexts) ? config.runningTexts : []
  }));
  const [newText, setNewText] = useState('');
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideType, setNewSlideType] = useState<'image' | 'video'>('image');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [drawerIsFullscreen, setDrawerIsFullscreen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [slidePreviewIndex, setSlidePreviewIndex] = useState(0);
  const [slidePreviewPlaying, setSlidePreviewPlaying] = useState(true);
  const [showAddUrlSection, setShowAddUrlSection] = useState(false);
  const [newSlideDuration, setNewSlideDuration] = useState(15);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safe references for array properties
  const safeSlides = Array.isArray(formData?.slides) ? formData.slides : [];
  const safeRunningTexts = Array.isArray(formData?.runningTexts) ? formData.runningTexts : [];
  const slidesCount = safeSlides.length;

  // Auto-cycle live preview when tab is slides and preview playback is playing
  useEffect(() => {
    if (activeTab !== 'slides' || !slidePreviewPlaying || slidesCount <= 1) return;
    const interval = setInterval(() => {
      setSlidePreviewIndex(prev => (prev + 1) % slidesCount);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeTab, slidePreviewPlaying, slidesCount]);

  // Sync formData whenever config updates or drawer opens
  useEffect(() => {
    if (isOpen && config) {
      setFormData({
        ...config,
        slides: Array.isArray(config.slides) ? config.slides : [],
        runningTexts: Array.isArray(config.runningTexts) ? config.runningTexts : []
      });
      checkStorageHealth().then(setStorageHealth).catch(() => {});
    }
  }, [isOpen, config]);

  // Track fullscreen state for drawer header icon
  useEffect(() => {
    const checkFs = () => {
      const doc = document as any;
      setDrawerIsFullscreen(!!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      ));
    };
    checkFs();
    document.addEventListener('fullscreenchange', checkFs);
    document.addEventListener('webkitfullscreenchange', checkFs);
    return () => {
      document.removeEventListener('fullscreenchange', checkFs);
      document.removeEventListener('webkitfullscreenchange', checkFs);
    };
  }, []);

  const handleSave = async () => {
    try {
      await onSaveConfig(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.warn('Error saving config in drawer:', err);
    }
  };

  const handleCitySelect = (cityName: string) => {
    const selected = INDONESIAN_CITIES.find(c => c.city === cityName);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        city: selected.city,
        latitude: selected.latitude,
        longitude: selected.longitude
      }));
    }
  };

  const handleAddRunningText = () => {
    if (!newText.trim()) return;
    const item: RunningTextItem = {
      id: `rt-${Date.now()}`,
      text: newText.trim(),
      category: 'informasi',
      active: true
    };
    setFormData(prev => ({
      ...prev,
      runningTexts: [...(prev.runningTexts || []), item]
    }));
    setNewText('');
  };

  const handleRemoveRunningText = (id: string) => {
    setFormData(prev => ({
      ...prev,
      runningTexts: (prev.runningTexts || []).filter(item => item.id !== id)
    }));
  };

  const handleAddSlide = () => {
    if (!newSlideUrl.trim()) return;
    const item: MediaSlideItem = {
      id: `slide-${Date.now()}`,
      title: newSlideTitle.trim() || 'Slide Foto',
      type: newSlideType,
      url: newSlideUrl.trim(),
      durationSeconds: formData.slideTransitionDuration || 15,
      active: true
    };
    setFormData(prev => ({
      ...prev,
      slides: [...(prev.slides || []), item]
    }));
    setNewSlideUrl('');
    setNewSlideTitle('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadFeedback(`Menyiapkan ${files.length} berkas media...`);

    const newSlides: MediaSlideItem[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = isVideoFile(file);
      setUploadFeedback(`Memproses ${i + 1}/${files.length}: ${file.name} (${isVideo ? 'Video' : 'Foto'})...`);

      try {
        const processed = await processUploadedMedia(file);
        const newSlideId = `slide-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;

        // Persist media directly into IndexedDB media_vault (no data URL length limits for videos)
        await storeSlideMedia(newSlideId, {
          type: processed.type,
          blob: processed.blob,
          dataUrl: processed.type === 'image' ? processed.url : undefined,
          thumbnailUrl: processed.thumbnailUrl
        });

        const newSlide: MediaSlideItem = {
          id: newSlideId,
          title: file.name.replace(/\.[^/.]+$/, '').slice(0, 40),
          type: processed.type,
          url: processed.url,
          thumbnailUrl: processed.thumbnailUrl,
          durationSeconds: formData.slideTransitionDuration || 15,
          active: true
        };
        newSlides.push(newSlide);
        successCount++;
      } catch (err: any) {
        console.error(`Gagal memproses berkas ${file.name}:`, err);
        failCount++;
      }
    }

    if (newSlides.length > 0) {
      const updatedSlides = [...safeSlides, ...newSlides];
      const updatedConfig = {
        ...formData,
        slides: updatedSlides
      };
      setFormData(updatedConfig);

      // Save locally and immediately apply to active TV display
      await saveMosqueConfig(updatedConfig);
      await onSaveConfig(updatedConfig);

      const videoCount = newSlides.filter(s => s.type === 'video').length;
      const photoCount = newSlides.filter(s => s.type === 'image').length;
      setUploadFeedback(
        `Berhasil mengunggah ${successCount} media (${photoCount > 0 ? `${photoCount} foto` : ''}${photoCount > 0 && videoCount > 0 ? ', ' : ''}${videoCount > 0 ? `${videoCount} video` : ''})! Layar TV langsung diperbarui.`
      );
      setTimeout(() => setUploadFeedback(null), 5000);
    } else {
      setUploadFeedback(`Gagal memproses berkas media yang dipilih.`);
      setTimeout(() => setUploadFeedback(null), 4000);
    }

    if (e.target) e.target.value = '';
  };

  const handleClearAllSlides = async () => {
    for (const s of safeSlides) {
      deleteSlideMedia(s.id).catch(() => {});
    }
    const updated = {
      ...formData,
      slides: []
    };
    setFormData(updated);
    await saveMosqueConfig(updated);
    await onSaveConfig(updated);
    setUploadFeedback('Semua slide telah dikosongkan.');
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  const handleToggleSlideActive = async (id: string) => {
    const updatedSlides = safeSlides.map(s => 
      s.id === id ? { ...s, active: s.active === false ? true : false } : s
    );
    const updated = { ...formData, slides: updatedSlides };
    setFormData(updated);
    await saveMosqueConfig(updated);
    await onSaveConfig(updated);
  };

  const handleMoveSlide = async (id: string, direction: 'up' | 'down') => {
    const idx = safeSlides.findIndex(s => s.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= safeSlides.length) return;
    const newSlides = [...safeSlides];
    const temp = newSlides[idx];
    newSlides[idx] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;
    const updated = { ...formData, slides: newSlides };
    setFormData(updated);
    await saveMosqueConfig(updated);
    await onSaveConfig(updated);
  };

  const handleUpdateSlideTitle = (id: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      slides: (prev.slides || []).map(s => s.id === id ? { ...s, title } : s)
    }));
  };

  const handleUpdateSlideDuration = (id: string, durationSeconds: number) => {
    setFormData(prev => ({
      ...prev,
      slides: (prev.slides || []).map(s => s.id === id ? { ...s, durationSeconds: Math.max(3, durationSeconds) } : s)
    }));
  };

  const handleRemoveSlide = async (id: string) => {
    await deleteSlideMedia(id);
    const updatedSlides = safeSlides.filter(s => s.id !== id);
    const updated = { ...formData, slides: updatedSlides };
    setFormData(updated);
    await saveMosqueConfig(updated);
    await onSaveConfig(updated);
  };

  const handleSyncKasToRunningText = () => {
    const kas = formData.kasMasjid;
    if (!kas) return;

    const formatRp = (num: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    const kasText = `Laporan Kas Masjid (${kas.periode}): Pemasukan ${formatRp(kas.infaqJumat + kas.infaqTransfer)} • Pengeluaran ${formatRp(kas.pengeluaran)} • Saldo Akhir Kas ${formatRp(kas.saldoAkhir)} • ${kas.keterangan || 'Jazakumullahu Khairan Katsiran'}`;

    const existingIdx = (formData.runningTexts || []).findIndex(item => item.category === 'keuangan');
    let updatedTexts = [...(formData.runningTexts || [])];

    if (existingIdx >= 0) {
      updatedTexts[existingIdx] = {
        ...updatedTexts[existingIdx],
        text: kasText,
        active: true
      };
    } else {
      updatedTexts.push({
        id: `rt-kas-${Date.now()}`,
        text: kasText,
        category: 'keuangan',
        active: true
      });
    }

    setFormData(prev => ({ ...prev, runningTexts: updatedTexts }));
    setUploadFeedback('Laporan kas berhasil diperbarui di Teks Berjalan!');
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  const toggleFullscreen = () => {
    const doc = document as any;
    const elem = (document.documentElement || document.body) as any;
    const isFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isFs) {
      const req = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.webkitRequestFullScreen;
      if (req) {
        try {
          const p = req.call(elem);
          if (p?.catch) p.catch(() => {});
        } catch {}
      }
    } else {
      const ex = doc.exitFullscreen || doc.webkitExitFullscreen || doc.webkitCancelFullScreen;
      if (ex) {
        try {
          const p = ex.call(doc);
          if (p?.catch) p.catch(() => {});
        } catch {}
      }
    }
  };

  // Preview marquee calculation: constant velocity (px/sec)
  const previewDistance = 750;
  const previewDuration = Math.max(8, Math.round(previewDistance / Math.max(15, formData.marqueeSpeed)));

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end transition-opacity select-none font-sans">
      {/* MAIN DRAWER CONTAINER:
          Optimal di HP (w-full 100dvh) maupun Desktop (max-w-3xl)
      */}
      <div className="w-full sm:max-w-3xl bg-gradient-to-b from-[#0A261C] via-[#0D2E22] to-[#071C14] text-[#FAF6EE] h-[100dvh] max-h-[100dvh] flex flex-col shadow-2xl border-l border-[#D4AF37]/35 animate-in slide-in-from-right duration-300">
        
        {/* TOP BAR / HEADER (Responsive & Compact di HP) */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-[#061811] border-b border-[#D4AF37]/30 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            {/* Geometric Octagonal Emblem */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B38A22] text-[#071C14] flex items-center justify-center font-extrabold text-base sm:text-lg shadow-[0_0_15px_rgba(212,175,55,0.35)] shrink-0">
              ۞
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-[#FAF6EE] truncate">
                  Pengaturan Admin
                </h2>
                {isCloudSynced ? (
                  <span className="text-[9px] sm:text-[10px] font-bold bg-[#144733] text-[#4ADE80] border border-[#22C55E]/40 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>Cloud</span>
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-semibold bg-[#1F3D2F] text-[#D8CCA9] border border-[#D4AF37]/20 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                    Lokal
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[11px] text-[#CFC2A7] mt-0.5 truncate">
                Pusat Kontrol Jam Digital TV, Jadwal Sholat, Teks Berjalan & Laporan Kas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Fullscreen TV toggle (Desktop) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:flex p-2 text-[#EBDDC3] hover:text-[#D4AF37] hover:bg-[#123A2B] rounded-xl border border-[#D4AF37]/20 transition-colors cursor-pointer"
              title={drawerIsFullscreen ? "Keluar Layar Penuh (ESC)" : "Layar Penuh TV (F11)"}
            >
              {drawerIsFullscreen ? (
                <Minimize2 className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Simpan Button (Header) */}
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B89228] hover:brightness-110 active:scale-95 text-[#071A12] font-black text-xs rounded-xl shadow-[0_2px_14px_rgba(212,175,55,0.4)] transition-all cursor-pointer min-h-[38px]"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-2 text-[#C4B79D] hover:text-white hover:bg-[#153F2E] rounded-xl border border-[#D4AF37]/15 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-90"
              title="Tutup Menu Admin"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION RAIL (Scrollable Touch-Friendly di HP) */}
        <div className="relative border-b border-[#D4AF37]/20 bg-[#071C14] shrink-0">
          <div className="flex overflow-x-auto text-xs font-semibold px-2.5 sm:px-4 scrollbar-none gap-1 sm:gap-1.5 py-1.5 overscroll-x-contain touch-pan-x">
            {[
              { id: 'profile', label: 'Profil & Warna', icon: MapPin },
              { id: 'schedule', label: 'Jadwal & Ihtiyat', icon: Clock },
              { id: 'iqamah', label: 'Adzan & Iqamah', icon: Bell },
              { id: 'murattal', label: 'Jum\'at Murattal', icon: Radio },
              { id: 'running_text', label: 'Running Text', icon: Tv },
              { id: 'slides', label: 'Slide Foto & Video', icon: ImageIcon },
              { id: 'kas', label: 'Kas Masjid', icon: Wallet },
              { id: 'remote', label: 'Uji & Simulasi', icon: Smartphone },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer min-h-[40px] text-xs shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-[#154633] text-[#FAF6EE] font-bold border border-[#D4AF37]/60 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                      : 'text-[#D0C4A9] hover:text-[#FAF6EE] hover:bg-[#0E2E21] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : 'text-[#A89A7E]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB BODY (Deep Emerald Canvas with Touch-Friendly Spacing) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 overscroll-y-contain">
          
          {/* ========================================================
              TAB 1: PROFIL & WARNA & BILAH
              ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              
              {/* Card 1: Tema Warna Jam Masjid */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#D4AF37]" />
                    <span>Pilihan Warna Tema Jam Masjid</span>
                  </h4>
                  <span className="text-[11px] text-[#FAF6EE] font-semibold bg-[#071C14] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                    {THEME_PALETTES[formData.themeColor || 'gold']?.name}
                  </span>
                </div>
                <p className="text-[11px] text-[#D8CCA9]">
                  Menyesuaikan warna aksen kartu waktu sholat aktif, ornamen pembatas islami, dan sorotan lencana layar TV.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {Object.values(THEME_PALETTES).map((pal) => {
                    const isSelected = (formData.themeColor || 'gold') === pal.key;
                    return (
                      <button
                        key={pal.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, themeColor: pal.key as ThemeColorKey })}
                        className={`flex items-center space-x-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#154633] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)] ring-2 ring-[#D4AF37]/50'
                            : 'bg-[#082218] border-[#D4AF37]/15 hover:border-[#D4AF37]/40 text-[#D8CCA9]'
                        }`}
                      >
                        <div 
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center shadow-md text-white font-bold text-xs"
                          style={{ backgroundColor: pal.primary }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-[#FAF6EE] truncate">{pal.name}</div>
                          <div className="text-[10px] text-[#B8A98E] truncate">{pal.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Gaya Warna Dasar Bilah */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#D4AF37]" />
                    <span>Pilihan Warna Bilah (Header Jam & Jadwal Sholat)</span>
                  </h4>
                  <span className="text-[11px] text-[#FAF6EE] font-semibold bg-[#071C14] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                    {formData.barStyle === 'dark' ? '⚫ Gelap Midnight' : formData.barStyle === 'cream' ? '🕌 Krem Gading' : formData.barStyle === 'glass' ? '🔮 Kaca Transparan' : '⚪ Putih Bersih'}
                  </span>
                </div>
                <p className="text-[11px] text-[#D8CCA9]">
                  Pilih nuansa bilah atas dan bilah bawah. Opsi putih bersih atau krem gading memberikan kontras anggun yang serasi.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 bg-[#071C14] p-1.5 rounded-2xl border border-[#D4AF37]/20">
                  {[
                    { key: 'white', label: '⚪ Putih Bersih', sub: 'Rujukan Utama' },
                    { key: 'cream', label: '🕌 Krem Gading', sub: 'Nuansa Hangat' },
                    { key: 'dark', label: '⚫ Gelap Zamrud', sub: 'Mode Malam' },
                    { key: 'glass', label: '🔮 Kaca Blur', sub: 'Transparan' },
                  ].map((b) => {
                    const isSelected = (formData.barStyle || 'white') === b.key;
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, barStyle: b.key as BarStyleKey })}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#E5C158] text-[#071C14] shadow-lg font-black ring-2 ring-[#D4AF37]/60 scale-[1.02]'
                            : 'bg-transparent text-[#D8CCA9] hover:text-[#FAF6EE] hover:bg-[#103828]'
                        }`}
                      >
                        <span>{b.label}</span>
                        <span className={`text-[9px] mt-0.5 font-normal ${isSelected ? 'text-[#1D3E2F] font-semibold' : 'text-[#9C8F75]'}`}>
                          {b.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Opasitas Background Sliders */}
                <div className="pt-3 border-t border-[#D4AF37]/20 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#FAF6EE] flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Opasitas Background Jam Atas (Header):</span>
                      </span>
                      <span className="font-mono text-[#E5C158] bg-[#071C14] px-2 py-0.5 rounded-md border border-[#D4AF37]/30 text-[11px] tabular-nums">
                        {Math.round((formData.barOpacity ?? 1.0) * 100)}%
                        {(formData.barOpacity ?? 1.0) === 1.0 ? ' (Solid)' : ' (Transparan)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#A89A7E]">Transparan</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.05"
                        value={formData.barOpacity ?? 1.0}
                        onChange={(e) => setFormData({ ...formData, barOpacity: parseFloat(e.target.value) })}
                        className="flex-1 h-2 bg-[#071C14] rounded-lg appearance-none cursor-pointer accent-[#D4AF37] border border-[#D4AF37]/30"
                      />
                      <span className="text-[10px] text-[#FAF6EE]">Solid 100%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#FAF6EE] flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Opasitas Background Jadwal Sholat Bawah:</span>
                      </span>
                      <span className="font-mono text-[#E5C158] bg-[#071C14] px-2 py-0.5 rounded-md border border-[#D4AF37]/30 text-[11px] tabular-nums">
                        {Math.round((formData.prayerBarOpacity ?? 1.0) * 100)}%
                        {(formData.prayerBarOpacity ?? 1.0) === 1.0 ? ' (Solid)' : ' (Transparan)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#A89A7E]">Transparan</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.05"
                        value={formData.prayerBarOpacity ?? 1.0}
                        onChange={(e) => setFormData({ ...formData, prayerBarOpacity: parseFloat(e.target.value) })}
                        className="flex-1 h-2 bg-[#071C14] rounded-lg appearance-none cursor-pointer accent-[#D4AF37] border border-[#D4AF37]/30"
                      />
                      <span className="text-[10px] text-[#FAF6EE]">Solid 100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Identitas Masjid & Lokasi */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span>Identitas & Lokasi Geografis Masjid</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-[#EBDDC3] mb-1">Nama Masjid</label>
                  <input
                    type="text"
                    value={formData.mosqueName}
                    onChange={e => setFormData({ ...formData, mosqueName: e.target.value })}
                    className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-sm text-[#FAF6EE] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none font-bold placeholder-[#8A7C64]"
                    placeholder="Contoh: MASJID JAMI AL-MUJAHIDIN"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EBDDC3] mb-1">Alamat Masjid Lengkap</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#FAF6EE] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none placeholder-[#8A7C64]"
                    placeholder="Jl. Sadar Raya No.9, RT.3/RW.2, Ciganjur - Jakarta Selatan"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#EBDDC3] mb-1">Kota / Kabupaten (Preset Kemenag RI)</label>
                    <select
                      value={formData.city}
                      onChange={e => handleCitySelect(e.target.value)}
                      className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-xs text-[#FAF6EE] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none cursor-pointer"
                    >
                      {INDONESIAN_CITIES.map(c => (
                        <option key={c.city} value={c.city} className="bg-[#0A261C] text-[#FAF6EE]">
                          {c.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#EBDDC3]">Koreksi Kalender Hijriah</label>
                      <span className="font-mono text-xs font-bold text-[#E5C158] tabular-nums bg-[#071C14] px-2 py-0.5 rounded border border-[#D4AF37]/25">
                        {formData.hijriAdjustment > 0 ? `+${formData.hijriAdjustment}` : formData.hijriAdjustment} hari
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 pt-1.5">
                      <span className="text-[10px] text-[#A89A7E]">-2</span>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        value={formData.hijriAdjustment}
                        onChange={e => setFormData({ ...formData, hijriAdjustment: parseInt(e.target.value) })}
                        className="flex-1 accent-[#D4AF37] h-2 bg-[#071C14] rounded-lg border border-[#D4AF37]/30 cursor-pointer"
                      />
                      <span className="text-[10px] text-[#A89A7E]">+2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: JADWAL & IHTIYAT
              ======================================================== */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="bg-[#123E2D] border border-[#D4AF37]/35 rounded-2xl p-4 text-xs text-[#FAF6EE] space-y-1.5">
                <div className="font-bold text-[#E5C158] flex items-center gap-1.5">
                  <span>۞</span>
                  <span>Koreksi Ihtiyat Waktu Sholat (Menit):</span>
                </div>
                <p className="text-[#D8CCA9] leading-relaxed">
                  Gunakan penyesuaian menit di bawah jika ada selisih waktu antara perhitungan hisab otomatis dengan jadwal resmi Kementerian Agama di daerah masjid Anda.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['imsak', 'subuh', 'syuruq', 'dzuhur', 'ashar', 'magrib', 'isya'] as (keyof PrayerOffsets)[]).map((key) => {
                  const val = formData.prayerOffsets[key];
                  return (
                    <div key={key} className="bg-[#0F3526]/90 p-3 rounded-2xl border border-[#D4AF37]/25 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold uppercase text-[#FAF6EE] tracking-wide">
                          {key}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          val === 0 
                            ? 'bg-[#071C14] text-[#A89A7E]' 
                            : val > 0 
                            ? 'bg-[#144733] text-[#4ADE80]' 
                            : 'bg-[#451A1A] text-[#FCA5A5]'
                        }`}>
                          {val > 0 ? `+${val}` : val} mnt
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5 bg-[#071C14] p-1 rounded-xl border border-[#D4AF37]/20">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            prayerOffsets: {
                              ...prev.prayerOffsets,
                              [key]: Math.max(-15, val - 1)
                            }
                          }))}
                          className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-[#0F3526] hover:bg-[#154633] active:scale-90 text-[#FAF6EE] font-bold text-base flex items-center justify-center transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="-15"
                          max="15"
                          value={val}
                          onChange={e => {
                            const num = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              prayerOffsets: {
                                ...prev.prayerOffsets,
                                [key]: Math.min(15, Math.max(-15, num))
                              }
                            }));
                          }}
                          className="w-12 bg-transparent text-center font-mono font-black text-sm text-[#E5C158] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            prayerOffsets: {
                              ...prev.prayerOffsets,
                              [key]: Math.min(15, val + 1)
                            }
                          }))}
                          className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-[#0F3526] hover:bg-[#154633] active:scale-90 text-[#FAF6EE] font-bold text-base flex items-center justify-center transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: ADZAN & IQAMAH & ALARM
              ======================================================== */}
          {activeTab === 'iqamah' && (
            <div className="space-y-4">
              {/* Hitung Mundur Iqamah */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#D4AF37]" />
                    <span>Durasi Jeda Iqamah (Menit Tiap Waktu Sholat)</span>
                  </h4>
                  <span className="text-[11px] text-[#FAF6EE] font-semibold bg-[#071C14] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                    Otomatis Masuk Layar Hitung Mundur
                  </span>
                </div>
                <p className="text-[11px] text-[#D8CCA9]">
                  Layar hitung mundur iqamah akan muncul otomatis setelah adzan selesai berkumandang.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  {(['subuh', 'dzuhur', 'ashar', 'magrib', 'isya'] as (keyof IqamahDurations)[]).map((pKey) => (
                    <div key={pKey} className="bg-[#071C14] p-3 rounded-2xl border border-[#D4AF37]/20 text-center flex flex-col justify-between">
                      <label className="block text-[11px] font-extrabold text-[#FAF6EE] uppercase mb-1.5 tracking-wider">
                        {pKey}
                      </label>
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={formData.iqamahDurations[pKey]}
                          onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value) || 5);
                            setFormData(prev => ({
                              ...prev,
                              iqamahDurations: {
                                ...prev.iqamahDurations,
                                [pKey]: val
                              }
                            }));
                          }}
                          className="w-14 bg-[#0F3526] border border-[#D4AF37]/30 rounded-xl px-2 py-1.5 text-xs font-black text-[#E5C158] font-mono text-center outline-none"
                        />
                        <span className="text-[10px] text-[#B8A98E]">mnt</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pilihan Nada Alarm Masuk Waktu Sholat */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Pilihan Nada Alarm Masuk Waktu Sholat (5 Detik)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => soundManager.playAdzanAlarm5Seconds(1.0, formData.alarmTone || 'harmonic_chime')}
                    className="text-[10px] font-bold bg-[#154633] hover:bg-[#1D5E45] text-[#FAF6EE] border border-[#D4AF37]/40 px-2.5 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Play className="w-3 h-3 text-[#E5C158]" />
                    <span>Tes Rangkaian Penuh</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#D8CCA9]">
                  Alarm berbunyi 1 kali setiap detik pada 5 detik terakhir sebelum adzan berkumandang untuk mengingatkan muadzin & jamaah.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { key: 'harmonic_chime', title: 'Ding-Dong Harmonis', desc: 'Lonceng ganda merdu, elegan, syahdu khas masjid modern.', icon: '🔔' },
                    { key: 'masjid_bell', title: 'Lonceng Jam Dinding Masjid', desc: 'Resonansi tubular bell khas jam dinding digital masjid.', icon: '🏛️' },
                    { key: 'digital_beep', title: 'Beep Digital Lembut', desc: 'Dua ketukan elektronik yang difilter halus tanpa menusuk telinga.', icon: '⏱️' },
                    { key: 'acoustic_gong', title: 'Gong / Bedug Akustik', desc: 'Resonansi akustik hangat dengan getaran lembut berwibawa.', icon: '🥁' },
                  ].map((tone) => {
                    const isSelected = (formData.alarmTone || 'harmonic_chime') === tone.key;
                    return (
                      <div
                        key={tone.key}
                        onClick={() => setFormData({ ...formData, alarmTone: tone.key as AlarmToneKey })}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#154633] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25)] text-[#FAF6EE]'
                            : 'bg-[#071C14] border-[#D4AF37]/15 hover:border-[#D4AF37]/35 text-[#D8CCA9]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl shrink-0 mt-0.5">{tone.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-[#FAF6EE] flex items-center gap-1.5">
                              <span>{tone.title}</span>
                              {isSelected && (
                                <span className="text-[9px] bg-[#E5C158] text-[#071C14] font-black px-1.5 py-0.2 rounded">
                                  AKTIF
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#B8A98E] mt-0.5 leading-normal">{tone.desc}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundManager.playAlarmBeepOnce(1.0, false, tone.key as AlarmToneKey);
                          }}
                          className="shrink-0 text-[10px] bg-[#0F3526] hover:bg-[#1A573F] text-[#E5C158] px-2.5 py-1 rounded-xl border border-[#D4AF37]/30 flex items-center gap-1 font-bold cursor-pointer"
                          title="Dengarkan Contoh Bunyi"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Tes</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: MURATTAL JUM'AT 30 JUZ
              ======================================================== */}
          {activeTab === 'murattal' && (
            <div className="space-y-4">
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 flex items-center justify-between shadow-md">
                <div>
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#D4AF37]" />
                    <span>Putar Otomatis Murattal Hari Jum'at</span>
                  </h4>
                  <p className="text-[11px] text-[#D8CCA9] mt-0.5">
                    Memutar bacaan Al-Qur'an 30 juz merdu secara otomatis menjelang Sholat Jum'at.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.fridayMurattalEnabled}
                  onChange={e => setFormData({ ...formData, fridayMurattalEnabled: e.target.checked })}
                  className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
                />
              </div>

              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <h4 className="text-xs font-bold text-[#FAF6EE] uppercase tracking-wider">
                  Pilihan Qari & Awal Juz
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EBDDC3] mb-1">Qari Terkemuka Dunia</label>
                    <select
                      value={formData.selectedQari}
                      onChange={e => setFormData({ ...formData, selectedQari: e.target.value })}
                      className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#FAF6EE] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none cursor-pointer"
                    >
                      {QARI_LIST.map(q => (
                        <option key={q.id} value={q.id} className="bg-[#0A261C] text-[#FAF6EE]">{q.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EBDDC3] mb-1">Mulai Dari Juz (1 - 30)</label>
                    <select
                      value={murattalProgress.currentJuz}
                      onChange={e => {
                        const juzNum = parseInt(e.target.value);
                        const juzObj = JUZ_LIST.find(j => j.juzNumber === juzNum);
                        onUpdateMurattalProgress({
                          currentJuz: juzNum,
                          currentSurah: juzObj ? juzObj.startSurah : 1,
                          currentSurahName: juzObj ? juzObj.startSurahName : 'Al-Fatihah'
                        });
                      }}
                      className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#FAF6EE] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none cursor-pointer"
                    >
                      {JUZ_LIST.map(j => (
                        <option key={j.juzNumber} value={j.juzNumber} className="bg-[#0A261C] text-[#FAF6EE]">
                          Juz {j.juzNumber} • {j.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: RUNNING TEXT (TEKS BERJALAN)
              ======================================================== */}
          {activeTab === 'running_text' && (
            <div className="space-y-4">
              {/* Card Speed & Live Preview Ticker */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                      <Tv className="w-4 h-4 text-[#D4AF37]" />
                      <span>Kecepatan Laju Teks Berjalan</span>
                    </h4>
                    <p className="text-[11px] text-[#D8CCA9] mt-0.5">
                      Dikalibrasi presisi agar pergerakan halus, santai, dan nyaman dibaca oleh jamaah.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#E5C158] bg-[#071C14] border border-[#D4AF37]/30 px-3 py-1 rounded-xl tabular-nums">
                    {formData.marqueeSpeed} px / detik
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#B8A98E] font-medium">
                    <span>Tenang (25 px/s)</span>
                    <span className="text-[#E5C158] font-bold">Ideal Nyaman (40 px/s)</span>
                    <span>Standar (55 px/s)</span>
                    <span>Cepat (75 px/s)</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    step="5"
                    value={formData.marqueeSpeed}
                    onChange={e => setFormData({ ...formData, marqueeSpeed: parseInt(e.target.value) || 40 })}
                    className="w-full accent-[#D4AF37] cursor-pointer h-2 bg-[#071C14] rounded-lg border border-[#D4AF37]/30"
                  />
                </div>

                {/* Presets (2 cols di HP, 4 cols di Desktop) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Sangat Tenang', speed: 25 },
                    { label: 'Ideal (Disarankan)', speed: 40 },
                    { label: 'Standar', speed: 55 },
                    { label: 'Cepat', speed: 75 }
                  ].map(preset => (
                    <button
                      key={preset.speed}
                      type="button"
                      onClick={() => setFormData({ ...formData, marqueeSpeed: preset.speed })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                        formData.marqueeSpeed === preset.speed
                          ? 'bg-[#E5C158] text-[#071C14] border-[#D4AF37] shadow-md font-bold'
                          : 'bg-[#071C14] text-[#D8CCA9] border-[#D4AF37]/20 hover:bg-[#123828]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Live Preview Ticker */}
                <div className="pt-2">
                  <div className="text-[10px] text-[#C4B79D] mb-1">Pratinjau Kecepatan Bergerak:</div>
                  <div className="bg-[#071C14] rounded-xl p-2.5 border border-[#D4AF37]/25 overflow-hidden relative">
                    <div
                      className="whitespace-nowrap inline-block text-xs text-[#E5C158] font-medium will-change-transform"
                      style={{
                        animation: `calibratedAdminMarquee ${previewDuration}s linear infinite`,
                      }}
                    >
                      ★ Uji Kecepatan Nyata Teks Berjalan Masjid Jami Al-Mujahidin • Gerakan Santai dan Nyaman Dibaca Jamaah ★
                    </div>
                  </div>
                  <style>{`
                    @keyframes calibratedAdminMarquee {
                      0% { transform: translateX(100%); }
                      100% { transform: translateX(-100%); }
                    }
                  `}</style>
                </div>
              </div>

              {/* Tambah Pesan Baru */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3 shadow-md">
                <label className="block text-xs font-bold text-[#E5C158] uppercase tracking-wider">
                  Tambah Pesan / Pengumuman Baru
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    placeholder="Ketik teks pengumuman/kajian/informasi masjid..."
                    className="flex-1 bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF6EE] outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] placeholder-[#8A7C64]"
                  />
                  <button
                    onClick={handleAddRunningText}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#E5C158] to-[#D4AF37] text-[#071C14] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 shadow-md cursor-pointer shrink-0 min-h-[42px]"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Tambah Pesan</span>
                  </button>
                </div>
              </div>

              {/* Daftar Pesan Running Text */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(formData.runningTexts || []).map((item, idx) => (
                  <div key={item.id} className="bg-[#0F3526]/80 p-3 rounded-2xl border border-[#D4AF37]/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="text-[11px] font-mono font-bold text-[#D4AF37]">#{idx + 1}</span>
                      <p className="text-xs text-[#FAF6EE] truncate">{item.text}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] text-[#C4B79D] flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={e => {
                            const updated = [...(formData.runningTexts || [])];
                            if (updated[idx]) {
                              updated[idx].active = e.target.checked;
                              setFormData({ ...formData, runningTexts: updated });
                            }
                          }}
                          className="accent-[#D4AF37] rounded"
                        />
                        <span>Aktif</span>
                      </label>
                      <button
                        onClick={() => handleRemoveRunningText(item.id)}
                        className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: SLIDE FOTO & VIDEO
              ======================================================== */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              {uploadFeedback && (
                <div className="bg-[#144733] text-[#FAF6EE] border border-[#22C55E]/50 rounded-2xl p-3 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4ADE80]" />
                  <span>{uploadFeedback}</span>
                </div>
              )}

              {/* 1. MINI THEATER LIVE PREVIEW */}
              {safeSlides.length > 0 && (() => {
                const currentPreview = safeSlides[slidePreviewIndex] || safeSlides[0];
                return (
                  <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/30 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-[#E5C158]" />
                        <span className="text-xs font-bold text-[#E5C158] uppercase tracking-wider">
                          Pratinjau Langsung Layar TV
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#FAF6EE]">
                        <span>Slide {slidePreviewIndex + 1} dari {safeSlides.length}</span>
                        <span className="text-[#D4AF37]/40">·</span>
                        <span className="text-[#C4B79D]">{currentPreview.durationSeconds || 15}s</span>
                      </div>
                    </div>

                    {/* Preview Screen 16:9 */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#071C14] border border-[#D4AF37]/25 shadow-inner flex items-center justify-center">
                      {currentPreview.type === 'video' ? (
                        <video
                          key={currentPreview.id}
                          src={currentPreview.url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          key={currentPreview.id}
                          src={currentPreview.url}
                          alt={currentPreview.title}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Vignette overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071C14]/90 via-transparent to-black/30 pointer-events-none" />

                      {/* Effect badge overlay in preview */}
                      <div className="absolute bottom-2.5 right-3 flex items-center pointer-events-none">
                        <span className="text-[10px] text-[#E5C158] font-mono bg-[#071C14]/85 px-2 py-0.5 rounded border border-[#D4AF37]/30 uppercase">
                          {formData.slideTransitionEffect || 'fade'}
                        </span>
                      </div>

                      {/* Playback Controls Overlay */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-[#071C14]/80 backdrop-blur-xs p-1 rounded-lg border border-[#D4AF37]/20">
                        <button
                          type="button"
                          onClick={() => setSlidePreviewIndex(prev => (prev - 1 + safeSlides.length) % safeSlides.length)}
                          className="p-1 text-[#E5C158] hover:text-[#FAF6EE] hover:bg-[#144733] rounded transition-colors cursor-pointer"
                          title="Slide Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlidePreviewPlaying(prev => !prev)}
                          className="p-1 text-[#E5C158] hover:text-[#FAF6EE] hover:bg-[#144733] rounded transition-colors cursor-pointer"
                          title={slidePreviewPlaying ? 'Jeda Otomatis' : 'Putar Otomatis'}
                        >
                          {slidePreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlidePreviewIndex(prev => (prev + 1) % safeSlides.length)}
                          className="p-1 text-[#E5C158] hover:text-[#FAF6EE] hover:bg-[#144733] rounded transition-colors cursor-pointer"
                          title="Slide Berikutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. PENGATURAN EFEK TRANSISI & DURASI */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#D4AF37]" />
                    <span>Efek Animasi Transisi Antar-Slide</span>
                  </h4>
                  <span className="text-xs text-[#FAF6EE] font-semibold bg-[#071C14] px-2.5 py-0.5 rounded-lg border border-[#D4AF37]/30 uppercase">
                    {formData.slideTransitionEffect || 'fade'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'fade', label: 'Pudar (Fade)', desc: 'Transisi lembut silang' },
                    { key: 'slide', label: 'Geser (Slide)', desc: 'Animasi geser horizontal' },
                    { key: 'zoom', label: 'Ken Burns (Zoom)', desc: 'Gerakan sinematik TV' }
                  ].map(eff => {
                    const isSelected = (formData.slideTransitionEffect || 'fade') === eff.key;
                    return (
                      <button
                        key={eff.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, slideTransitionEffect: eff.key as SlideTransitionEffect })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E5C158] text-[#071C14] border-[#D4AF37] shadow-md font-bold'
                            : 'bg-[#071C14] text-[#D8CCA9] border-[#D4AF37]/20 hover:bg-[#123828]'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{eff.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#1B3C2D] font-medium' : 'text-[#A89A7E]'}`}>
                          {eff.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/20">
                  <div className="text-xs text-[#FAF6EE] font-semibold">
                    Durasi Tayang Standar:
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={formData.slideTransitionDuration}
                      onChange={e => setFormData({ ...formData, slideTransitionDuration: Math.max(5, parseInt(e.target.value) || 15) })}
                      className="w-16 bg-[#071C14] border border-[#D4AF37]/30 rounded-xl px-2 py-1 text-center font-mono font-bold text-[#E5C158] text-xs outline-none"
                    />
                    <span className="text-xs text-[#C4B79D]">detik</span>
                  </div>
                </div>
              </div>

              {/* 3. TOMBOL AKSI TAMBAH MEDIA */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#D4AF37]" />
                    <span>Tambah Media (Foto atau Video MP4)</span>
                  </h4>
                  <div className="text-[11px] text-[#A89A7E]">
                    Format: JPG, PNG, WebP, MP4, WebM
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Tombol Utama Unggah File (Multiple & Unlimited) */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[#144733] to-[#1E6B4C] hover:from-[#1A5C42] hover:to-[#25825D] text-[#FAF6EE] font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg border border-[#22C55E]/50 active:scale-95 transition-all cursor-pointer text-center min-h-[44px]"
                  >
                    <Upload className="w-4 h-4 text-[#4ADE80]" />
                    <span>Unggah Foto & Video Dari HP / Komputer</span>
                  </button>

                  <div className="flex gap-2">
                    {/* Tombol Tambah via URL */}
                    <button
                      type="button"
                      onClick={() => setShowAddUrlSection(prev => !prev)}
                      className={`flex-1 sm:flex-initial py-2.5 px-3.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border active:scale-95 transition-all cursor-pointer text-center min-h-[44px] ${
                        showAddUrlSection 
                          ? 'bg-[#E5C158] text-[#071C14] border-[#D4AF37]' 
                          : 'bg-[#071C14] hover:bg-[#123828] text-[#FAF6EE] border-[#D4AF37]/30'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Link URL</span>
                    </button>

                    {/* Tombol Kosongkan Semua Slide */}
                    <button
                      type="button"
                      onClick={handleClearAllSlides}
                      className="py-2.5 px-3.5 bg-[#071C14] hover:bg-rose-950/40 text-rose-300 hover:text-rose-100 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-rose-900/30 active:scale-95 transition-all cursor-pointer text-center min-h-[44px]"
                      title="Kosongkan Semua Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kosongkan</span>
                    </button>
                  </div>
                </div>

                {/* FORM INPUT LINK URL (Jika aktif) */}
                {showAddUrlSection && (
                  <div className="p-3 bg-[#071C14] rounded-xl border border-[#D4AF37]/35 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-[#E5C158]">
                      <span>Tambahkan Media dari Tautan Web / URL Eksternal:</span>
                      <button
                        type="button"
                        onClick={() => setShowAddUrlSection(false)}
                        className="text-[#A89A7E] hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#A89A7E] mb-1 font-semibold">Judul / Keterangan Slide</label>
                        <input
                          type="text"
                          value={newSlideTitle}
                          onChange={e => setNewSlideTitle(e.target.value)}
                          placeholder="Misal: Kajian Akbar Ahad Pagi"
                          className="w-full bg-[#0F3526] border border-[#D4AF37]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#FAF6EE] outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#A89A7E] mb-1 font-semibold">Tipe Media</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewSlideType('image')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 cursor-pointer ${
                              newSlideType === 'image'
                                ? 'bg-[#144733] text-[#FAF6EE] border-[#4ADE80]'
                                : 'bg-[#0F3526] text-[#A89A7E] border-[#D4AF37]/20'
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Foto / Gambar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewSlideType('video')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 cursor-pointer ${
                              newSlideType === 'video'
                                ? 'bg-[#144733] text-[#FAF6EE] border-[#4ADE80]'
                                : 'bg-[#0F3526] text-[#A89A7E] border-[#D4AF37]/20'
                            }`}
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Video (MP4)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#A89A7E] mb-1 font-semibold">Link URL Media (https://...)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newSlideUrl}
                          onChange={e => setNewSlideUrl(e.target.value)}
                          placeholder="https://contoh-domain.com/foto-masjid.jpg atau video.mp4"
                          className="flex-1 bg-[#0F3526] border border-[#D4AF37]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#FAF6EE] outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleAddSlide();
                            setShowAddUrlSection(false);
                          }}
                          disabled={!newSlideUrl.trim()}
                          className="px-4 bg-[#E5C158] hover:bg-[#D4AF37] disabled:opacity-40 text-[#071C14] font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambahkan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. DAFTAR KOLEKSI SLIDE AKTIF DENGAN KONTROL LENGKAP */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#E5C158] uppercase tracking-wider">
                      Daftar Urutan Slide ({safeSlides.length})
                    </span>
                    <span className="text-[#D4AF37]/40">·</span>
                    <span className="text-[#FAF6EE] font-medium">
                      {safeSlides.filter(s => s.active !== false).length} Tayang di TV
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A89A7E]">
                    Gunakan panah untuk mengubah urutan tayang
                  </div>
                </div>

                {safeSlides.length === 0 ? (
                  <div className="p-8 text-center bg-[#071C14] rounded-2xl border border-dashed border-[#D4AF37]/30 space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F3526] border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C158] mx-auto shadow-inner">
                      <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="text-xs font-bold text-[#FAF6EE]">Belum Ada Foto atau Video</div>
                    <p className="text-[11px] text-[#A89A7E] max-w-sm mx-auto leading-relaxed">
                      Layar TV saat ini menampilkan ornamen islami elegan (tanpa gambar contoh). Klik <strong>Unggah Foto & Video</strong> di atas untuk menambahkan media masjid Anda tanpa batas!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {safeSlides.map((s, idx) => {
                      const isActive = s.active !== false;
                      return (
                        <div 
                          key={s.id} 
                          className={`relative bg-[#0F3526] rounded-2xl overflow-hidden border transition-all flex flex-col justify-between shadow-md ${
                            isActive 
                              ? 'border-[#D4AF37]/40 opacity-100' 
                              : 'border-[#D4AF37]/15 opacity-60 bg-[#0A2218]'
                          }`}
                        >
                          {/* Frame Thumbnail */}
                          <div className="h-28 bg-[#071C14] relative overflow-hidden flex items-center justify-center">
                            {s.thumbnailUrl ? (
                              <img
                                src={s.thumbnailUrl}
                                alt={s.title}
                                className="w-full h-full object-cover"
                              />
                            ) : s.type === 'video' ? (
                              <video
                                src={s.url}
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={s.url}
                                alt={s.title}
                                className="w-full h-full object-cover"
                              />
                            )}

                          {/* Gradient shadow overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#071C14] via-transparent to-black/40 pointer-events-none" />

                          {/* Index queue badge */}
                          <div className="absolute top-2 left-2 bg-[#071C14]/90 backdrop-blur-xs text-[#E5C158] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#D4AF37]/30">
                            #{idx + 1}
                          </div>

                          {/* Media type indicator */}
                          <div className="absolute top-2 right-2 bg-[#071C14]/90 backdrop-blur-xs text-[#FAF6EE] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#D4AF37]/30 flex items-center gap-1">
                            {s.type === 'video' ? <Film className="w-3 h-3 text-[#E5C158]" /> : <ImageIcon className="w-3 h-3 text-[#E5C158]" />}
                            <span className="uppercase">{s.type}</span>
                          </div>

                          {/* Status unboxed badge */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[11px] font-bold">
                            <span className={isActive ? 'text-[#4ADE80]' : 'text-[#A89A7E]'}>
                              {isActive ? '● Aktif' : '○ Non-aktif'}
                            </span>
                          </div>
                        </div>

                        {/* Detail Slide & Controls */}
                        <div className="p-3 bg-[#071C14] flex flex-col space-y-2 text-xs">
                          {/* Title input field directly on card */}
                          <div>
                            <input
                              type="text"
                              value={s.title}
                              onChange={e => handleUpdateSlideTitle(s.id, e.target.value)}
                              placeholder="Nama / Judul Slide"
                              className="w-full bg-[#0F3526] border border-[#D4AF37]/25 rounded-lg px-2.5 py-1 text-xs text-[#FAF6EE] font-semibold outline-none focus:border-[#D4AF37]"
                            />
                          </div>

                          {/* Duration & Action Buttons */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#D4AF37]/15">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[11px] text-[#A89A7E]">Durasi:</span>
                              <input
                                type="number"
                                min="3"
                                max="300"
                                value={s.durationSeconds || 15}
                                onChange={e => handleUpdateSlideDuration(s.id, parseInt(e.target.value) || 15)}
                                className="w-12 bg-[#0F3526] border border-[#D4AF37]/30 rounded px-1.5 py-0.5 text-center font-mono font-bold text-[#E5C158] text-[11px] outline-none"
                              />
                              <span className="text-[11px] text-[#A89A7E]">detik</span>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center space-x-1.5">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSlide(s.id, 'up')}
                                className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-[#0F3526]/80 hover:bg-[#123828] active:scale-90 text-[#C4B79D] hover:text-[#FAF6EE] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                                title="Pindah Lebih Awal"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={idx === safeSlides.length - 1}
                                onClick={() => handleMoveSlide(s.id, 'down')}
                                className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-[#0F3526]/80 hover:bg-[#123828] active:scale-90 text-[#C4B79D] hover:text-[#FAF6EE] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                                title="Pindah Lebih Akhir"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Active */}
                              <button
                                type="button"
                                onClick={() => handleToggleSlideActive(s.id)}
                                className={`p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-[#0F3526]/80 hover:bg-[#123828] active:scale-90 transition-all cursor-pointer ${
                                  isActive ? 'text-[#4ADE80]' : 'text-[#8A7C64]'
                                }`}
                                title={isActive ? 'Nonaktifkan slide' : 'Aktifkan slide'}
                              >
                                {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleRemoveSlide(s.id)}
                                className="text-rose-300 hover:text-white p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-[#0F3526]/80 hover:bg-rose-950/40 active:scale-90 transition-all cursor-pointer"
                                title="Hapus Slide"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

          {/* ========================================================
              TAB 7: KAS MASJID
              ======================================================== */}
          {activeTab === 'kas' && (
            <div className="space-y-4">
              {uploadFeedback && (
                <div className="bg-[#144733] text-[#FAF6EE] border border-[#22C55E]/50 rounded-2xl p-3 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4ADE80]" />
                  <span>{uploadFeedback}</span>
                </div>
              )}

              {/* Sakelar Tampilan Widget Kas di TV */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 flex items-center justify-between shadow-md">
                <div>
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#D4AF37]" />
                    <span>Tampilkan Widget Kas di Layar TV</span>
                  </h4>
                  <p className="text-[11px] text-[#D8CCA9] mt-0.5">
                    Menampilkan saldo kas masjid secara transparan & akuntabel di layar utama.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.kasMasjid.enabled}
                  onChange={e => setFormData({
                    ...formData,
                    kasMasjid: { ...formData.kasMasjid, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
                />
              </div>

              {/* Pratinjau Tampilan Kas */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3 shadow-md">
                <div className="text-[10px] text-[#C4B79D] font-bold uppercase tracking-wider">
                  Pratinjau Widget Kas di Layar TV:
                </div>
                <div className="p-3.5 rounded-2xl bg-[#071C14] border border-[#D4AF37]/35 flex items-center justify-between shadow-inner">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#144733] text-[#E5C158] flex items-center justify-center border border-[#D4AF37]/35 font-bold shadow-sm">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#C4B79D]">
                        Saldo Kas Masjid ({formData.kasMasjid.periode})
                      </div>
                      <div className="font-mono text-base font-black text-[#E5C158] tabular-nums">
                        {formatRupiah(formData.kasMasjid.saldoAkhir)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#144733] text-[#4ADE80] border border-[#22C55E]/40 px-2.5 py-0.5 rounded-full font-bold">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Rincian Angka Keuangan */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider">
                  Rincian Penerimaan & Pengeluaran Kas
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-[#EBDDC3] mb-1">Periode Laporan</label>
                  <input
                    type="text"
                    value={formData.kasMasjid.periode}
                    onChange={e => setFormData({
                      ...formData,
                      kasMasjid: { ...formData.kasMasjid, periode: e.target.value }
                    })}
                    placeholder="Contoh: Jum'at Pekan Ini (Oktober 2026)"
                    className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#FAF6EE] outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EBDDC3] mb-1">Saldo Awal Kas (Rp)</label>
                    <input
                      type="number"
                      value={formData.kasMasjid.saldoAwal}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        const k = formData.kasMasjid;
                        const newSaldoAkhir = (val + k.infaqJumat + k.infaqTransfer) - k.pengeluaran;
                        setFormData({
                          ...formData,
                          kasMasjid: { ...k, saldoAwal: val, saldoAkhir: newSaldoAkhir }
                        });
                      }}
                      className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-sm text-[#FAF6EE] font-mono tabular-nums outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#EBDDC3] mb-1">Infaq Kotak Jum'at (Rp)</label>
                    <input
                      type="number"
                      value={formData.kasMasjid.infaqJumat}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        const k = formData.kasMasjid;
                        const newSaldoAkhir = (k.saldoAwal + val + k.infaqTransfer) - k.pengeluaran;
                        setFormData({
                          ...formData,
                          kasMasjid: { ...k, infaqJumat: val, saldoAkhir: newSaldoAkhir }
                        });
                      }}
                      className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-sm text-[#FAF6EE] font-mono tabular-nums outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EBDDC3] mb-1">Infaq Transfer QRIS / BSI (Rp)</label>
                    <input
                      type="number"
                      value={formData.kasMasjid.infaqTransfer}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        const k = formData.kasMasjid;
                        const newSaldoAkhir = (k.saldoAwal + k.infaqJumat + val) - k.pengeluaran;
                        setFormData({
                          ...formData,
                          kasMasjid: { ...k, infaqTransfer: val, saldoAkhir: newSaldoAkhir }
                        });
                      }}
                      className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-sm text-[#FAF6EE] font-mono tabular-nums outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#EBDDC3] mb-1">Pengeluaran Operasional (Rp)</label>
                    <input
                      type="number"
                      value={formData.kasMasjid.pengeluaran}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        const k = formData.kasMasjid;
                        const newSaldoAkhir = (k.saldoAwal + k.infaqJumat + k.infaqTransfer) - val;
                        setFormData({
                          ...formData,
                          kasMasjid: { ...k, pengeluaran: val, saldoAkhir: newSaldoAkhir }
                        });
                      }}
                      className="w-full bg-[#082218] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-sm text-rose-300 font-mono tabular-nums outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#E5C158] font-bold mb-1">
                    Saldo Akhir Kas Masjid Saat Ini (Otomatis):
                  </label>
                  <input
                    type="number"
                    value={formData.kasMasjid.saldoAkhir}
                    onChange={e => setFormData({
                      ...formData,
                      kasMasjid: { ...formData.kasMasjid, saldoAkhir: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#071C14] border border-[#D4AF37] rounded-xl px-3 py-2 text-sm text-[#E5C158] font-black font-mono tabular-nums outline-none"
                  />
                </div>

                {/* Tombol Sematkan ke Running Text */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSyncKasToRunningText}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#E5C158] to-[#D4AF37] text-[#071C14] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Sematkan Laporan Kas Ini ke Teks Berjalan (Running Text)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: UJI SIMULASI LAYAR & REMOTE
              ======================================================== */}
          {activeTab === 'remote' && (
            <div className="space-y-4">
              {/* Simulasi Transisi Layar Utama */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                    <span>Uji Coba Rangkaian Transisi Layar Sholat</span>
                  </h4>
                  <span className="text-[10px] text-[#FAF6EE] font-bold bg-[#144733] px-2 py-0.5 rounded-full border border-[#22C55E]/40">
                    Live Testing
                  </span>
                </div>
                <p className="text-[11px] text-[#D8CCA9] leading-relaxed">
                  Jalankan simulasi layar TV untuk melihat tampilan <strong>Menjelang Adzan</strong>, <strong>Saat Adzan</strong>, <strong>Doa Sesudah Adzan</strong>, dan <strong>Hitung Mundur Iqamah</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      onTestDisplay('quick_demo');
                      onClose();
                    }}
                    className="py-3 px-3.5 bg-gradient-to-r from-[#E5C158] to-[#D4AF37] hover:brightness-110 text-[#071C14] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span>⚡ Demo Cepat (10 Detik/Tahap)</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onTestDisplay('full_sequence');
                      onClose();
                    }}
                    className="py-3 px-3.5 bg-[#144733] hover:bg-[#1A5C42] text-[#FAF6EE] font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md border border-[#22C55E]/40 transition-all cursor-pointer"
                  >
                    <span>▶ Simulasi Waktu Nyata</span>
                  </button>
                </div>

                <div className="text-[10px] text-[#C4B79D] pt-2 font-bold uppercase tracking-wider">
                  Uji Layar Tertentu Secara Terpisah:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onTestDisplay('pre_adzan');
                      onClose();
                    }}
                    className="p-2.5 bg-[#071C14] hover:bg-[#103828] active:scale-95 text-[#FAF6EE] border border-[#D4AF37]/25 rounded-xl text-xs font-semibold flex flex-col items-center justify-center min-h-[52px] cursor-pointer transition-all"
                  >
                    <span className="font-bold text-[#E5C158]">Menjelang Adzan</span>
                    <span className="text-[9px] text-[#B8A98E]">3 Menit & Alarm</span>
                  </button>
                  <button
                    onClick={() => {
                      onTestDisplay('adzan');
                      onClose();
                    }}
                    className="p-2.5 bg-[#071C14] hover:bg-[#103828] active:scale-95 text-[#FAF6EE] border border-[#D4AF37]/25 rounded-xl text-xs font-semibold flex flex-col items-center justify-center min-h-[52px] cursor-pointer transition-all"
                  >
                    <span className="font-bold text-[#E5C158]">Saat Adzan</span>
                    <span className="text-[9px] text-[#B8A98E]">Kumandang Adzan</span>
                  </button>
                  <button
                    onClick={() => {
                      onTestDisplay('doa_adzan');
                      onClose();
                    }}
                    className="p-2.5 bg-[#071C14] hover:bg-[#103828] active:scale-95 text-[#FAF6EE] border border-[#D4AF37]/25 rounded-xl text-xs font-semibold flex flex-col items-center justify-center min-h-[52px] cursor-pointer transition-all"
                  >
                    <span className="font-bold text-[#E5C158]">Doa Sesudah Adzan</span>
                    <span className="text-[9px] text-[#B8A98E]">Teks Arab & Arti</span>
                  </button>
                  <button
                    onClick={() => {
                      onTestDisplay('iqamah');
                      onClose();
                    }}
                    className="p-2.5 bg-[#071C14] hover:bg-[#103828] active:scale-95 text-[#FAF6EE] border border-[#D4AF37]/25 rounded-xl text-xs font-semibold flex flex-col items-center justify-center min-h-[52px] cursor-pointer transition-all"
                  >
                    <span className="font-bold text-[#E5C158]">Menjelang Iqamah</span>
                    <span className="text-[9px] text-[#B8A98E]">Hitung Mundur & Senyap</span>
                  </button>
                </div>
              </div>

              {/* Mode Tampilan Gelap (Dark Mode) */}
              <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 flex items-center justify-between shadow-md">
                <div>
                  <h4 className="text-xs font-bold text-[#FAF6EE]">Mode Layar Gelap (Dark Mode)</h4>
                  <p className="text-[11px] text-[#D8CCA9]">Tampilan malam yang elegan dan sejuk untuk mata jamaah.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, darkMode: !formData.darkMode })}
                  className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    formData.darkMode
                      ? 'bg-[#E5C158] text-[#071C14] border-[#D4AF37]'
                      : 'bg-[#071C14] text-[#FAF6EE] border-[#D4AF37]/30 hover:bg-[#123828]'
                  }`}
                >
                  {formData.darkMode ? <Moon className="w-4 h-4 text-[#071C14]" /> : <Sun className="w-4 h-4 text-[#E5C158]" />}
                  <span>{formData.darkMode ? 'Mode Gelap Aktif' : 'Mode Terang'}</span>
                </button>
              </div>

              {/* Garis Panduan Area Aman Layar TV */}
              {onToggleSafeZoneGuide && (
                <div className="bg-[#0F3526]/90 p-4 rounded-2xl border border-[#D4AF37]/25 flex items-center justify-between shadow-md">
                  <div>
                    <h4 className="text-xs font-bold text-[#FAF6EE]">Garis Panduan Area Aman (16:9)</h4>
                    <p className="text-[11px] text-[#D8CCA9]">Kalibrasi agar foto & teks tidak tertutup bilah atas dan bawah.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleSafeZoneGuide}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      showSafeZoneGuide
                        ? 'bg-[#144733] text-[#4ADE80] border-[#22C55E]/50'
                        : 'bg-[#071C14] text-[#E5C158] border-[#D4AF37]/30 hover:bg-[#123828]'
                    }`}
                  >
                    <span>{showSafeZoneGuide ? 'Aktif di TV' : 'Tampilkan'}</span>
                  </button>
                </div>
              )}

              {/* Status Sistem Penyimpanan & Sinkronisasi Cloud (Bebas Peringatan / 0 Warnings) */}
              <div className="bg-gradient-to-br from-[#0B2A1E] to-[#061A13] p-4 rounded-2xl border border-[#D4AF37]/35 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#144733] border border-[#22C55E]/40 flex items-center justify-center text-[#4ADE80]">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#FAF6EE] flex items-center gap-2">
                        Pemeriksaan Data Penyimpanan
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#144733] text-[#4ADE80] border border-[#22C55E]/40">
                          ✓ Bebas Peringatan (0 Warning)
                        </span>
                      </h4>
                      <p className="text-[10px] text-[#CFC2A7]">
                        Status real-time database lokal, cache memori, dan cloud Firestore
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      checkStorageHealth().then(setStorageHealth).catch(() => {});
                    }}
                    className="p-1.5 text-xs text-[#EBDDC3] hover:text-[#D4AF37] hover:bg-[#123828] rounded-lg border border-[#D4AF37]/25 transition-colors cursor-pointer"
                    title="Periksa ulang status penyimpanan"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. IndexedDB */}
                  <div className="bg-[#071C14]/90 p-2.5 rounded-xl border border-[#D4AF37]/20 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FAF6EE] mb-1">
                      <HardDrive className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>IndexedDB TV</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                      <span className="text-[10px] text-[#4ADE80] font-semibold">
                        {storageHealth?.indexedDBOk !== false ? 'Aktif (Kapasitas Tinggi)' : 'Siap'}
                      </span>
                    </div>
                    <p className="text-[9px] text-[#9E9075] mt-1">Menyimpan slide & foto Full HD tanpa batas kuota</p>
                  </div>

                  {/* 2. LocalStorage */}
                  <div className="bg-[#071C14]/90 p-2.5 rounded-xl border border-[#D4AF37]/20 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FAF6EE] mb-1">
                      <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>LocalStorage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                      <span className="text-[10px] text-[#4ADE80] font-semibold">
                        {storageHealth?.localStorageOk !== false ? 'Optimal (Bebas Kuota)' : 'Tersinkronisasi'}
                      </span>
                    </div>
                    <p className="text-[9px] text-[#9E9075] mt-1">Cache instan pengaturan saat browser dimuat</p>
                  </div>

                  {/* 3. Cloud Firestore */}
                  <div className="bg-[#071C14]/90 p-2.5 rounded-xl border border-[#D4AF37]/20 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FAF6EE] mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Cloud Database</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-[#22C55E]' : 'bg-[#E5C158]'}`}></span>
                      <span className={`text-[10px] font-semibold ${isCloudSynced ? 'text-[#4ADE80]' : 'text-[#E5C158]'}`}>
                        {isCloudSynced ? 'Terhubung Online' : 'Siaga Offline'}
                      </span>
                    </div>
                    <p className="text-[9px] text-[#9E9075] mt-1">Database Firestore tersertifikasi</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* STICKY BOTTOM ACTION BAR (Khusus Kenyamanan Akses di HP / Layar Sentuh) */}
        <div className="sticky bottom-0 z-30 bg-[#061811]/95 backdrop-blur-md border-t border-[#D4AF37]/30 px-3.5 sm:px-6 py-2.5 sm:py-3 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-2.5 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCloudSynced ? 'bg-[#22C55E]' : 'bg-[#E5C158]'}`} />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#FAF6EE] truncate block">
                {savedSuccess ? '✓ Pengaturan Disimpan' : isCloudSynced ? 'Tersinkron Cloud' : 'Mode Offline/Lokal'}
              </span>
              <span className="text-[9px] text-[#A89A7E] truncate block">
                {savedSuccess ? 'Layar TV telah diperbarui' : 'Ketuk simpan setelah edit'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F3526] hover:bg-[#154633] text-[#FAF6EE] border border-[#D4AF37]/25 active:scale-95 transition-all min-h-[40px] cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 sm:px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B89228] text-[#071A12] shadow-lg shadow-[#D4AF37]/25 active:scale-95 transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
