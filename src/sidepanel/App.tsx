import { useState } from 'react';
import { ScanButton } from './components/ScanButton.tsx';
import { ScannedUrl } from './components/ScannedUrl.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { ErrorState } from './components/ErrorState.tsx';
import { VideoItem } from './components/VideoItem.tsx';
import { RightsCheckbox } from './components/RightsCheckbox.tsx';
import { DownloadProgress } from './components/DownloadProgress.tsx';
import { useScan } from './hooks/useScan.ts';
import { useDownload } from './hooks/useDownload.ts';
import type { DetectedVideo } from '../shared/types.ts';

export default function App() {
  const { state: scanState, scan } = useScan();
  const { state: downloadState, download } = useDownload();
  const [rightsGranted, setRightsGranted] = useState(false);

  const pageUrl = scanState.status === 'done' ? scanState.result.pageUrl : null;
  const videos = scanState.status === 'done' ? scanState.result.videos : [];

  function handleDownload(video: DetectedVideo) {
    download(video);
  }

  return (
    <div className="p-4 min-h-screen bg-white text-sm flex flex-col gap-3">
      <h1 className="text-lg font-bold">dl-video</h1>

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
                onDownload={handleDownload}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
