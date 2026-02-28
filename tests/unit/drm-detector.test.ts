import { detectDrmSignals } from '../../src/lib/drm-detector.ts';

function makeDoc(html: string): Document {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = html;
  return doc;
}

// Cycle 1: detects "encrypted-media" in script content
test('detects encrypted-media keyword in script', () => {
  const doc = makeDoc('<script>navigator.requestMediaKeySystemAccess("encrypted-media", [])</script>');
  const signals = detectDrmSignals(doc);
  expect(signals.length).toBeGreaterThan(0);
});

// Cycle 2: detects com.widevine.alpha
test('detects Widevine DRM string', () => {
  const doc = makeDoc('<script>video.requestMediaKeySystemAccess("com.widevine.alpha", [])</script>');
  const signals = detectDrmSignals(doc);
  expect(signals).toContain('com.widevine.alpha');
});

// Cycle 3: detects encrypted-media specifically
test('detects encrypted-media as a signal', () => {
  const doc = makeDoc('<script>requestMediaKeySystemAccess("encrypted-media")</script>');
  const signals = detectDrmSignals(doc);
  expect(signals).toContain('encrypted-media');
});

// Cycle 4: returns empty array when no DRM signals
test('returns empty array when no DRM signals', () => {
  const doc = makeDoc('<p>Just a regular page</p>');
  const signals = detectDrmSignals(doc);
  expect(signals).toHaveLength(0);
});
