# dl-video

Chrome extension (Manifest V3) that detects video assets on any web page and lets you download them from a side panel.

**GitHub:** [https://github.com/ManuelBv/dl-video](https://github.com/ManuelBv/dl-video)

## Features

- Scans any web page for video assets (DOM elements, meta tags, JSON-LD, inline scripts)
- Intercepts HLS (`.m3u8`) and DASH (`.mpd`) stream URLs via network monitoring
- Downloads direct MP4 files or converts HLS/DASH streams to MP4
- Handles AES-128 encrypted HLS segments
- Merges separate audio and video streams with proper fragment interleaving
- Identifies DRM-protected content and disables download for those entries
- Shows download progress per video
- Rights confirmation checkbox before any download is allowed
- Legal information accordion (Terms of Use, FAQ, DMCA, Privacy)

## Install

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/ManuelBv/dl-video.git
   cd dl-video
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the `dist/` folder
6. Click the extension icon to open the side panel

## Usage

1. Navigate to a page with video content
2. Click the dl-video icon to open the side panel
3. Click **Scan** (or play the video first, then scan)
4. Check the rights confirmation checkbox
5. Click **Download** on the video you want

## Supported Formats

| Source format | Output |
|---|---|
| Direct MP4 | `.mp4` (passthrough) |
| HLS (fMP4 segments) | `.mp4` (merged + interleaved audio/video) |
| HLS (MPEG-TS segments) | `.ts` (concatenated) |
| DASH | `.mp4` |

## Development

```bash
npm run build       # Build to dist/ (loadable as unpacked extension)
npm run test        # Vitest in watch mode
npm run test:run    # Vitest single run (44 tests across 6 files)
npm run lint        # ESLint
npm run dev         # Vite dev server (for sidepanel UI development)
```

## Tech Stack

- **React 19** + **TypeScript** — side panel UI
- **Tailwind CSS** — styling
- **Vite** — multi-entry build (sidepanel HTML, service worker IIFE, content script IIFE)
- **Vitest** — unit testing with jsdom
- **Chrome MV3 APIs** — sidePanel, scripting, webRequest, downloads

## Architecture

```
src/
  background/
    service-worker.ts        Network sniffing (.m3u8/.mpd), scan orchestration,
                             master playlist detection
  content/
    content-script.ts        Injected on demand
  sidepanel/
    App.tsx                  Main UI (scan, video list, download, legal)
    components/              ScanButton, VideoItem, DownloadProgress,
                             RightsCheckbox, EmptyState, ErrorState, legal/
    hooks/
      useScan.ts             Sends SCAN_PAGE message, receives results
      useDownload.ts         Full HLS/DASH/direct download flow
  lib/
    hls-parser.ts            Master + media playlist parsing (qualities,
                             audio streams, AES-128 keys, EXT-X-MAP)
    dash-parser.ts           MPD manifest parsing
    fmp4-merger.ts           Merge video + audio init segments, patch track IDs
    aes-decryptor.ts         AES-128-CBC decryption via Web Crypto API
    segment-downloader.ts    Sequential segment fetch with retry
    mp4-muxer.ts             Byte concatenation for fMP4/TS segments
    file-saver.ts            Blob download trigger
    video-detection.ts       DOM scanning for video URLs
    drm-detector.ts          EME/Widevine/PlayReady keyword detection
  shared/
    types.ts                 DetectedVideo, ScanResult, QualityOption, etc.
    messages.ts              Chrome message types
    constants.ts             Shared constants
tests/
  unit/                      6 test files, 44 tests
  fixtures/                  Sample .m3u8, .mpd, .html files
```

## Legal Notice

This tool is provided for lawful personal use only (e.g. downloading content you own or have permission to download). Users are solely responsible for ensuring their use complies with applicable laws and third-party terms of service. See `docs/legal-research-output.md`.
