import { useState, useCallback } from 'react';
import type { DetectedVideo, SegmentInfo } from '../../shared/types.ts';
import { parseMasterPlaylist, parseMediaPlaylist } from '../../lib/hls-parser.ts';
import { decryptAes128 } from '../../lib/aes-decryptor.ts';
import { mergeInitSegments, patchAudioSegment } from '../../lib/fmp4-merger.ts';
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

async function downloadAndDecrypt(
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

interface HlsResolved {
  videoInitUrl?: string;
  videoSegments: SegmentInfo[];
  audioInitUrl?: string;
  audioSegments?: SegmentInfo[];
  isFmp4: boolean;
}

async function resolveHls(manifestUrl: string, signal: AbortSignal): Promise<HlsResolved> {
  const content = await fetchText(manifestUrl, signal);
  const base = baseOf(manifestUrl);
  const { qualities, audioStreams } = parseMasterPlaylist(content, base);

  if (qualities.length > 0) {
    // Pick highest-bandwidth video variant
    const best = qualities.reduce((a, b) => (a.bandwidth >= b.bandwidth ? a : b));
    const videoContent = await fetchText(best.url, signal);
    const { initUrl: videoInitUrl, segments: videoSegments } = parseMediaPlaylist(videoContent, baseOf(best.url));

    // Look up the audio stream linked to this variant
    let audioInitUrl: string | undefined;
    let audioSegments: SegmentInfo[] | undefined;
    const audioUrl = best.audioGroupId ? audioStreams[best.audioGroupId] : undefined;
    if (audioUrl) {
      const audioContent = await fetchText(audioUrl, signal);
      const { initUrl, segments } = parseMediaPlaylist(audioContent, baseOf(audioUrl));
      audioInitUrl = initUrl;
      audioSegments = segments;
    }

    return { videoInitUrl, videoSegments, audioInitUrl, audioSegments, isFmp4: Boolean(videoInitUrl) };
  }

  // Already a media playlist (no variants)
  const { initUrl, segments } = parseMediaPlaylist(content, base);
  return { videoInitUrl: initUrl, videoSegments: segments, isFmp4: Boolean(initUrl) };
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({ status: 'idle' });

  const download = useCallback(async (video: DetectedVideo) => {
    setState({ status: 'downloading', url: video.url, downloaded: 0, total: 1 });
    const controller = new AbortController();

    try {
      if (video.format === 'hls') {
        const { videoInitUrl, videoSegments, audioInitUrl, audioSegments, isFmp4 } =
          await resolveHls(video.url, controller.signal);

        const totalSegments = videoSegments.length + (audioSegments?.length ?? 0);
        let doneCount = 0;
        const report = (d: number) => {
          doneCount += d;
          setState({ status: 'downloading', url: video.url, downloaded: doneCount, total: totalSegments });
        };

        const videoData = await downloadAndDecrypt(
          videoSegments,
          (d) => report(d),
          controller.signal,
        );

        if (isFmp4 && videoInitUrl) {
          const videoInit = await fetchBytes(videoInitUrl, controller.signal);

          if (audioSegments && audioSegments.length > 0 && audioInitUrl) {
            // fMP4 with separate audio stream — download, decrypt, then merge tracks
            const audioInit = await fetchBytes(audioInitUrl, controller.signal);
            const audioData = await downloadAndDecrypt(
              audioSegments,
              (d) => report(d),
              controller.signal,
            );

            const { initSegment, audioTrackIdOriginal, audioTrackIdFinal } =
              mergeInitSegments(videoInit, audioInit);

            const patchedAudio = audioData.map((seg) =>
              patchAudioSegment(seg, audioTrackIdOriginal, audioTrackIdFinal),
            );

            const data = concatSegments([initSegment, ...videoData, ...patchedAudio]);
            const baseName = video.label.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]/gi, '_');
            saveFile(data, `${baseName}.mp4`, 'video/mp4');
          } else {
            // fMP4, video only (no audio stream found in master)
            const data = concatSegments([videoInit, ...videoData]);
            const baseName = video.label.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]/gi, '_');
            saveFile(data, `${baseName}.mp4`, 'video/mp4');
          }
        } else {
          // MPEG-TS — segments are typically already muxed (audio+video together)
          const data = concatSegments(videoData);
          const baseName = video.label.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]/gi, '_');
          saveFile(data, `${baseName}.ts`, 'video/mp2t');
        }
      } else {
        // Direct file download (mp4, webm, etc.)
        setState({ status: 'downloading', url: video.url, downloaded: 0, total: 1 });
        const data = await fetchBytes(video.url, controller.signal);
        setState({ status: 'downloading', url: video.url, downloaded: 1, total: 1 });
        const urlExt = video.url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'mp4';
        const ext = ['mp4', 'webm', 'mov'].includes(urlExt) ? urlExt : 'mp4';
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
