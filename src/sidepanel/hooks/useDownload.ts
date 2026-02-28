import { useState, useCallback } from 'react';
import type { DetectedVideo } from '../../shared/types.ts';
import { parseMasterPlaylist, parseMediaPlaylist } from '../../lib/hls-parser.ts';
import { downloadSegments } from '../../lib/segment-downloader.ts';
import { concatSegments } from '../../lib/mp4-muxer.ts';
import { saveFile } from '../../lib/file-saver.ts';

type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; url: string; downloaded: number; total: number }
  | { status: 'done'; url: string }
  | { status: 'error'; url: string; message: string };

async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status} ${res.statusText}`);
  return res.text();
}

function baseOf(url: string): string {
  return url.substring(0, url.lastIndexOf('/') + 1);
}

/**
 * Resolve an HLS URL into an ordered list of segment URLs to fetch,
 * plus an optional fMP4 init segment URL that must be prepended.
 */
async function resolveHls(
  manifestUrl: string,
  signal: AbortSignal,
): Promise<{ segmentUrls: string[]; initUrl?: string }> {
  const content = await fetchText(manifestUrl, signal);
  const base = baseOf(manifestUrl);

  // Master playlist — pick highest-bandwidth variant
  const qualities = parseMasterPlaylist(content, base);
  if (qualities.length > 0) {
    const best = qualities.reduce((a, b) => (a.bandwidth >= b.bandwidth ? a : b));
    const mediaContent = await fetchText(best.url, signal);
    const mediaBase = baseOf(best.url);
    const { segments, initUrl } = parseMediaPlaylist(mediaContent, mediaBase);
    return { segmentUrls: segments.map((s) => s.url), initUrl };
  }

  // Already a media playlist
  const { segments, initUrl } = parseMediaPlaylist(content, base);
  if (segments.length > 0) return { segmentUrls: segments.map((s) => s.url), initUrl };

  // Not a recognised HLS playlist — treat the URL itself as a single file
  return { segmentUrls: [manifestUrl] };
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({ status: 'idle' });

  const download = useCallback(async (video: DetectedVideo) => {
    setState({ status: 'downloading', url: video.url, downloaded: 0, total: 1 });
    const controller = new AbortController();

    try {
      let allUrls: string[];
      let isFmp4 = false;

      if (video.format === 'hls') {
        const { segmentUrls, initUrl } = await resolveHls(video.url, controller.signal);
        allUrls = initUrl ? [initUrl, ...segmentUrls] : segmentUrls;
        isFmp4 = Boolean(initUrl);
      } else {
        allUrls = [video.url];
      }

      const segments = await downloadSegments(
        allUrls,
        (downloaded, total) => setState({ status: 'downloading', url: video.url, downloaded, total }),
        controller.signal,
      );

      const data = concatSegments(segments);

      // fMP4 init + segments → valid fragmented MP4
      // MPEG-TS segments → .ts (widely supported by media players)
      // Direct file → use original extension
      let ext: string;
      if (video.format === 'hls') {
        ext = isFmp4 ? 'mp4' : 'ts';
      } else {
        ext = video.url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'mp4';
        if (!['mp4', 'webm', 'mov', 'ogg', 'ts'].includes(ext)) ext = 'mp4';
      }

      const mime = ext === 'ts' ? 'video/mp2t' : 'video/mp4';
      const baseName = video.label.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]/gi, '_');
      saveFile(data, `${baseName}.${ext}`, mime);
      setState({ status: 'done', url: video.url });
    } catch (err) {
      setState({
        status: 'error',
        url: video.url,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  return { state, download };
}
