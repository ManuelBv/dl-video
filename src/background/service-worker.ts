import type { Message, ScanResult } from '../shared/types.ts';

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// ── Network sniffing ─────────────────────────────────────────────────────────
// Cache stream URLs intercepted from network requests, keyed by tabId.
// X/Twitter and many other players never put the real URL in the DOM —
// they fetch it via API and pipe it into a blob. Intercepting the request
// gives us the real URL before it becomes a blob.

const streamCache = new Map<number, Set<string>>();

const STREAM_EXTENSIONS = ['.m3u8', '.mpd'];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, url } = details;
    if (tabId < 0) return;
    const lower = url.toLowerCase();
    if (STREAM_EXTENSIONS.some((ext) => lower.includes(ext))) {
      if (!streamCache.has(tabId)) streamCache.set(tabId, new Set());
      streamCache.get(tabId)!.add(url);
    }
  },
  { urls: ['<all_urls>'] },
);

// Clear cache when a tab navigates away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') streamCache.delete(tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => streamCache.delete(tabId));

// ── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type !== 'SCAN_PAGE') return false;

    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const tabId = tab?.id;
      if (tabId == null) {
        sendResponse({
          type: 'SCAN_RESULT',
          result: { tabId: -1, pageUrl: '', videos: [], drmSignals: [], error: 'No active tab found' },
        } satisfies Message);
        return;
      }

      // Grab network-intercepted stream URLs for this tab
      const networkStreams = Array.from(streamCache.get(tabId) ?? []);

      chrome.scripting
        .executeScript({ target: { tabId }, func: scanPageContent })
        .then((results) => {
          const result: ScanResult = results[0]?.result ?? {
            tabId,
            pageUrl: '',
            videos: [],
            drmSignals: [],
          };

          // Merge network-intercepted streams (not already found via DOM)
          const knownUrls = new Set(result.videos.map((v) => v.url));
          for (const url of networkStreams) {
            if (knownUrls.has(url)) continue;
            const label = url.split('/').pop()?.split('?')[0] || url;
            const format = url.toLowerCase().includes('.m3u8') ? 'hls' : 'dash';
            result.videos.push({ url, label, format, drmProtected: false });
          }

          sendResponse({ type: 'SCAN_RESULT', result } satisfies Message);
        })
        .catch((err: unknown) => {
          const error = err instanceof Error ? err.message : String(err);
          // Still return network streams even if DOM scan fails
          const networkVideos = networkStreams.map((url) => {
            const label = url.split('/').pop()?.split('?')[0] || url;
            const format = url.toLowerCase().includes('.m3u8') ? 'hls' as const : 'dash' as const;
            return { url, label, format, drmProtected: false };
          });
          sendResponse({
            type: 'SCAN_RESULT',
            result: { tabId, pageUrl: tab.url ?? '', videos: networkVideos, drmSignals: [], error },
          } satisfies Message);
        });
    });

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
