export interface SurahInfo {
  number: number;
  name: string;
  arabic: string;
  english: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  juz: number;
}

export interface JuzInfo {
  juzNumber: number;
  name: string;
  startSurah: number;
  startSurahName: string;
  startAyah: number;
}

// 30 Juz definitions
export const JUZ_LIST: JuzInfo[] = [
  { juzNumber: 1, name: "Alif Lam Meem", startSurah: 1, startSurahName: "Al-Fatihah", startAyah: 1 },
  { juzNumber: 2, name: "Sayaqool", startSurah: 2, startSurahName: "Al-Baqarah", startAyah: 142 },
  { juzNumber: 3, name: "Tilkal Rusul", startSurah: 2, startSurahName: "Al-Baqarah", startAyah: 253 },
  { juzNumber: 4, name: "Lan Tanaloo", startSurah: 3, startSurahName: "Ali 'Imran", startAyah: 92 },
  { juzNumber: 5, name: "Wal Muhsanat", startSurah: 4, startSurahName: "An-Nisa", startAyah: 24 },
  { juzNumber: 6, name: "La Yuhibbullah", startSurah: 4, startSurahName: "An-Nisa", startAyah: 148 },
  { juzNumber: 7, name: "Wa Iza Sami'oo", startSurah: 5, startSurahName: "Al-Ma'idah", startAyah: 82 },
  { juzNumber: 8, name: "Wa Lau Annana", startSurah: 6, startSurahName: "Al-An'am", startAyah: 111 },
  { juzNumber: 9, name: "Qalal Malao", startSurah: 7, startSurahName: "Al-A'raf", startAyah: 88 },
  { juzNumber: 10, name: "Wa A'lamoo", startSurah: 8, startSurahName: "Al-Anfal", startAyah: 41 },
  { juzNumber: 11, name: "Ya'taziroon", startSurah: 9, startSurahName: "At-Tawbah", startAyah: 93 },
  { juzNumber: 12, name: "Wa Mamin Da'abbah", startSurah: 11, startSurahName: "Hud", startAyah: 6 },
  { juzNumber: 13, name: "Wa Ma Ubarri'u", startSurah: 12, startSurahName: "Yusuf", startAyah: 53 },
  { juzNumber: 14, name: "Rubama", startSurah: 15, startSurahName: "Al-Hijr", startAyah: 1 },
  { juzNumber: 15, name: "Subhanallazi", startSurah: 17, startSurahName: "Al-Isra", startAyah: 1 },
  { juzNumber: 16, name: "Qal Alam", startSurah: 18, startSurahName: "Al-Kahf", startAyah: 75 },
  { juzNumber: 17, name: "Iqtaraba", startSurah: 21, startSurahName: "Al-Anbiya", startAyah: 1 },
  { juzNumber: 18, name: "Qad Aflaha", startSurah: 23, startSurahName: "Al-Mu'minun", startAyah: 1 },
  { juzNumber: 19, name: "Wa Qalal Lazina", startSurah: 25, startSurahName: "Al-Furqan", startAyah: 21 },
  { juzNumber: 20, name: "A'man Khalaqa", startSurah: 27, startSurahName: "An-Naml", startAyah: 56 },
  { juzNumber: 21, name: "Utlu Ma Oohiya", startSurah: 29, startSurahName: "Al-Ankabut", startAyah: 46 },
  { juzNumber: 22, name: "Wa Manyaqnut", startSurah: 33, startSurahName: "Al-Ahzab", startAyah: 31 },
  { juzNumber: 23, name: "Wa Maliya", startSurah: 36, startSurahName: "Ya-Sin", startAyah: 28 },
  { juzNumber: 24, name: "Faman Azlamu", startSurah: 39, startSurahName: "Az-Zumar", startAyah: 32 },
  { juzNumber: 25, name: "Ilaihi Yuraddu", startSurah: 41, startSurahName: "Fussilat", startAyah: 47 },
  { juzNumber: 26, name: "Ha'a Meem", startSurah: 46, startSurahName: "Al-Ahqaf", startAyah: 1 },
  { juzNumber: 27, name: "Qala Fama Khatbukum", startSurah: 51, startSurahName: "Az-Zariyat", startAyah: 31 },
  { juzNumber: 28, name: "Qad Sami'allah", startSurah: 58, startSurahName: "Al-Mujadila", startAyah: 1 },
  { juzNumber: 29, name: "Tabarakallazi", startSurah: 67, startSurahName: "Al-Mulk", startAyah: 1 },
  { juzNumber: 30, name: "Amma Yatasa'aloon (Juz 'Amma)", startSurah: 78, startSurahName: "An-Naba", startAyah: 1 },
];

export const POPULAR_SURAHS: SurahInfo[] = [
  { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", english: "Pembuka", numberOfAyahs: 7, revelationType: 'Meccan', juz: 1 },
  { number: 18, name: "Al-Kahf", arabic: "الكهف", english: "Gua", numberOfAyahs: 110, revelationType: 'Meccan', juz: 15 },
  { number: 36, name: "Ya-Sin", arabic: "يس", english: "Ya Sin", numberOfAyahs: 83, revelationType: 'Meccan', juz: 22 },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", english: "Maha Pemurah", numberOfAyahs: 78, revelationType: 'Medinan', juz: 27 },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", english: "Hari Kiamat", numberOfAyahs: 96, revelationType: 'Meccan', juz: 27 },
  { number: 67, name: "Al-Mulk", arabic: "الملك", english: "Kerajaan", numberOfAyahs: 30, revelationType: 'Meccan', juz: 29 },
  { number: 78, name: "An-Naba'", arabic: "النبأ", english: "Berita Besar", numberOfAyahs: 40, revelationType: 'Meccan', juz: 30 },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", english: "Kemurnian Keesaan", numberOfAyahs: 4, revelationType: 'Meccan', juz: 30 },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", english: "Waktu Subuh", numberOfAyahs: 5, revelationType: 'Meccan', juz: 30 },
  { number: 114, name: "An-Nas", arabic: "الناس", english: "Manusia", numberOfAyahs: 6, revelationType: 'Meccan', juz: 30 },
];

// Reciters
export interface Reciter {
  id: string;
  name: string;
  sourceBaseUrl: string;
}

export const QARI_LIST: Reciter[] = [
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', sourceBaseUrl: 'https://server8.mp3quran.net/afs' },
  { id: 'sudais', name: 'Abdur-Rahman As-Sudais', sourceBaseUrl: 'https://server11.mp3quran.net/sds' },
  { id: 'ghamadi', name: 'Saad Al-Ghamdi', sourceBaseUrl: 'https://server7.mp3quran.net/s_gmd' },
  { id: 'ajamy', name: 'Ahmed Al-Ajamy', sourceBaseUrl: 'https://server10.mp3quran.net/ajm' },
];

export function getSurahAudioUrl(surahNumber: number, reciterId: string = 'alafasy'): string {
  const padded = surahNumber.toString().padStart(3, '0');
  const reciter = QARI_LIST.find(q => q.id === reciterId) || QARI_LIST[0];
  return `${reciter.sourceBaseUrl}/${padded}.mp3`;
}

// Single Ayah audio from everyayah CDN (for per-ayah playback & push reminders)
export function getAyahAudioUrl(surahNumber: number, ayahNumber: number): string {
  const surahPadded = surahNumber.toString().padStart(3, '0');
  const ayahPadded = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${surahPadded}${ayahPadded}.mp3`;
}
