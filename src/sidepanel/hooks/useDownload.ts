import { useState, useCallback } from 'react';
import type { DetectedVideo, SegmentInfo } from '../../shared/types.ts';
import { parseMasterPlaylist, parseMediaPlaylist } from '../../lib/hls-parser.ts';
import { decryptAes128 } from '../../lib/aes-decryptor.ts';
import { concatSegments } from '../../lib/mp4-muxer.ts';
import { saveFile } from '../../lib/file-saver.ts';

type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; url: string; downloaded: number; total: number }
  | { status: 'done'; url: string }
  | { status: 'error'; url: string; message: string };

async function fetchBytes(url: string, signal: AbortSignal): Promise<Uint8Array> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching manifest`);
  return res.text();
}

function baseOf(url: string): string {
  return url.substring(0, url.lastIndexOf('/') + 1);
}

interface HlsResolved {
  initUrl?: string;
  segments: SegmentInfo[];
  isFmp4: boolean;
}

async function resolveHls(manifestUrl: string, signal: AbortSignal): Promise<HlsResolved> {
  const content = await fetchText(manifestUrl, signal);
  const base = baseOf(manifestUrl);

  // Master playlist → pick highest-bandwidth variant
  const qualities = parseMasterPlaylist(content, base);
  if (qualities.length > 0) {
    const best = qualities.reduce((a, b) => (a.bandwidth >= b.bandwidth ? a : b));
    const mediaContent = await fetchText(best.url, signal);
    const { initUrl, segments } = parseMediaPlaylist(mediaContent, baseOf(best.url));
    return { initUrl, segments, isFmp4: Boolean(initUrl) };
  }

  // Already a media playlist
  const { initUrl, segments } = parseMediaPlaylist(content, base);
  if (segments.length > 0) return { initUrl, segments, isFmp4: Boolean(initUrl) };

  // Not a recognised playlist — treat as a single file
  return { segments: [{ url: manifestUrl }], isFmp4: false };
}

async function downloadAndDecryptSegments(
  segments: SegmentInfo[],
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal,
): Promise<Uint8Array[]> {
  const results: Uint8Array[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    let data = await fetchBytes(seg.url, signal);

    if (seg.key?.method === 'AES-128' && seg.key.uri && seg.key.iv) {
      data = await decryptAes128(data, seg.key.uri, seg.key.iv, signal);
    }

    results.push(data);
    onProgress(i + 1, segments.length);
  }
  return results;
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({ status: 'idle' });

  const download = useCallback(async (video: DetectedVideo) => {
    setState({ status: 'downloading', url: video.url, downloaded: 0, total: 1 });
    const controller = new AbortController();

    try {
      if (video.format === 'hls') {
        const { initUrl, segments, isFmp4 } = await resolveHls(video.url, controller.signal);

        const allParts: Uint8Array[] = [];

        // fMP4 init segment is not encrypted — download it separately
        if (initUrl) {
          allParts.push(await fetchBytes(initUrl, controller.signal));
        }

        const decrypted = await downloadAndDecryptSegments(
          segments,
          (done, total) => setState({ status: 'downloading', url: video.url, downloaded: done, total }),
          controller.signal,
        );
        allParts.push(...decrypted);

        const data = concatSegments(allParts);
        const ext = isFmp4 ? 'mp4' : 'ts';
        const mime = isFmp4 ? 'video/mp4' : 'video/mp2t';
        const baseName = video.label.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]/gi, '_');
        saveFile(data, `${baseName}.${ext}`, mime);
      } else {
        // Direct file download (mp4, webm, etc.)
        const data = await fetchBytes(video.url, controller.signal);
        const urlExt = video.url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'mp4';
        const ext = ['mp4', 'webm', 'mov', 'ogg'].includes(urlExt) ? urlExt : 'mp4';
        const baseName = video.label.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]/gi, '_');
        saveFile(data, `${baseName}.${ext}`, 'video/mp4');
      }

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
