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

  let buttonLabel = 'Download';
  if (isDownloading) buttonLabel = 'Downloading…';
  else if (downloadDone) buttonLabel = 'Done ✓';

  return (
    <div className={`flex items-center justify-between p-2 border rounded mb-2 ${isDownloading ? 'border-blue-400 bg-blue-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{video.label}</p>
        <p className="text-xs text-gray-400 truncate">{video.format.toUpperCase()}</p>
        {video.drmProtected && (
          <span className="text-xs text-red-600 font-semibold">DRM protected</span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDownload(video)}
        className={`ml-2 px-3 py-1 text-sm rounded disabled:cursor-not-allowed transition-colors ${
          downloadDone
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white disabled:opacity-40'
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
