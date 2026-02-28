import { useState } from 'react';
import { ScanButton } from './components/ScanButton.tsx';
import { ScannedUrl } from './components/ScannedUrl.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { ErrorState } from './components/ErrorState.tsx';
import { VideoItem } from './components/VideoItem.tsx';
import { RightsCheckbox } from './components/RightsCheckbox.tsx';
import { DownloadProgress } from './components/DownloadProgress.tsx';
import { LegalAccordion } from './components/legal/LegalAccordion.tsx';
import { useScan } from './hooks/useScan.ts';
import { useDownload } from './hooks/useDownload.ts';
import type { DetectedVideo } from '../shared/types.ts';

// Only show formats that produce a playable MP4 output when downloaded.
// HLS and DASH streams are converted to MP4 during download.
// webm / ogg / unknown direct URLs are excluded.
const MP4_FORMATS = new Set(['mp4', 'hls', 'dash']);

export default function App() {
  const { state: scanState, scan } = useScan();
  const { state: downloadState, download } = useDownload();
  const [rightsGranted, setRightsGranted] = useState(false);

  const pageUrl = scanState.status === 'done' ? scanState.result.pageUrl : null;

  // Filter to only formats that save as MP4
  const videos = scanState.status === 'done'
    ? scanState.result.videos.filter((v) => MP4_FORMATS.has(v.format))
    : [];

  const activeUrl = downloadState.status === 'downloading' ? downloadState.url : null;
  const doneUrls = new Set(downloadState.status === 'done' ? [downloadState.url] : []);

  return (
    <div className="p-4 min-h-screen bg-white text-sm flex flex-col gap-3">
      <div>
        <h1 className="text-lg font-bold">dl-video</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Click <strong>Scan</strong> to find videos — or play the video first, then scan.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ScanButton onScan={scan} />
        {scanState.status === 'scanning' && <span className="text-gray-400 text-xs">Scanning…</span>}
      </div>

      <ScannedUrl url={pageUrl} />

      {scanState.status === 'error' && <ErrorState message={scanState.message} />}

      {downloadState.status === 'downloading' && (
        <DownloadProgress downloaded={downloadState.downloaded} total={downloadState.total} />
      )}
      {downloadState.status === 'error' && <ErrorState message={downloadState.message} />}

      {scanState.status === 'done' && videos.length === 0 && <EmptyState />}

      {videos.length > 0 && (
        <>
          <RightsCheckbox checked={rightsGranted} onChange={setRightsGranted} />
          <div>
            {videos.map((video) => (
              <VideoItem
                key={video.url}
                video={video}
                rightsGranted={rightsGranted}
                isDownloading={activeUrl === video.url}
                downloadDone={doneUrls.has(video.url)}
                onDownload={(v: DetectedVideo) => download(v)}
              />
            ))}
          </div>
        </>
      )}

      <LegalAccordion />
    </div>
  );
}
