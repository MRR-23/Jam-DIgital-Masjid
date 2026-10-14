import { IslamicHoliday } from '../types';

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawal',
  'Dzulqa\'dah',
  'Dzulhijjah'
];

export const INDONESIAN_DAYS = [
  'Ahad',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export const ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  { day: 1, month: 1, monthName: 'Muharram', title: 'Tahun Baru Islam 1448 H', description: 'Awal tahun baru penanggalan Hijriah' },
  { day: 10, month: 1, monthName: 'Muharram', title: 'Hari Asyura (10 Muharram)', description: 'Hari disunnahkan berpuasa Asyura dan Tasu\'a' },
  { day: 12, month: 3, monthName: 'Rabiul Awal', title: 'Maulid Nabi Muhammad SAW', description: 'Peringatan kelahiran junjungan kita Nabi Muhammad SAW' },
  { day: 27, month: 7, monthName: 'Rajab', title: 'Isra Mi\'raj Nabi Muhammad SAW', description: 'Peristiwa perjalanan agung Rasulullah SAW dan perintah Sholat 5 Waktu' },
  { day: 15, month: 8, monthName: 'Sya\'ban', title: 'Malam Nisfu Sya\'ban', description: 'Malam penuh ampunan dan doa' },
  { day: 1, month: 9, monthName: 'Ramadhan', title: 'Awal Puasa Ramadhan', description: 'Hari pertama ibadah puasa wajib Ramadhan' },
  { day: 17, month: 9, monthName: 'Ramadhan', title: 'Nuzulul Qur\'an', description: 'Peringatan turunnya Al-Qur\'an pertama kali' },
  { day: 1, month: 10, monthName: 'Syawal', title: 'Hari Raya Idul Fitri 1 Syawal', description: 'Hari kemenangan umat Islam setelah sebulan berpuasa' },
  { day: 2, month: 10, monthName: 'Syawal', title: 'Hari Raya Idul Fitri (Hari ke-2)', description: 'Silaturahmi dan saling memaafkan' },
  { day: 9, month: 12, monthName: 'Dzulhijjah', title: 'Hari Arafah (9 Dzulhijjah)', description: 'Puncak ibadah Haji & puasa Arafah' },
  { day: 10, month: 12, monthName: 'Dzulhijjah', title: 'Hari Raya Idul Adha (10 Dzulhijjah)', description: 'Hari Raya Qurban dan sholat Idul Adha' },
  { day: 11, month: 12, monthName: 'Dzulhijjah', title: 'Hari Tasyrik ke-1', description: 'Hari penyembelihan hewan kurban' },
  { day: 12, month: 12, monthName: 'Dzulhijjah', title: 'Hari Tasyrik ke-2', description: 'Hari penyembelihan hewan kurban' },
  { day: 13, month: 12, monthName: 'Dzulhijjah', title: 'Hari Tasyrik ke-3', description: 'Hari tasyrik terakhir' }
];

export interface HijriDateResult {
  day: number;
  month: number; // 1-12
  monthName: string;
  year: number;
  formatted: string;
  holiday?: IslamicHoliday;
}

// Kuwaiti / Umm al-Qura calculation algorithm with manual offset support
export function getHijriDate(date: Date, adjustmentDays: number = 0): HijriDateResult {
  const adjusted = new Date(date.getTime() + adjustmentDays * 86400000);
  
  let day = adjusted.getDate();
  let month = adjusted.getMonth();
  let year = adjusted.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }

  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  
  // Hijri Julian day
  let bJD = jd - 1948440 + 10632;
  let n = Math.floor((bJD - 1) / 10631);
  bJD = bJD - 10631 * n + 354;
  
  let j = (Math.floor((10985 - bJD) / 5316)) * (Math.floor((50 * bJD) / 17719)) +
          (Math.floor(bJD / 5670)) * (Math.floor((43 * bJD) / 15238));
  
  bJD = bJD - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
        (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  
  let hMonth = Math.floor((24 * bJD) / 709);
  let hDay = bJD - Math.floor((709 * hMonth) / 24);
  let hYear = 30 * n + j - 30;

  // Bound checks
  if (hMonth < 1) hMonth = 1;
  if (hMonth > 12) hMonth = 12;
  if (hDay < 1) hDay = 1;

  const monthName = HIJRI_MONTHS[hMonth - 1] || 'Rabiul Akhir';
  const formatted = `${hDay} ${monthName.toUpperCase()} ${hYear} H`;

  const holiday = ISLAMIC_HOLIDAYS.find(h => h.day === hDay && h.month === hMonth);

  return {
    day: hDay,
    month: hMonth,
    monthName,
    year: hYear,
    formatted,
    holiday
  };
}

export function formatGregorianDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${monthName} ${year}`;
}

export function formatDayName(date: Date): string {
  return INDONESIAN_DAYS[date.getDay()];
}
