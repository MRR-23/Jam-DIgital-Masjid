import { PrayerKey, PrayerTimeItem, PrayerOffsets } from '../types';

export interface Coordinates {
  latitude: number;
  longitude: number;
  city: string;
}

export const INDONESIAN_CITIES: Coordinates[] = [
  { city: 'Jakarta Selatan (Ciganjur)', latitude: -6.3400, longitude: 106.8044 },
  { city: 'DKI Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { city: 'Surabaya', latitude: -7.2575, longitude: 112.7521 },
  { city: 'Bandung', latitude: -6.9175, longitude: 107.6191 },
  { city: 'Medan', latitude: 3.5952, longitude: 98.6722 },
  { city: 'Semarang', latitude: -6.9667, longitude: 110.4167 },
  { city: 'Makassar', latitude: -5.1477, longitude: 119.4327 },
  { city: 'Palembang', latitude: -2.9761, longitude: 104.7754 },
  { city: 'Yogyakarta', latitude: -7.7956, longitude: 110.3695 },
  { city: 'Denpasar (Bali)', latitude: -8.6705, longitude: 115.2126 },
  { city: 'Balikpapan', latitude: -1.2379, longitude: 116.8289 },
  { city: 'Banjarmasin', latitude: -3.3194, longitude: 114.5908 },
  { city: 'Padang', latitude: -0.9471, longitude: 100.4172 },
  { city: 'Banda Aceh', latitude: 5.5483, longitude: 95.3238 },
  { city: 'Jayapura', latitude: -2.5916, longitude: 140.6690 },
];

// Mathematical Astronomical Solar Calculations (Kemenag RI standard)
function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radiansToDegrees(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function getJulianDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: number = 7, // WIB = 7
  offsets: PrayerOffsets = { imsak: 0, subuh: 0, syuruq: 0, dzuhur: 0, ashar: 0, magrib: 0, isya: 0 }
): Record<PrayerKey, string> {
  const jd = getJulianDate(date);
  const d = jd - 2451545.0; // days since J2000.0

  // Mean anomaly of the Sun
  const g = 357.529 + 0.98560028 * d;
  const q = 280.459 + 0.98564736 * d;
  const l = q + 1.915 * Math.sin(degreesToRadians(g)) + 0.020 * Math.sin(degreesToRadians(2 * g));

  const e = 23.439 - 0.00000036 * d; // Obliquity of the ecliptic

  // Sun's declination
  const sinD = Math.sin(degreesToRadians(e)) * Math.sin(degreesToRadians(l));
  const declination = radiansToDegrees(Math.asin(sinD));

  // Equation of time in minutes
  const ra = radiansToDegrees(Math.atan2(
    Math.cos(degreesToRadians(e)) * Math.sin(degreesToRadians(l)),
    Math.cos(degreesToRadians(l))
  )) / 15.0;
  
  let eqTime = (q / 15.0) - ra;
  while (eqTime > 12) eqTime -= 24;
  while (eqTime < -12) eqTime += 24;
  eqTime = eqTime * 60; // in minutes

  // Solar noon in hours local time
  const noon = 12 + timezone - (longitude / 15.0) - (eqTime / 60.0);

  // Helper for sun hour angle
  const hourAngle = (angle: number): number => {
    const latRad = degreesToRadians(latitude);
    const decRad = degreesToRadians(declination);
    const angRad = degreesToRadians(angle);

    const cosH = (Math.sin(angRad) - Math.sin(latRad) * Math.sin(decRad)) /
                 (Math.cos(latRad) * Math.cos(decRad));

    if (cosH > 1 || cosH < -1) return 0;
    return radiansToDegrees(Math.acos(cosH)) / 15.0;
  };

  // Kemenag standard parameters:
  // Fajr: -20 degrees
  // Isha: -18 degrees
  // Sunrise/Sunset: -0.833 degrees
  // Asr: shadow length factor 1 + tan(abs(latitude - declination))
  const fajrHA = hourAngle(-20);
  const sunriseHA = hourAngle(-0.8333);
  
  // Asr calculation
  const latDecDiff = Math.abs(degreesToRadians(latitude) - degreesToRadians(declination));
  const asrAngle = radiansToDegrees(Math.atan(1 / (1 + Math.tan(latDecDiff))));
  const asrHA = hourAngle(asrAngle);

  const sunsetHA = hourAngle(-0.8333);
  const ishaHA = hourAngle(-18);

  // Kemenag standard adds +2 minutes Ihtiyat (safety margin)
  const ihtiyat = 2 / 60;

  const rawSubuh = noon - fajrHA + ihtiyat;
  const rawSyuruq = noon - sunriseHA - ihtiyat;
  const rawDzuhur = noon + ihtiyat;
  const rawAshar = noon + asrHA + ihtiyat;
  const rawMagrib = noon + sunsetHA + ihtiyat;
  const rawIsya = noon + ishaHA + ihtiyat;
  const rawImsak = rawSubuh - (10 / 60); // 10 minutes before Subuh

  const formatTime = (hours: number, offsetMinutes: number = 0): string => {
    let totalMinutes = Math.round(hours * 60) + offsetMinutes;
    while (totalMinutes < 0) totalMinutes += 1440;
    while (totalMinutes >= 1440) totalMinutes -= 1440;

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return {
    imsak: formatTime(rawImsak, offsets.imsak),
    subuh: formatTime(rawSubuh, offsets.subuh),
    syuruq: formatTime(rawSyuruq, offsets.syuruq),
    dzuhur: formatTime(rawDzuhur, offsets.dzuhur),
    ashar: formatTime(rawAshar, offsets.ashar),
    magrib: formatTime(rawMagrib, offsets.magrib),
    isya: formatTime(rawIsya, offsets.isya)
  };
}

// Convert "HH:mm" on date to timestamp accurately
export function getPrayerTimestamp(timeStr: string, baseDate: Date = new Date()): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// Format millisecond duration into "-HH:MM:SS" (like in user image "-04:44:53")
// Uses Math.ceil to ensure that when e.g. 59.8 seconds remain, it shows 01:00 / 00:59 accurately
export function formatCountdown(msDiff: number): string {
  if (msDiff <= 0 || isNaN(msDiff)) return '00:00:00';
  const totalSec = Math.ceil(msDiff / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return `-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimeRemainingMinutesSeconds(msDiff: number): string {
  if (msDiff <= 0 || isNaN(msDiff)) return '00:00';
  const totalSec = Math.ceil(msDiff / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export interface NextPrayerInfo {
  currentPrayer: PrayerKey;
  nextPrayer: PrayerKey;
  nextPrayerLabel: string;
  nextPrayerTime: string;
  nextPrayerTimestamp: number;
  timeRemainingMs: number;
}

export function getNextPrayer(
  prayerTimes: Record<PrayerKey, string>,
  now: Date = new Date()
): NextPrayerInfo {
  const nowMs = now.getTime();
  const prayerOrder: { key: PrayerKey; label: string }[] = [
    { key: 'imsak', label: 'Imsak' },
    { key: 'subuh', label: 'Subuh' },
    { key: 'syuruq', label: 'Syuruq' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'magrib', label: 'Magrib' },
    { key: 'isya', label: "Isya'" },
  ];

  const items: PrayerTimeItem[] = prayerOrder.map((p) => {
    return {
      key: p.key,
      label: p.label,
      time: prayerTimes[p.key],
      timestamp: getPrayerTimestamp(prayerTimes[p.key], now)
    };
  });

  // Find the first upcoming prayer today
  for (let i = 0; i < items.length; i++) {
    if (items[i].timestamp > nowMs) {
      const prevIndex = i === 0 ? items.length - 1 : i - 1;
      return {
        currentPrayer: items[prevIndex].key,
        nextPrayer: items[i].key,
        nextPrayerLabel: items[i].label,
        nextPrayerTime: items[i].time,
        nextPrayerTimestamp: items[i].timestamp,
        timeRemainingMs: items[i].timestamp - nowMs
      };
    }
  }

  // If all prayers today passed (e.g. late night after Isya), next prayer is Imsak tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const firstPrayerKey: PrayerKey = prayerTimes['imsak'] ? 'imsak' : 'subuh';
  const firstPrayerLabel = firstPrayerKey === 'imsak' ? 'Imsak' : 'Subuh';
  const nextTimestamp = getPrayerTimestamp(prayerTimes[firstPrayerKey], tomorrow);

  return {
    currentPrayer: 'isya',
    nextPrayer: firstPrayerKey,
    nextPrayerLabel: firstPrayerLabel,
    nextPrayerTime: prayerTimes[firstPrayerKey],
    nextPrayerTimestamp: nextTimestamp,
    timeRemainingMs: Math.max(0, nextTimestamp - nowMs)
  };
}
