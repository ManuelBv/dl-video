import type { Message, ScanResult } from '../shared/types.ts';

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// ── Network sniffing ─────────────────────────────────────────────────────────
// Capture ALL stream URLs per tab (up to MAX_STREAM_URLS).
// When playback starts the player fetches: master playlist → quality variants
// → audio stream.  We capture all of them so we can identify which URL is
// the master at scan time (by fetching and checking for #EXT-X-STREAM-INF).
// Capped to avoid unbounded memory growth on pages with many requests.

const MAX_STREAM_URLS = 10;
const streamCache = new Map<number, Set<string>>();

const STREAM_EXTENSIONS = ['.m3u8', '.mpd'];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, url } = details;
    if (tabId < 0) return;
    const lower = url.toLowerCase();
    if (STREAM_EXTENSIONS.some((ext) => lower.includes(ext))) {
      if (!streamCache.has(tabId)) streamCache.set(tabId, new Set());
      const set = streamCache.get(tabId)!;
      if (set.size < MAX_STREAM_URLS) set.add(url);
    }
  },
  { urls: ['<all_urls>'] },
);

// Clear cache when a tab navigates away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') streamCache.delete(tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => streamCache.delete(tabId));

// ── Master playlist detection ─────────────────────────────────────────────────
// Fetch captured URLs in parallel (up to 5) and return the first one whose
// content contains #EXT-X-STREAM-INF — that is the master playlist.
// Falls back to the first captured URL if no master is found or all fetches fail.

async function resolveBestHlsUrl(urls: string[]): Promise<string> {
  const candidates = urls.filter((u) => u.toLowerCase().includes('.m3u8')).slice(0, 5);
  if (candidates.length === 0) return urls[0];

  const results = await Promise.all(
    candidates.map(async (url) => {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        const text = await res.text();
        return text.includes('#EXTM3U') && text.includes('#EXT-X-STREAM-INF') ? url : null;
      } catch {
        return null;
      }
    }),
  );

  return results.find((r) => r !== null) ?? candidates[0];
}

// ── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type !== 'SCAN_PAGE') return false;

    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tab?.id;
      if (tabId == null) {
        sendResponse({
          type: 'SCAN_RESULT',
          result: { tabId: -1, pageUrl: '', videos: [], drmSignals: [], error: 'No active tab found' },
        } satisfies Message);
        return;
      }

      const capturedUrls = Array.from(streamCache.get(tabId) ?? []);

      // Identify the master playlist (contains quality variant references + audio streams)
      // so the download logic gets full quality selection and audio track info.
      let networkStreamUrl: string | null = null;
      if (capturedUrls.length > 0) {
        networkStreamUrl = await resolveBestHlsUrl(capturedUrls);
      }

      try {
        const injected = await chrome.scripting.executeScript({ target: { tabId }, func: scanPageContent });
        const result: ScanResult = injected[0]?.result ?? {
          tabId,
          pageUrl: '',
          videos: [],
          drmSignals: [],
        };

        // Add network-intercepted master stream if not already found via DOM
        if (networkStreamUrl) {
          const knownUrls = new Set(result.videos.map((v) => v.url));
          if (!knownUrls.has(networkStreamUrl)) {
            const label = networkStreamUrl.split('/').pop()?.split('?')[0] || networkStreamUrl;
            const format = networkStreamUrl.toLowerCase().includes('.m3u8') ? 'hls' as const : 'dash' as const;
            result.videos.push({ url: networkStreamUrl, label, format, drmProtected: false });
          }
        }

        sendResponse({ type: 'SCAN_RESULT', result } satisfies Message);
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        const networkVideos = networkStreamUrl
          ? [{
              url: networkStreamUrl,
              label: networkStreamUrl.split('/').pop()?.split('?')[0] || networkStreamUrl,
              format: networkStreamUrl.toLowerCase().includes('.m3u8') ? 'hls' as const : 'dash' as const,
              drmProtected: false,
            }]
          : [];
        sendResponse({
          type: 'SCAN_RESULT',
          result: { tabId, pageUrl: tab.url ?? '', videos: networkVideos, drmSignals: [], error },
        } satisfies Message);
      }
    })();

    return true;
  },
);

// ── DOM scan (injected into page) ────────────────────────────────────────────
function scanPageContent(): ScanResult {
  const tabId = -1;
  const pageUrl = window.location.href;
  const seen = new Set<string>();
  const videos: ScanResult['videos'] = [];
  const drmSignals: string[] = [];
  const STREAM_RE = /https?:\/\/[^\s"'<>\\]+\.(?:m3u8|mpd|mp4|webm|ogg|mov)(?:[?#][^\s"'<>\\]*)?/gi;

  function formatFromUrl(url: string): 'mp4' | 'webm' | 'hls' | 'dash' | 'unknown' {
    const l = url.toLowerCase();
    if (l.includes('.m3u8')) return 'hls';
    if (l.includes('.mpd')) return 'dash';
    if (l.includes('.mp4')) return 'mp4';
    if (l.includes('.webm')) return 'webm';
    return 'unknown';
  }

  function labelFromUrl(url: string): string {
    return url.split('/').pop()?.split('?')[0] || url;
  }

  function add(url: string, label?: string) {
    if (!url || url.startsWith('blob:') || url.startsWith('data:') || seen.has(url)) return;
    seen.add(url);
    videos.push({ url, label: label || labelFromUrl(url), format: formatFromUrl(url), drmProtected: false });
  }

  function scanText(text: string) {
    STREAM_RE.lastIndex = 0;
    for (const m of text.matchAll(STREAM_RE)) add(m[0]);
  }

  function scanRoot(root: Document | ShadowRoot) {
    root.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) scanRoot(el.shadowRoot);
      Array.from(el.attributes).forEach((attr) => scanText(attr.value));
      if (el.tagName === 'SCRIPT' || el.tagName === 'TEMPLATE') scanText(el.textContent ?? '');
      if (el.tagName === 'VIDEO') add(el.getAttribute('src') ?? '', (el as HTMLVideoElement).title || undefined);
      if (el.tagName === 'SOURCE') add(el.getAttribute('src') ?? '');
      if (el.tagName === 'META' && el.getAttribute('property') === 'og:video') add(el.getAttribute('content') ?? '');
    });

    root.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const data = JSON.parse(el.textContent ?? '') as Record<string, unknown>;
        if (data['@type'] === 'VideoObject' && typeof data.contentUrl === 'string') add(data.contentUrl);
      } catch { /* ignore */ }
    });
  }

  scanRoot(document);

  const drmKeywords = ['encrypted-media', 'com.widevine.alpha', 'com.microsoft.playready', 'requestMediaKeySystemAccess'];
  document.querySelectorAll('script').forEach((script) => {
    const text = script.textContent ?? '';
    drmKeywords.forEach((kw) => { if (text.includes(kw) && !drmSignals.includes(kw)) drmSignals.push(kw); });
  });

  return { tabId, pageUrl, videos, drmSignals };
}
