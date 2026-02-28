import type { QualityOption, SegmentInfo } from '../shared/types.ts';

function resolveUrl(url: string, base: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return base.endsWith('/') ? base + url : `${base}/${url}`;
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

export function parseMediaPlaylist(content: string, baseUrl: string): SegmentInfo[] {
  if (!content.includes('#EXTM3U')) return [];
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const segments: SegmentInfo[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF:')) {
      const durationStr = lines[i].slice('#EXTINF:'.length).split(',')[0];
      const duration = parseFloat(durationStr);
      const url = lines[i + 1];
      if (url && !url.startsWith('#')) {
        segments.push({ url: resolveUrl(url, baseUrl), duration });
        i++;
      }
    }
  }

  return segments;
}
