import type { DetectedVideo } from '../../shared/types.ts';

interface Props {
  video: DetectedVideo;
  rightsGranted: boolean;
  isDownloading: boolean;
  downloadDone: boolean;
  onDownload: (video: DetectedVideo) => void;
}

export function VideoItem({ video, rightsGranted, isDownloading, downloadDone, onDownload }: Props) {
  const disabled = video.drmProtected || !rightsGranted || isDownloading;

  return (
    <div className={`flex items-center gap-2 p-2 border rounded mb-2 ${isDownloading ? 'border-blue-400 bg-blue-50' : ''}`}>
      {/* Left indicator: checkmark when done, spinner when downloading, empty otherwise */}
      <div className="w-5 shrink-0 text-center">
        {downloadDone && <span className="text-green-600 font-bold text-base">✓</span>}
        {isDownloading && <span className="text-blue-500 text-xs animate-pulse">●</span>}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{video.label}</p>
        <p className="text-xs text-gray-400 uppercase">{video.format}</p>
        {video.drmProtected && (
          <span className="text-xs text-red-600 font-semibold">DRM protected — cannot download</span>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onDownload(video)}
        className="shrink-0 px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isDownloading ? 'Downloading…' : 'Download'}
      </button>
    </div>
  );
}
