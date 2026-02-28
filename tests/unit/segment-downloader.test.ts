import { downloadSegments } from '../../src/lib/segment-downloader.ts';

function makeSignal(): AbortSignal {
  return new AbortController().signal;
}

function mockFetch(responses: Array<Uint8Array | 'error'>): typeof globalThis.fetch {
  let call = 0;
  return async (_url: RequestInfo | URL, _init?: RequestInit) => {
    const response = responses[call++];
    if (response === 'error') throw new Error('network error');
    return {
      ok: true,
      arrayBuffer: async () => response.buffer as ArrayBuffer,
    } as Response;
  };
}

// Cycle 1: downloads a single segment successfully
test('downloads a single segment and returns Uint8Array', async () => {
  const data = new Uint8Array([1, 2, 3]);
  const fetch = mockFetch([data]);
  const results = await downloadSegments(
    ['https://cdn.example.com/seg0.ts'],
    () => {},
    makeSignal(),
    fetch,
  );
  expect(results).toHaveLength(1);
  expect(results[0]).toBeInstanceOf(Uint8Array);
});

// Cycle 2: reports progress after each segment
test('calls onProgress after each segment download', async () => {
  const data = new Uint8Array([1, 2, 3]);
  const fetch = mockFetch([data, data]);
  const progress: Array<[number, number]> = [];
  await downloadSegments(
    ['https://cdn.example.com/seg0.ts', 'https://cdn.example.com/seg1.ts'],
    (downloaded, total) => { progress.push([downloaded, total]); },
    makeSignal(),
    fetch,
  );
  expect(progress).toEqual([[1, 2], [2, 2]]);
});

// Cycle 3: retries on fetch failure
test('retries on failure and succeeds on second attempt', async () => {
  const data = new Uint8Array([42]);
  const fetch = mockFetch(['error', data]);
  const results = await downloadSegments(
    ['https://cdn.example.com/seg0.ts'],
    () => {},
    makeSignal(),
    fetch,
  );
  expect(results[0]).toBeInstanceOf(Uint8Array);
});

// Cycle 4: throws after 3 consecutive failures
test('throws after 3 consecutive failures on a segment', async () => {
  const fetch = mockFetch(['error', 'error', 'error']);
  await expect(
    downloadSegments(
      ['https://cdn.example.com/seg0.ts'],
      () => {},
      makeSignal(),
      fetch,
    ),
  ).rejects.toThrow();
});

// Cycle 5: respects AbortSignal
test('aborts when signal is already aborted', async () => {
  const controller = new AbortController();
  controller.abort();
  const data = new Uint8Array([1]);
  const fetch = mockFetch([data]);
  await expect(
    downloadSegments(
      ['https://cdn.example.com/seg0.ts'],
      () => {},
      controller.signal,
      fetch,
    ),
  ).rejects.toThrow(/abort/i);
});
