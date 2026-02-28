interface Props { url: string | null; }

export function ScannedUrl({ url }: Props) {
  if (!url) return null;
  return <p className="text-xs text-gray-500 truncate">{url}</p>;
}
