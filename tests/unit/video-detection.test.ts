import { detectVideosFromDOM } from '../../src/lib/video-detection.ts';

function makeDoc(html: string): Document {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = html;
  return doc;
}

// Cycle 1: detects <video src="...">

test('detects a single video[src] element', () => {
  const doc = makeDoc('<video src="https://example.com/video.mp4"></video>');
  const videos = detectVideosFromDOM(doc);
  expect(videos).toHaveLength(1);
  expect(videos[0].url).toBe('https://example.com/video.mp4');
});

// Cycle 2: detects <video><source src="...">
test('detects video with nested source element', () => {
  const doc = makeDoc('<video><source src="https://example.com/clip.webm" /></video>');
  const videos = detectVideosFromDOM(doc);
  expect(videos).toHaveLength(1);
  expect(videos[0].url).toBe('https://example.com/clip.webm');
});

// Cycle 3: extracts label from title attribute
test('uses video title attribute as label', () => {
  const doc = makeDoc('<video src="https://example.com/v.mp4" title="My Video"></video>');
  const videos = detectVideosFromDOM(doc);
  expect(videos[0].label).toBe('My Video');
});

// Cycle 4: extracts og:video meta tag
test('detects og:video meta tag', () => {
  const doc = makeDoc('<meta property="og:video" content="https://example.com/og.mp4" />');
  const videos = detectVideosFromDOM(doc);
  expect(videos.some((v) => v.url === 'https://example.com/og.mp4')).toBe(true);
});

// Cycle 5: extracts JSON-LD VideoObject contentUrl
test('detects JSON-LD VideoObject contentUrl', () => {
  const ld = JSON.stringify({ '@type': 'VideoObject', contentUrl: 'https://example.com/ld.mp4' });
  const doc = makeDoc(`<script type="application/ld+json">${ld}</script>`);
  const videos = detectVideosFromDOM(doc);
  expect(videos.some((v) => v.url === 'https://example.com/ld.mp4')).toBe(true);
});

// Cycle 6: deduplicates by URL
test('deduplicates videos with the same URL', () => {
  const doc = makeDoc(`
    <video src="https://example.com/same.mp4"></video>
    <meta property="og:video" content="https://example.com/same.mp4" />
  `);
  const videos = detectVideosFromDOM(doc);
  const urls = videos.map((v) => v.url);
  expect(urls.filter((u) => u === 'https://example.com/same.mp4')).toHaveLength(1);
});

// Cycle 7: returns empty array for page with no videos
test('returns empty array when no videos on page', () => {
  const doc = makeDoc('<p>No videos here</p>');
  const videos = detectVideosFromDOM(doc);
  expect(videos).toHaveLength(0);
});
