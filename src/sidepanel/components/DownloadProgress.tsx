interface Props { downloaded: number; total: number; }

export function DownloadProgress({ downloaded, total }: Props) {
  const pct = total > 0 ? Math.round((downloaded / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>Downloading…</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded h-2">
        <div className="bg-blue-600 h-2 rounded" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
