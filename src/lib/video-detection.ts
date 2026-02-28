import type { DetectedVideo, VideoFormat } from '../shared/types.ts';

const STREAM_URL_PATTERN = /https?:\/\/[^\s"'<>\\]+\.(?:m3u8|mpd|mp4|webm|ogg|mov)(?:[?#][^\s"'<>\\]*)?/gi;

function makeVideo(url: string, label: string, format: VideoFormat = 'unknown'): DetectedVideo {
  return { url, label, format, drmProtected: false };
}

function labelFromUrl(url: string): string {
  return url.split('/').pop()?.split('?')[0] || url;
}

function formatFromUrl(url: string): VideoFormat {
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8')) return 'hls';
  if (lower.includes('.mpd')) return 'dash';
  if (lower.includes('.mp4')) return 'mp4';
  if (lower.includes('.webm')) return 'webm';
  return 'unknown';
}

export function detectVideosFromDOM(doc: Document): DetectedVideo[] {
  const seen = new Set<string>();
  const videos: DetectedVideo[] = [];

  function add(url: string, label: string) {
    if (!url || url.startsWith('blob:') || url.startsWith('data:') || seen.has(url)) return;
    seen.add(url);
    videos.push(makeVideo(url, label, formatFromUrl(url)));
  }

  // video[src] — skip blob URLs, they're runtime-created from a real stream
  doc.querySelectorAll<HTMLVideoElement>('video[src]').forEach((el) => {
    const url = el.getAttribute('src') ?? '';
    add(url, el.title || labelFromUrl(url));
  });

  // video > source[src]
  doc.querySelectorAll<HTMLVideoElement>('video:not([src])').forEach((videoEl) => {
    videoEl.querySelectorAll<HTMLSourceElement>('source[src]').forEach((sourceEl) => {
      const url = sourceEl.getAttribute('src') ?? '';
      add(url, videoEl.title || labelFromUrl(url));
    });
  });

  // og:video meta tag
  doc.querySelectorAll<HTMLMetaElement>('meta[property="og:video"]').forEach((el) => {
    const url = el.getAttribute('content') ?? '';
    add(url, labelFromUrl(url));
  });

  // JSON-LD VideoObject
  doc.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]').forEach((el) => {
    try {
      const data: unknown = JSON.parse(el.textContent ?? '');
      if (data && typeof data === 'object' && '@type' in data) {
        const obj = data as Record<string, unknown>;
        if (obj['@type'] === 'VideoObject' && typeof obj.contentUrl === 'string') {
          add(obj.contentUrl, labelFromUrl(obj.contentUrl));
        }
      }
    } catch {
      // ignore invalid JSON
    }
  });

  // Scan all script text and data-* attributes for m3u8/mpd/mp4 URLs
  function scanText(text: string) {
    const matches = text.matchAll(STREAM_URL_PATTERN);
    for (const match of matches) {
      add(match[0], labelFromUrl(match[0]));
    }
  }

  doc.querySelectorAll('script').forEach((el) => scanText(el.textContent ?? ''));

  // Scan all elements' attribute values (catches data-t, data-setup, etc.)
  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (STREAM_URL_PATTERN.test(attr.value)) {
        STREAM_URL_PATTERN.lastIndex = 0;
        scanText(attr.value);
      }
      STREAM_URL_PATTERN.lastIndex = 0;
    });
  });

  return videos;
}
