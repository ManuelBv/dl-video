import type { ScanResult, DetectedVideo, QualityOption } from './types.ts';

export type Message =
  | { type: 'SCAN_PAGE' }
  | { type: 'SCAN_RESULT'; result: ScanResult }
  | { type: 'DOWNLOAD_VIDEO'; video: DetectedVideo; quality?: QualityOption }
  | { type: 'DOWNLOAD_PROGRESS'; downloaded: number; total: number }
  | { type: 'DOWNLOAD_DONE'; filename: string }
  | { type: 'DOWNLOAD_ERROR'; message: string };
