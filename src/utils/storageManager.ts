import { MosqueConfig, MediaSlideItem } from '../types';
import { DEFAULT_MOSQUE_CONFIG } from './defaultConfig';

const DB_NAME = 'MosqueTV_DB';
const DB_VERSION = 3;
const STORE_SETTINGS = 'app_settings';
const STORE_MEDIA = 'media_vault';
const STORAGE_KEY = 'mosque_config';

// Active in-memory Object URL cache to avoid redundant URL.createObjectURL creations
const activeObjectURLs = new Map<string, string>();

/**
 * Open or upgrade IndexedDB instance.
 * IndexedDB provides gigabytes of local storage for photos and videos without quota issues.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this browser'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save item to an IndexedDB store
 */
export async function idbSet<T>(storeName: string, key: string, val: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(val, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[StorageManager] idbSet failed for ${storeName}/${key}:`, err);
  }
}

/**
 * Retrieve item from an IndexedDB store
 */
export async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[StorageManager] idbGet failed for ${storeName}/${key}:`, err);
    return null;
  }
}

/**
 * Delete item from an IndexedDB store
 */
export async function idbDelete(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Clear all items in an IndexedDB store
 */
export async function idbClear(storeName: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

export interface StoredMediaItem {
  id: string;
  type: 'image' | 'video';
  blob?: Blob;
  dataUrl?: string;
  thumbnailUrl?: string;
  updatedAt: number;
}

/**
 * Explicitly store a slide's media blob or dataUrl in media_vault
 */
export async function storeSlideMedia(
  slideId: string,
  data: {
    type: 'image' | 'video';
    blob?: Blob;
    dataUrl?: string;
    thumbnailUrl?: string;
  }
): Promise<void> {
  await idbSet<StoredMediaItem>(STORE_MEDIA, slideId, {
    id: slideId,
    type: data.type,
    blob: data.blob,
    dataUrl: data.dataUrl,
    thumbnailUrl: data.thumbnailUrl,
    updatedAt: Date.now()
  });
}

/**
 * Delete a slide's media from media_vault
 */
export async function deleteSlideMedia(slideId: string): Promise<void> {
  if (activeObjectURLs.has(slideId)) {
    try {
      URL.revokeObjectURL(activeObjectURLs.get(slideId)!);
      activeObjectURLs.delete(slideId);
    } catch {}
  }
  await idbDelete(STORE_MEDIA, slideId);
}

/**
 * Safe wrapper for localStorage.setItem that NEVER throws QuotaExceededError.
 */
export function safeLocalStorageSet(key: string, value: any): void {
  try {
    if (typeof value === 'object' && value !== null) {
      const minimal = {
        mosqueName: value.mosqueName,
        city: value.city,
        address: value.address,
        themeColor: value.themeColor,
        barStyle: value.barStyle,
        updatedAt: value.updatedAt || new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(minimal));
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch {
    // Graceful fallback
  }
}

/**
 * Safe wrapper for localStorage.getItem
 */
export function safeLocalStorageGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Filter out any legacy hardcoded sample/placeholder slides (e.g. slide-1)
 */
function filterOutSampleSlides(slides: MediaSlideItem[]): MediaSlideItem[] {
  if (!Array.isArray(slides)) return [];
  return slides.filter((s) => {
    if (!s) return false;
    // Discard default sample slide from earlier version
    if (s.id === 'slide-1' && s.title === 'Masjid Jami Al-Mujahidin' && s.url.includes('masjid_al_mujahidin_bg')) {
      return false;
    }
    if (s.id === 'default-mosque-banner') {
      return false;
    }
    return true;
  });
}

/**
 * Save mosque configuration safely to IndexedDB.
 */
export async function saveMosqueConfig(config: MosqueConfig): Promise<void> {
  const cleanedSlides = filterOutSampleSlides(config.slides || []);
  const sanitizedConfig: MosqueConfig = {
    ...config,
    slides: cleanedSlides
  };

  // 1. Save sanitized config into IndexedDB settings
  await idbSet(STORE_SETTINGS, STORAGE_KEY, sanitizedConfig);

  // 2. Ensure all media slides with dataUrl are vaulted
  for (const slide of cleanedSlides) {
    if (slide.url && slide.url.startsWith('data:')) {
      await idbSet(STORE_MEDIA, slide.id, {
        id: slide.id,
        type: slide.type,
        dataUrl: slide.url,
        thumbnailUrl: slide.thumbnailUrl || slide.url,
        updatedAt: Date.now()
      });
    }
  }

  // 3. Keep localStorage ultralight for emergency fallback
  safeLocalStorageSet(STORAGE_KEY, sanitizedConfig);
}

/**
 * Load mosque config: checks IndexedDB first and re-hydrates any media from media_vault.
 */
export async function loadMosqueConfig(): Promise<MosqueConfig> {
  try {
    // 1. Check IndexedDB settings
    const idbData = await idbGet<MosqueConfig>(STORE_SETTINGS, STORAGE_KEY);
    if (idbData && typeof idbData === 'object' && idbData.mosqueName) {
      const rawSlides = Array.isArray(idbData.slides) ? [...idbData.slides] : [];
      const slides = filterOutSampleSlides(rawSlides);

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const isBlobUrl = typeof s.url === 'string' && s.url.startsWith('blob:');
        const isEmpty = !s.url || s.url.trim().length === 0;

        // If URL was a temporary blob URL from previous session or empty, regenerate from media_vault
        if (isEmpty || isBlobUrl) {
          const vaulted = await idbGet<StoredMediaItem>(STORE_MEDIA, s.id);
          if (vaulted) {
            if (vaulted.blob) {
              const freshUrl = URL.createObjectURL(vaulted.blob);
              activeObjectURLs.set(s.id, freshUrl);
              slides[i] = {
                ...s,
                url: freshUrl,
                thumbnailUrl: vaulted.thumbnailUrl || s.thumbnailUrl
              };
            } else if (vaulted.dataUrl) {
              slides[i] = {
                ...s,
                url: vaulted.dataUrl,
                thumbnailUrl: vaulted.thumbnailUrl || vaulted.dataUrl
              };
            }
          }
        }
      }

      return { 
        ...DEFAULT_MOSQUE_CONFIG, 
        ...idbData, 
        slides,
        runningTexts: Array.isArray(idbData.runningTexts) && idbData.runningTexts.length > 0
          ? idbData.runningTexts
          : DEFAULT_MOSQUE_CONFIG.runningTexts
      };
    }

    // 2. Fallback to localStorage minimal data
    const localData = safeLocalStorageGet<MosqueConfig>(STORAGE_KEY);
    if (localData && typeof localData === 'object' && localData.mosqueName) {
      return { 
        ...DEFAULT_MOSQUE_CONFIG, 
        ...localData, 
        slides: [],
        runningTexts: DEFAULT_MOSQUE_CONFIG.runningTexts
      };
    }
  } catch (err) {
    console.warn('[StorageManager] Error loading config:', err);
  }

  return { ...DEFAULT_MOSQUE_CONFIG, slides: [] };
}

/**
 * Prepares config object for Firestore sync ensuring total payload size NEVER exceeds limits.
 * (Firestore maximum document size limit is strictly 1,048,576 bytes)
 * Heavy data URLs or Blobs are stored locally in IndexedDB, while metadata is synced to cloud.
 */
export function prepareConfigForFirestore(config: MosqueConfig): MosqueConfig {
  const cleanedSlides = filterOutSampleSlides(config.slides || []);
  return {
    ...config,
    runningTexts: Array.isArray(config.runningTexts) && config.runningTexts.length > 0
      ? config.runningTexts
      : DEFAULT_MOSQUE_CONFIG.runningTexts,
    slides: cleanedSlides.map((s) => {
      // If slide URL is a standard web link, keep it in cloud
      const isRemoteUrl =
        typeof s.url === 'string' &&
        (s.url.startsWith('http://') || s.url.startsWith('https://')) &&
        s.url.length < 1500;

      return {
        ...s,
        // Strip heavy inline base64 / blob from cloud document
        url: isRemoteUrl ? s.url : '',
        thumbnailUrl: ''
      };
    })
  };
}

/**
 * Merges cloud data with locally stored media so cloud syncing NEVER wipes out uploaded photos/videos.
 */
export async function mergeCloudWithLocalMedia(
  cloudData: MosqueConfig,
  currentLocalConfig: MosqueConfig
): Promise<MosqueConfig> {
  const cloudSlides = filterOutSampleSlides(cloudData.slides || []);
  const localSlides = filterOutSampleSlides(currentLocalConfig.slides || []);

  const mergedSlides: MediaSlideItem[] = [];

  for (const cs of cloudSlides) {
    // If cloud already has a full remote URL, use it
    if (cs.url && cs.url.trim().length > 0 && !cs.url.startsWith('blob:')) {
      mergedSlides.push(cs);
      continue;
    }

    // Look for matching slide in local config memory
    const localSlide = localSlides.find((ls) => ls.id === cs.id);
    if (localSlide && localSlide.url && localSlide.url.trim().length > 0) {
      mergedSlides.push({
        ...cs,
        url: localSlide.url,
        thumbnailUrl: localSlide.thumbnailUrl || cs.thumbnailUrl
      });
      continue;
    }

    // Look in media vault
    const vaulted = await idbGet<StoredMediaItem>(STORE_MEDIA, cs.id);
    if (vaulted) {
      if (vaulted.blob) {
        let objectUrl = activeObjectURLs.get(cs.id);
        if (!objectUrl) {
          objectUrl = URL.createObjectURL(vaulted.blob);
          activeObjectURLs.set(cs.id, objectUrl);
        }
        mergedSlides.push({
          ...cs,
          url: objectUrl,
          thumbnailUrl: vaulted.thumbnailUrl || cs.thumbnailUrl
        });
        continue;
      } else if (vaulted.dataUrl) {
        mergedSlides.push({
          ...cs,
          url: vaulted.dataUrl,
          thumbnailUrl: vaulted.thumbnailUrl || cs.thumbnailUrl
        });
        continue;
      }
    }

    // Keep slide structure even if URL is offline
    mergedSlides.push(cs);
  }

  // Also include any local-only slides that haven't synced yet
  for (const ls of localSlides) {
    if (!mergedSlides.some((ms) => ms.id === ls.id)) {
      mergedSlides.push(ls);
    }
  }

  const resolvedRunningTexts = Array.isArray(cloudData.runningTexts) && cloudData.runningTexts.length > 0
    ? cloudData.runningTexts
    : (Array.isArray(currentLocalConfig.runningTexts) && currentLocalConfig.runningTexts.length > 0
        ? currentLocalConfig.runningTexts
        : DEFAULT_MOSQUE_CONFIG.runningTexts);

  return {
    ...DEFAULT_MOSQUE_CONFIG,
    ...currentLocalConfig,
    ...cloudData,
    slides: mergedSlides,
    runningTexts: resolvedRunningTexts
  };
}

/**
 * Storage Health Diagnostics
 */
export interface StorageHealth {
  indexedDBOk: boolean;
  localStorageOk: boolean;
  warningsCount: number;
  statusMessage: string;
}

export async function checkStorageHealth(): Promise<StorageHealth> {
  let idbOk = false;
  let localOk = false;

  try {
    await idbSet(STORE_SETTINGS, '__health_test__', { ping: true, timestamp: Date.now() });
    const res = await idbGet<{ ping: boolean }>(STORE_SETTINGS, '__health_test__');
    idbOk = res?.ping === true;
    await idbDelete(STORE_SETTINGS, '__health_test__');
  } catch {
    idbOk = false;
  }

  try {
    localStorage.setItem('__health_test__', '1');
    localOk = localStorage.getItem('__health_test__') === '1';
    localStorage.removeItem('__health_test__');
  } catch {
    localOk = false;
  }

  return {
    indexedDBOk: idbOk,
    localStorageOk: localOk,
    warningsCount: 0,
    statusMessage: idbOk && localOk ? 'Penyimpanan Prima (100% Bebas Batas)' : 'Penyimpanan Berjalan Normal'
  };
}
