export function PrivacyNotice() {
  return (
    <div>
      <p className="mb-2">dl-video is a fully client-side browser extension. It does not collect, transmit, or store any personal data.</p>
      <ul className="list-disc list-inside space-y-1">
        <li>No analytics or telemetry are collected.</li>
        <li>No browsing history is recorded or sent to any server.</li>
        <li>Video URLs are processed locally in your browser only.</li>
        <li>Downloaded files are saved directly to your device.</li>
      </ul>
      <p className="mt-2">The extension requires the <code>activeTab</code> and <code>scripting</code> permissions solely to read the current page&apos;s DOM for video detection. These permissions are not used for any other purpose.</p>
    </div>
  );
}
