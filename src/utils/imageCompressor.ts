/**
 * High-Performance Client-Side Media Processor for Mosque TV Slides.
 * 
 * Features:
 * - Photos: JPEG, PNG, WebP, GIF, SVG, BMP, AVIF, HEIC
 *   Auto-scales to 1920x1080 Full HD (~100-200KB) for sharp TV clarity without bloat.
 * - Videos: MP4, WebM, MOV, MKV, OGG, AVI, M4V
 *   Uses native Blob storage with Object URL streaming (no memory exhaustion, no data: URL bugs).
 *   Generates crisp video snapshot thumbnail automatically.
 * - Zero artificial count or size limits: batch upload as many photos/videos as desired.
 */

export interface ProcessedMediaResult {
  type: 'image' | 'video';
  url: string; // Object URL or Data URL for live rendering
  blob: Blob;  // Raw blob stored into IndexedDB
  thumbnailUrl: string; // Preview thumbnail for admin drawer & mini-theater
  fileName: string;
}

/**
 * Checks if a file is a video by MIME type or file extension
 */
export function isVideoFile(file: File): boolean {
  if (file.type && file.type.startsWith('video/')) return true;
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'mov', 'm4v', 'ogg', 'ogv', 'mkv', 'avi', '3gp', 'wmv'].includes(ext || '');
}

/**
 * Captures an instantaneous preview frame thumbnail from a video Blob
 */
export function captureVideoThumbnail(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      let isResolved = false;
      const finish = (result: string) => {
        if (!isResolved) {
          isResolved = true;
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {}
          resolve(result);
        }
      };

      // Seek to 0.5s or 10% into the video to get a meaningful frame (not black)
      video.onloadedmetadata = () => {
        const seekTime = video.duration && video.duration > 1 ? Math.min(1.0, video.duration * 0.1) : 0;
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          const width = Math.min(video.videoWidth || 640, 640);
          const height = Math.min(video.videoHeight || 360, 360);
          if (width > 0 && height > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, width, height);
              const thumb = canvas.toDataURL('image/jpeg', 0.75);
              finish(thumb);
              return;
            }
          }
        } catch {
          // Canvas export failed
        }
        finish('');
      };

      video.onerror = () => finish('');

      // Safety fallback timeout
      setTimeout(() => finish(''), 2500);
    } catch {
      resolve('');
    }
  });
}

/**
 * Downscales and compresses a single photo file to Full HD JPEG Data URL
 */
export function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG or animated GIF, read as data URL directly
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error(`Gagal membaca berkas ${file.name}`));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Gagal membaca foto ${file.name}`));
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) {
        reject(new Error(`Berkas foto kosong: ${file.name}`));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width <= 0 || height <= 0) {
            resolve(rawData);
            return;
          }

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false });

          if (!ctx) {
            resolve(rawData);
            return;
          }

          // Dignified mosque background for any transparent pixels
          ctx.fillStyle = '#071C14';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed || rawData);
        } catch {
          resolve(rawData);
        }
      };

      img.onerror = () => resolve(rawData);
      img.src = rawData;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * High-level processor for uploaded file (Image or Video)
 */
export async function processUploadedMedia(file: File): Promise<ProcessedMediaResult> {
  const isVideo = isVideoFile(file);

  if (isVideo) {
    const objectUrl = URL.createObjectURL(file);
    const thumb = await captureVideoThumbnail(file);
    return {
      type: 'video',
      url: objectUrl,
      blob: file,
      thumbnailUrl: thumb,
      fileName: file.name
    };
  }

  // Image processing
  const compressedDataUrl = await compressImageFile(file);
  return {
    type: 'image',
    url: compressedDataUrl,
    blob: file,
    thumbnailUrl: compressedDataUrl,
    fileName: file.name
  };
}

/**
 * Backward compatibility wrapper
 */
export async function compressUploadedMedia(file: File): Promise<string> {
  const processed = await processUploadedMedia(file);
  return processed.url;
}
