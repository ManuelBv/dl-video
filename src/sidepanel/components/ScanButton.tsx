interface Props { onScan: () => void; }

export function ScanButton({ onScan }: Props) {
  return (
    <button type="button" onClick={onScan} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Scan Page
    </button>
  );
}
