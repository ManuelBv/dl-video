export type VideoFormat = 'mp4' | 'webm' | 'hls' | 'dash' | 'unknown';

export interface DetectedVideo {
  url: string;
  label: string;
  format: VideoFormat;
  sizeBytes?: number;
  drmProtected: boolean;
  qualities?: QualityOption[];
}

export interface QualityOption {
  bandwidth: number;
  resolution?: string;
  url: string;
}

export interface SegmentInfo {
  url: string;
  duration?: number;
  byteRange?: { start: number; length: number };
}

export interface ScanResult {
  tabId: number;
  pageUrl: string;
  videos: DetectedVideo[];
  drmSignals: string[];
  error?: string;
}

export type DownloadState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'downloading'; downloaded: number; total: number }
  | { status: 'done' }
  | { status: 'error'; message: string };
