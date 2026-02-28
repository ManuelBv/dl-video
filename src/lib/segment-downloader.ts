import { MAX_RETRIES, RETRY_BASE_DELAY_MS } from '../shared/constants.ts';

type FetchFn = typeof globalThis.fetch;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function fetchWithRetry(
  url: string,
  signal: AbortSignal,
  fetchFn: FetchFn,
): Promise<Uint8Array> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal.aborted) throw new Error('Download aborted');
    try {
      const response = await fetchFn(url, { signal });
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }
  throw new Error('Failed to download segment');
}

export async function downloadSegments(
  urls: string[],
  onProgress: (downloaded: number, total: number) => void,
  signal: AbortSignal,
  fetchFn: FetchFn = globalThis.fetch,
): Promise<Uint8Array[]> {
  if (signal.aborted) throw new Error('Download aborted');

  const results: Uint8Array[] = [];

  for (let i = 0; i < urls.length; i++) {
    const data = await fetchWithRetry(urls[i], signal, fetchFn);
    results.push(data);
    onProgress(i + 1, urls.length);
  }

  return results;
}
