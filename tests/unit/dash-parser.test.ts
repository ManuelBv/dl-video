import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseDashManifest } from '../../src/lib/dash-parser.ts';

const BASE = 'https://cdn.example.com/dash/';

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures', name), 'utf-8');
}

// Cycle 1: parses MPD and returns 2 quality representations
test('extracts 2 quality levels from MPD Representations', () => {
  const xml = fixture('sample.mpd');
  const { qualities } = parseDashManifest(xml, BASE);
  expect(qualities).toHaveLength(2);
});

// Cycle 2: extracts bandwidth from Representations
test('extracts bandwidth from Representation attributes', () => {
  const xml = fixture('sample.mpd');
  const { qualities } = parseDashManifest(xml, BASE);
  expect(qualities[0].bandwidth).toBe(500000);
  expect(qualities[1].bandwidth).toBe(1500000);
});

// Cycle 3: extracts resolution from Representations
test('extracts resolution as WxH string', () => {
  const xml = fixture('sample.mpd');
  const { qualities } = parseDashManifest(xml, BASE);
  expect(qualities[0].resolution).toBe('640x360');
  expect(qualities[1].resolution).toBe('1280x720');
});

// Cycle 4: returns empty for invalid XML
test('returns empty qualities and segments for invalid XML', () => {
  const result = parseDashManifest('not xml', BASE);
  expect(result.qualities).toHaveLength(0);
  expect(result.segments).toHaveLength(0);
});

// Cycle 5: returns empty for empty string
test('returns empty for empty string', () => {
  const result = parseDashManifest('', BASE);
  expect(result.qualities).toHaveLength(0);
});
