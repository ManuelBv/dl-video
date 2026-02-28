import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseMasterPlaylist, parseMediaPlaylist } from '../../src/lib/hls-parser.ts';

const BASE = 'https://cdn.example.com/videos/';

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures', name), 'utf-8');
}

// Cycle 1: parses master playlist with 2 quality levels
test('parses master playlist and returns 2 quality options', () => {
  const content = fixture('sample-master.m3u8');
  const qualities = parseMasterPlaylist(content, BASE);
  expect(qualities).toHaveLength(2);
  expect(qualities[0].bandwidth).toBe(500000);
  expect(qualities[1].bandwidth).toBe(1500000);
});

// Cycle 2: resolves relative segment URLs against base
test('resolves relative variant URLs against base URL', () => {
  const content = fixture('sample-master.m3u8');
  const qualities = parseMasterPlaylist(content, BASE);
  expect(qualities[0].url).toBe(`${BASE}360p.m3u8`);
  expect(qualities[1].url).toBe(`${BASE}720p.m3u8`);
});

// Cycle 3: extracts resolution from master playlist
test('extracts resolution from STREAM-INF', () => {
  const content = fixture('sample-master.m3u8');
  const qualities = parseMasterPlaylist(content, BASE);
  expect(qualities[0].resolution).toBe('640x360');
  expect(qualities[1].resolution).toBe('1280x720');
});

// Cycle 4: parses media playlist segment list
test('parses media playlist and returns 3 segments', () => {
  const content = fixture('sample-media.m3u8');
  const { segments } = parseMediaPlaylist(content, BASE);
  expect(segments).toHaveLength(3);
  expect(segments[0].url).toBe(`${BASE}seg0.ts`);
  expect(segments[2].url).toBe(`${BASE}seg2.ts`);
});

// Cycle 5: parses segment durations
test('extracts segment durations from EXTINF', () => {
  const content = fixture('sample-media.m3u8');
  const { segments } = parseMediaPlaylist(content, BASE);
  expect(segments[0].duration).toBe(10.0);
  expect(segments[2].duration).toBe(5.0);
});

// Cycle 6: returns empty for invalid input
test('returns empty arrays for empty/invalid input', () => {
  expect(parseMasterPlaylist('', BASE)).toHaveLength(0);
  expect(parseMediaPlaylist('', BASE).segments).toHaveLength(0);
  expect(parseMasterPlaylist('not a playlist', BASE)).toHaveLength(0);
});

// Cycle 7: parses EXT-X-MAP init segment URL for fMP4 streams
test('extracts initUrl from EXT-X-MAP for fMP4 playlists', () => {
  const content = [
    '#EXTM3U',
    '#EXT-X-VERSION:7',
    '#EXT-X-MAP:URI="init-0.mp4"',
    '#EXTINF:6.000,',
    'seg-001.m4s',
    '#EXT-X-ENDLIST',
  ].join('\n');
  const { initUrl, segments } = parseMediaPlaylist(content, BASE);
  expect(initUrl).toBe(`${BASE}init-0.mp4`);
  expect(segments).toHaveLength(1);
  expect(segments[0].url).toBe(`${BASE}seg-001.m4s`);
});
