import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseMasterPlaylist, parseMediaPlaylist } from '../../src/lib/hls-parser.ts';

const BASE = 'https://cdn.example.com/videos/';

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures', name), 'utf-8');
}

// Cycle 1: parses master playlist with 2 quality levels
test('parses master playlist and returns 2 quality options', () => {
  const { qualities } = parseMasterPlaylist(fixture('sample-master.m3u8'), BASE);
  expect(qualities).toHaveLength(2);
  expect(qualities[0].bandwidth).toBe(500000);
  expect(qualities[1].bandwidth).toBe(1500000);
});

// Cycle 2: resolves relative variant URLs against base
test('resolves relative variant URLs against base URL', () => {
  const { qualities } = parseMasterPlaylist(fixture('sample-master.m3u8'), BASE);
  expect(qualities[0].url).toBe(`${BASE}360p.m3u8`);
  expect(qualities[1].url).toBe(`${BASE}720p.m3u8`);
});

// Cycle 3: extracts resolution from master playlist
test('extracts resolution from STREAM-INF', () => {
  const { qualities } = parseMasterPlaylist(fixture('sample-master.m3u8'), BASE);
  expect(qualities[0].resolution).toBe('640x360');
  expect(qualities[1].resolution).toBe('1280x720');
});

// Cycle 4: parses audio stream from EXT-X-MEDIA
test('parses #EXT-X-MEDIA:TYPE=AUDIO entries into audioStreams', () => {
  const content = [
    '#EXTM3U',
    '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",DEFAULT=YES,URI="audio/index.m3u8"',
    '#EXT-X-STREAM-INF:BANDWIDTH=2000000,AUDIO="audio"',
    'video/index.m3u8',
  ].join('\n');
  const { qualities, audioStreams } = parseMasterPlaylist(content, BASE);
  expect(audioStreams['audio']).toBe(`${BASE}audio/index.m3u8`);
  expect(qualities[0].audioGroupId).toBe('audio');
});

// Cycle 5: parses media playlist segment list
test('parses media playlist and returns 3 segments', () => {
  const { segments } = parseMediaPlaylist(fixture('sample-media.m3u8'), BASE);
  expect(segments).toHaveLength(3);
  expect(segments[0].url).toBe(`${BASE}seg0.ts`);
  expect(segments[2].url).toBe(`${BASE}seg2.ts`);
});

// Cycle 6: parses segment durations
test('extracts segment durations from EXTINF', () => {
  const { segments } = parseMediaPlaylist(fixture('sample-media.m3u8'), BASE);
  expect(segments[0].duration).toBe(10.0);
  expect(segments[2].duration).toBe(5.0);
});

// Cycle 7: returns empty for invalid input
test('returns empty arrays for empty/invalid input', () => {
  expect(parseMasterPlaylist('', BASE).qualities).toHaveLength(0);
  expect(parseMediaPlaylist('', BASE).segments).toHaveLength(0);
  expect(parseMasterPlaylist('not a playlist', BASE).qualities).toHaveLength(0);
});

// Cycle 8: resolves root-relative segment URLs correctly
test('resolves root-relative segment URLs against origin', () => {
  const content = [
    '#EXTM3U',
    '#EXTINF:6.000,',
    '/videos/seg-001.ts',
    '#EXT-X-ENDLIST',
  ].join('\n');
  const { segments } = parseMediaPlaylist(content, 'https://cdn.example.com/pl/720p/index.m3u8');
  expect(segments[0].url).toBe('https://cdn.example.com/videos/seg-001.ts');
});

// Cycle 9: parses EXT-X-MAP init segment URL for fMP4 streams
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

// Cycle 10: EXT-X-MEDIA-SEQUENCE sets starting segment index for AES IV derivation
test('uses EXT-X-MEDIA-SEQUENCE as starting segment index for AES IV', () => {
  const content = [
    '#EXTM3U',
    '#EXT-X-MEDIA-SEQUENCE:100',
    '#EXT-X-KEY:METHOD=AES-128,URI="https://cdn.example.com/key.bin"',
    '#EXTINF:6.000,',
    'seg-100.ts',
    '#EXTINF:6.000,',
    'seg-101.ts',
    '#EXT-X-ENDLIST',
  ].join('\n');
  const { segments } = parseMediaPlaylist(content, BASE);
  expect(segments).toHaveLength(2);
  // First segment IV = sequence 100 = 0x64 padded to 16 bytes
  expect(segments[0].key?.iv).toBeDefined();
  const iv0 = segments[0].key!.iv!;
  expect(iv0[15]).toBe(100); // low byte = 100
  expect(iv0.slice(0, 15).every((b) => b === 0)).toBe(true);
  // Second segment IV = sequence 101
  const iv1 = segments[1].key!.iv!;
  expect(iv1[15]).toBe(101);
});
