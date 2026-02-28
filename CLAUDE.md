# dl-video

Chrome MV3 browser extension that detects video assets on any web page and allows the user to download them via a side panel UI.

## Tech Stack

- **Vite** — multi-entry build (sidepanel HTML, service worker IIFE, content script IIFE)
- **React 19** — side panel UI
- **TypeScript** — strict typing throughout
- **Tailwind CSS** — utility-first styling
- **ESLint** (Airbnb profile) — code quality and style enforcement
- **Vitest** — unit testing (TDD workflow), jsdom environment

## Architecture

```
src/
  background/service-worker.ts   Network sniffing, scan orchestration, master playlist detection
  content/content-script.ts      Injected on demand
  sidepanel/                     React app (side panel UI)
    App.tsx                      Main layout, format filtering, download state
    components/                  ScanButton, VideoItem, DownloadProgress,
                                 RightsCheckbox, EmptyState, ErrorState, legal/
    hooks/
      useScan.ts                 SCAN_PAGE message → scan results
      useDownload.ts             Full download flow (HLS/DASH/direct, AES decrypt,
                                 fMP4 merge, audio interleaving)
  lib/                           Pure testable logic
    hls-parser.ts                Master + media playlist parsing
    dash-parser.ts               MPD manifest parsing
    fmp4-merger.ts               Merge video + audio init segments, patch track IDs
    aes-decryptor.ts             AES-128-CBC via Web Crypto API
    segment-downloader.ts        Sequential fetch with retry
    mp4-muxer.ts                 Byte concatenation
    file-saver.ts                Blob download trigger
    video-detection.ts           DOM scanning for video URLs
    drm-detector.ts              EME/Widevine/PlayReady detection
  shared/                        types.ts, messages.ts, constants.ts
tests/
  unit/                          6 test files, 44 tests
  fixtures/                      Sample .m3u8, .mpd, .html files
```

## Build & Test

```bash
npm run build       # produces dist/ loadable as unpacked Chrome extension
npm run test        # vitest in watch mode
npm run test:run    # vitest single run
npm run lint        # eslint
```

## Key Implementation Details

- **Network sniffing**: `chrome.webRequest.onBeforeRequest` captures `.m3u8`/`.mpd` URLs per tab (up to 10). At scan time, all captured URLs are fetched in parallel to find the master playlist (the one containing `#EXT-X-STREAM-INF`).
- **HLS download flow**: master playlist → highest-bandwidth variant → fetch segments → decrypt AES-128 if needed → fetch separate audio stream if present → merge init segments → interleave video/audio fragments → save as MP4.
- **fMP4 merger**: combines video-only + audio-only init segments into a single moov with both trak boxes, rebuilds mvex with correct trex entries, patches `tfhd.track_id` in audio media segments.
- **Fragment interleaving**: video and audio segments are interleaved (v0, a0, v1, a1, ...) so players can decode both tracks in parallel.
- **Format filtering**: only formats that produce playable MP4 output are shown (mp4, hls, dash). WebM/OGG/unknown are excluded.
- **DRM detection**: scripts are scanned for EME keywords; DRM-protected videos show a badge and download is disabled.

## Development Methodology

TDD (Red-Green-Refactor). See `.claude/skills/tdd/SKILL.md`.

## Legal Notice

This tool is provided for lawful personal use only. Users are solely responsible for ensuring their use complies with applicable laws and third-party terms of service. See `docs/legal-research-output.md` and `docs/legal-research-extension-addendum.md`.
