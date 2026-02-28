import type { HlsKeyInfo, QualityOption, SegmentInfo } from '../shared/types.ts';

function resolveUrl(url: string, base: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Root-relative path (e.g. /path/to/seg.ts) — combine with origin only
  if (url.startsWith('/')) {
    const origin = new URL(base).origin;
    return origin + url;
  }
  // Relative path — join with base directory
  return base.endsWith('/') ? base + url : `${base}/${url}`;
}

function parseIv(ivHex: string): Uint8Array {
  const hex = ivHex.replace(/^0x/i, '').padStart(32, '0');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function parseKeyLine(line: string, baseUrl: string): HlsKeyInfo | undefined {
  const attrs = line.slice('#EXT-X-KEY:'.length);
  const methodMatch = /METHOD=([^,\s]+)/.exec(attrs);
  const method = methodMatch?.[1];
  if (!method || method === 'NONE') return undefined;
  if (method !== 'AES-128') return undefined; // SAMPLE-AES (DRM) — not supported

  const uriMatch = /URI="([^"]+)"/.exec(attrs);
  const ivMatch = /IV=(0x[0-9a-fA-F]+)/.exec(attrs);

  return {
    method: 'AES-128',
    uri: uriMatch ? resolveUrl(uriMatch[1], baseUrl) : undefined,
    iv: ivMatch ? parseIv(ivMatch[1]) : undefined,
  };
}

export function parseMasterPlaylist(content: string, baseUrl: string): QualityOption[] {
  if (!content.includes('#EXTM3U')) return [];
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const qualities: QualityOption[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXT-X-STREAM-INF:')) {
      const attrs = lines[i].slice('#EXT-X-STREAM-INF:'.length);
      const bandwidthMatch = /BANDWIDTH=(\d+)/.exec(attrs);
      const resolutionMatch = /RESOLUTION=([\dx]+)/.exec(attrs);
      const url = lines[i + 1];
      if (url && !url.startsWith('#')) {
        qualities.push({
          bandwidth: bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : 0,
          resolution: resolutionMatch ? resolutionMatch[1] : undefined,
          url: resolveUrl(url, baseUrl),
        });
        i++;
      }
    }
  }

  return qualities;
}

export interface MediaPlaylist {
  /** fMP4 initialisation segment URL (from #EXT-X-MAP), if present */
  initUrl?: string;
  segments: SegmentInfo[];
}

export function parseMediaPlaylist(content: string, baseUrl: string): MediaPlaylist {
  if (!content.includes('#EXTM3U')) return { segments: [] };
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const segments: SegmentInfo[] = [];
  let initUrl: string | undefined;
  let currentKey: HlsKeyInfo | undefined;
  let segmentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXT-X-MAP:')) {
      const m = /URI="([^"]+)"/.exec(lines[i]);
      if (m) initUrl = resolveUrl(m[1], baseUrl);
    }

    if (lines[i].startsWith('#EXT-X-KEY:')) {
      currentKey = parseKeyLine(lines[i], baseUrl);
    }

    if (lines[i].startsWith('#EXTINF:')) {
      const durationStr = lines[i].slice('#EXTINF:'.length).split(',')[0];
      const duration = parseFloat(durationStr);
      const url = lines[i + 1];
      if (url && !url.startsWith('#')) {
        // If key has no explicit IV, use the segment sequence index
        const key: HlsKeyInfo | undefined = currentKey
          ? {
              ...currentKey,
              iv: currentKey.iv ?? parseIv(segmentIndex.toString(16)),
            }
          : undefined;
        segments.push({ url: resolveUrl(url, baseUrl), duration, key });
        segmentIndex++;
        i++;
      }
    }
  }

  return { initUrl, segments };
}
