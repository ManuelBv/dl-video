import { useState, useCallback } from 'react';
import type { DetectedVideo } from '../../shared/types.ts';
import { parseMasterPlaylist, parseMediaPlaylist } from '../../lib/hls-parser.ts';
import { downloadSegments } from '../../lib/segment-downloader.ts';
import { concatSegments } from '../../lib/mp4-muxer.ts';
import { saveFile } from '../../lib/file-saver.ts';

type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; downloaded: number; total: number }
  | { status: 'done' }
  | { status: 'error'; message: string };

/** Fetch a playlist URL and return its text content. */
async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status} ${res.statusText}`);
  return res.text();
}

/**
 * Resolve the base URL for relative segment paths.
 * Strips the filename portion, keeping only the directory.
 */
function baseOf(url: string): string {
  return url.substring(0, url.lastIndexOf('/') + 1);
}

/**
 * Given an HLS URL (master or media playlist), return the ordered list
 * of segment URLs to download.
 */
async function resolveHlsSegments(manifestUrl: string, signal: AbortSignal): Promise<string[]> {
  const content = await fetchText(manifestUrl, signal);
  const base = baseOf(manifestUrl);

  // Master playlist — pick highest-bandwidth variant
  const qualities = parseMasterPlaylist(content, base);
  if (qualities.length > 0) {
    const best = qualities.reduce((a, b) => (a.bandwidth >= b.bandwidth ? a : b));
    const mediaContent = await fetchText(best.url, signal);
    const mediaBase = baseOf(best.url);
    const segments = parseMediaPlaylist(mediaContent, mediaBase);
    return segments.map((s) => s.url);
  }

  // Already a media playlist
  const segments = parseMediaPlaylist(content, base);
  if (segments.length > 0) return segments.map((s) => s.url);

  // Not a recognised HLS playlist — treat the URL itself as a single file
  return [manifestUrl];
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({ status: 'idle' });

  const download = useCallback(async (video: DetectedVideo) => {
    setState({ status: 'downloading', downloaded: 0, total: 1 });
    const controller = new AbortController();

    try {
      let segmentUrls: string[];
      let ext = 'mp4';

      if (video.format === 'hls') {
        segmentUrls = await resolveHlsSegments(video.url, controller.signal);
        ext = 'ts'; // concatenated MPEG-TS segments — playable by VLC, ffmpeg, etc.
      } else {
        segmentUrls = [video.url];
        const urlExt = video.url.split('.').pop()?.split('?')[0]?.toLowerCase();
        if (urlExt && ['mp4', 'webm', 'mov', 'ogg', 'ts'].includes(urlExt)) ext = urlExt;
      }

      const segments = await downloadSegments(
        segmentUrls,
        (downloaded, total) => setState({ status: 'downloading', downloaded, total }),
        controller.signal,
      );

      const data = concatSegments(segments);
      const baseName = video.label.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]/gi, '_');
      saveFile(data, `${baseName}.${ext}`, ext === 'ts' ? 'video/mp2t' : 'video/mp4');
      setState({ status: 'done' });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  return { state, download };
}
