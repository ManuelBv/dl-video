import { useState, useCallback } from 'react';
import type { DetectedVideo } from '../../shared/types.ts';
import { downloadSegments } from '../../lib/segment-downloader.ts';
import { concatSegments } from '../../lib/mp4-muxer.ts';
import { saveFile } from '../../lib/file-saver.ts';

type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; downloaded: number; total: number }
  | { status: 'done' }
  | { status: 'error'; message: string };

export function useDownload() {
  const [state, setState] = useState<DownloadState>({ status: 'idle' });

  const download = useCallback(async (video: DetectedVideo) => {
    setState({ status: 'downloading', downloaded: 0, total: 1 });
    const controller = new AbortController();

    try {
      const segments = await downloadSegments(
        [video.url],
        (downloaded, total) => setState({ status: 'downloading', downloaded, total }),
        controller.signal,
      );
      const data = concatSegments(segments);
      const filename = video.label.replace(/[^a-z0-9._-]/gi, '_') + '.mp4';
      saveFile(data, filename, 'video/mp4');
      setState({ status: 'done' });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  return { state, download };
}
