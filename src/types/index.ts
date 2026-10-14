export type PrayerKey = 'imsak' | 'subuh' | 'syuruq' | 'dzuhur' | 'ashar' | 'magrib' | 'isya';

export type ThemeColorKey = 'gold' | 'emerald' | 'cyan' | 'ruby' | 'teal' | 'violet';

export type SlideTransitionEffect = 'fade' | 'slide' | 'zoom';

export type BarStyleKey = 'white' | 'dark' | 'cream' | 'glass';

export type KasColorStyle = 'white' | 'dark' | 'emerald' | 'gold' | 'glass';

export type MarqueeColorStyle = 'dark' | 'white' | 'gold' | 'glass';

export type AlarmToneKey = 'harmonic_chime' | 'masjid_bell' | 'digital_beep' | 'acoustic_gong';

export interface PrayerTimeItem {
  key: PrayerKey;
  label: string;
  time: string; // HH:mm
  timestamp: number; // millisecond timestamp of today's prayer
}

export interface IqamahDurations {
  subuh: number; // in minutes
  dzuhur: number;
  ashar: number;
  magrib: number;
  isya: number;
}

export interface PrayerOffsets {
  imsak: number; // in minutes
  subuh: number;
  syuruq: number;
  dzuhur: number;
  ashar: number;
  magrib: number;
  isya: number;
}

export interface RunningTextItem {
  id: string;
  text: string;
  category: 'informasi' | 'hadits' | 'keuangan' | 'jadwal';
  active: boolean;
}

export interface MediaSlideItem {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  durationSeconds: number;
  active: boolean;
  thumbnailUrl?: string;
}

export interface KasMasjid {
  enabled: boolean;
  periode: string;
  saldoAwal: number;
  infaqJumat: number;
  infaqTransfer: number;
  pengeluaran: number;
  saldoAkhir: number;
  keterangan: string;
  colorStyle?: KasColorStyle; // Pilihan warna tampilan kas (terutama putih)
}

export interface MosqueConfig {
  mosqueName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number; // GMT+7 default for WIB
  hijriAdjustment: number; // +/- days
  themeColor: ThemeColorKey; // Custom accent palette (emas, hijau, biru, merah, dll)
  barStyle: BarStyleKey; // 'white' | 'dark' | 'cream' | 'glass'
  barOpacity?: number; // 0.1 to 1.0 (default 1.0, opasitas bilah atas)
  prayerBarOpacity?: number; // 0.1 to 1.0 (default 1.0, opasitas bilah jadwal sholat bawah)
  marqueeBgStyle?: MarqueeColorStyle; // 'dark' | 'white' | 'gold' | 'glass'
  adzanDurationMinutes: number; // how long "Saat Adzan" screen stays
  doaAdzanDurationMinutes: number; // how long "Doa Sesudah Adzan" screen stays
  showDoaAdzanInRealTime?: boolean; // Default false (hanya muncul pada mode percobaan)
  iqamahDurations: IqamahDurations;
  sholatScreenDimMinutes: number; // screen blank/dim during prayer
  prayerOffsets: PrayerOffsets;
  runningTexts: RunningTextItem[];
  marqueeSpeed: number; // pixels per second or normalized speed
  slides: MediaSlideItem[];
  slideTransitionDuration: number; // seconds
  slideTransitionEffect: SlideTransitionEffect; // 'fade' | 'slide' | 'zoom'
  kasMasjid: KasMasjid; // Mosque cash report
  enableSoundAlerts: boolean;
  audioVolume: number; // 0 to 1
  alarmTone?: AlarmToneKey; // 'harmonic_chime' | 'masjid_bell' | 'digital_beep' | 'acoustic_gong'
  darkMode: boolean;
  fridayMurattalEnabled: boolean;
  fridayMurattalStartMinutesBeforeDzuhur: number;
  fridayMurattalStopMinutesBeforeDzuhur: number;
  selectedQari: string;
  pushReminderEnabled: boolean;
  updatedAt: string;
}

export interface MurattalProgress {
  currentJuz: number;
  currentSurah: number;
  currentSurahName: string;
  currentAyah: number;
  totalAyahs: number;
  playbackSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  lastUpdated: string;
}

export interface IslamicHoliday {
  day: number;
  month: number;
  monthName: string;
  title: string;
  description: string;
}

export type DisplayState = 'normal' | 'adzan' | 'doa_adzan' | 'iqamah' | 'sholat_dim';
