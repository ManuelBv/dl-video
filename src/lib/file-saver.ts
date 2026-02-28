// Saves a Uint8Array as a file using the browser's download mechanism.

export function saveFile(data: Uint8Array, filename: string, mimeType = 'video/mp2t'): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
