# dl-video

Chrome MV3 browser extension that detects video assets on any web page and allows the user to download them via a side panel UI.

## Tech Stack

- **Vite** — build tool (multi-entry: sidepanel, service worker, content script)
- **React** — side panel UI
- **TypeScript** — strict typing throughout
- **Tailwind CSS** — utility-first styling
- **ESLint** (Airbnb profile) — code quality and style enforcement
- **Vitest** — unit testing (TDD workflow)
- **mp4-muxer** — mux HLS/DASH segments into MP4

## Architecture

```
src/
  background/service-worker.ts   — extension lifecycle, scan orchestration
  content/content-script.ts      — injected into pages, detects videos in DOM
  sidepanel/                     — React app (UI)
    components/                  — ScanButton, VideoList, VideoItem, legal/, etc.
    hooks/                       — useScan, useDownload, useMessages
    styles/                      — Tailwind entry
  shared/                        — types.ts, messages.ts, constants.ts
  lib/                           — pure logic (video-detection, hls-parser,
                                   dash-parser, segment-downloader, drm-detector,
                                   mp4-muxer, file-saver)
tests/
  unit/                          — vitest unit tests
  fixtures/                      — sample HTML, m3u8, mpd files
```

## Build & Test

```bash
npm run build     # produces dist/ loadable as unpacked Chrome extension
npm run test      # vitest (jsdom environment)
npm run lint      # eslint
```

## Development Methodology

TDD (Red-Green-Refactor). See `.claude/skills/tdd/SKILL.md`.

## Legal Notice

This tool is provided for lawful personal use only. Users are solely responsible for ensuring their use complies with applicable laws and third-party terms of service. See `docs/legal-research-output.md` and `docs/legal-research-extension-addendum.md`.
