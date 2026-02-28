import type { Message, ScanResult } from '../shared/types.ts';

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

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

      chrome.scripting
        .executeScript({ target: { tabId }, func: scanPageContent })
        .then((results) => {
          const result: ScanResult = results[0]?.result ?? {
            tabId,
            pageUrl: '',
            videos: [],
            drmSignals: [],
          };
          sendResponse({ type: 'SCAN_RESULT', result } satisfies Message);
        })
        .catch((err: unknown) => {
          const error = err instanceof Error ? err.message : String(err);
          sendResponse({
            type: 'SCAN_RESULT',
            result: { tabId, pageUrl: '', videos: [], drmSignals: [], error },
          } satisfies Message);
        });
    });

    return true;
  },
);

// Injected into the page — must be self-contained (no imports)
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

  // Recursively scan a root (document or shadow root), including nested shadow roots
  function scanRoot(root: Document | ShadowRoot) {
    const allEls = root.querySelectorAll('*');

    allEls.forEach((el) => {
      // Recurse into shadow roots
      if (el.shadowRoot) scanRoot(el.shadowRoot);

      // Scan all attribute values
      Array.from(el.attributes).forEach((attr) => scanText(attr.value));

      // Scan script/template text content
      if (el.tagName === 'SCRIPT' || el.tagName === 'TEMPLATE') {
        scanText(el.textContent ?? '');
      }

      // video[src]
      if (el.tagName === 'VIDEO') {
        const src = el.getAttribute('src') ?? '';
        const title = (el as HTMLVideoElement).title;
        if (src) add(src, title || undefined);
      }

      // source[src] inside video
      if (el.tagName === 'SOURCE') {
        const src = el.getAttribute('src') ?? '';
        if (src) add(src);
      }

      // og:video
      if (el.tagName === 'META' && el.getAttribute('property') === 'og:video') {
        add(el.getAttribute('content') ?? '');
      }
    });

    // JSON-LD
    root.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const data = JSON.parse(el.textContent ?? '') as Record<string, unknown>;
        if (data['@type'] === 'VideoObject' && typeof data.contentUrl === 'string') {
          add(data.contentUrl);
        }
      } catch { /* ignore */ }
    });
  }

  scanRoot(document);

  // DRM detection
  const drmKeywords = ['encrypted-media', 'com.widevine.alpha', 'com.microsoft.playready', 'requestMediaKeySystemAccess'];
  document.querySelectorAll('script').forEach((script) => {
    const text = script.textContent ?? '';
    drmKeywords.forEach((kw) => { if (text.includes(kw) && !drmSignals.includes(kw)) drmSignals.push(kw); });
  });

  return { tabId, pageUrl, videos, drmSignals };
}
