import type { DetectedVideo } from '../../shared/types.ts';

interface Props {
  video: DetectedVideo;
  rightsGranted: boolean;
  onDownload: (video: DetectedVideo) => void;
}

export function VideoItem({ video, rightsGranted, onDownload }: Props) {
  const disabled = video.drmProtected || !rightsGranted;

  return (
    <div className="flex items-center justify-between p-2 border rounded mb-2">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{video.label}</p>
        {video.drmProtected && (
          <span className="text-xs text-red-600 font-semibold">DRM protected</span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDownload(video)}
        className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Download
      </button>
    </div>
  );
}
