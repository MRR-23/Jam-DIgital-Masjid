import { MosqueConfig, MurattalProgress } from '../types';

export const DEFAULT_MOSQUE_CONFIG: MosqueConfig = {
  mosqueName: "MASJID JAMI AL-MUJAHIDIN",
  address: "Jl. Sadar Raya No.9, RT.3/RW.2, Ciganjur - Kota Jakarta Selatan, 12630",
  city: "Jakarta Selatan (Ciganjur)",
  latitude: -6.3400,
  longitude: 106.8044,
  timezoneOffset: 7, // WIB
  hijriAdjustment: 0,
  themeColor: 'gold',
  barStyle: 'white', // Default pure white matching reference image
  barOpacity: 1.0, // Default 100% (Solid)
  prayerBarOpacity: 1.0, // Default 100% (Solid)
  marqueeBgStyle: 'dark', // 'dark' | 'white' | 'gold' | 'glass'
  adzanDurationMinutes: 3,
  doaAdzanDurationMinutes: 1,
  showDoaAdzanInRealTime: false, // Default false: Doa sesudah adzan hanya muncul pada mode percobaan
  iqamahDurations: {
    subuh: 10,
    dzuhur: 10,
    ashar: 10,
    magrib: 7,
    isya: 10
  },
  sholatScreenDimMinutes: 12,
  prayerOffsets: {
    imsak: 0,
    subuh: 0,
    syuruq: 0,
    dzuhur: 0,
    ashar: 0,
    magrib: 0,
    isya: 0
  },
  runningTexts: [
    {
      id: 'rt-1',
      text: 'Selamat Datang di Masjid Jami Al-Mujahidin Ciganjur • Luruskan dan rapatkan barisan shaf sholat berjamaah',
      category: 'informasi',
      active: true
    },
    {
      id: 'rt-2',
      text: 'Mohon menonaktifkan atau mengheningkan nada dering handphone demi kekhusyukan ibadah di dalam masjid',
      category: 'informasi',
      active: true
    },
    {
      id: 'rt-3',
      text: 'Kajian Rutin Tafsir Al-Qur\'an setiap Ahad Ba\'da Subuh bersama Pengurus DKM Al-Mujahidin',
      category: 'jadwal',
      active: true
    },
    {
      id: 'rt-4',
      text: 'Laporan Kas Masjid: Pemasukan Infaq Jum\'at Rp 8.450.000 • Saldo Akhir Kas Rp 42.180.000 • Jazakumullah Khairan Katsiran',
      category: 'keuangan',
      active: true
    }
  ],
  marqueeSpeed: 45, // in pixels per second (calibrated & smooth)
  slides: [],
  slideTransitionDuration: 12,
  slideTransitionEffect: 'fade',
  kasMasjid: {
    enabled: true,
    colorStyle: 'white', // Default clean white as requested by user
    periode: "Jum'at Pekan Ini (Oktober 2026)",
    saldoAwal: 36230000,
    infaqJumat: 8450000,
    infaqTransfer: 2500000,
    pengeluaran: 5000000,
    saldoAkhir: 42180000,
    keterangan: "Jazakumullahu Khairan Katsiran kepada seluruh jamaah dan muhsinin"
  },
  enableSoundAlerts: true,
  audioVolume: 0.85,
  alarmTone: 'harmonic_chime',
  darkMode: false,
  fridayMurattalEnabled: true,
  fridayMurattalStartMinutesBeforeDzuhur: 60,
  fridayMurattalStopMinutesBeforeDzuhur: 15,
  selectedQari: 'alafasy',
  pushReminderEnabled: true,
  updatedAt: new Date().toISOString()
};

export const DEFAULT_MURATTAL_PROGRESS: MurattalProgress = {
  currentJuz: 18,
  currentSurah: 18,
  currentSurahName: "Al-Kahf",
  currentAyah: 1,
  totalAyahs: 110,
  playbackSeconds: 0,
  durationSeconds: 1800,
  isPlaying: false,
  lastUpdated: new Date().toISOString()
};
