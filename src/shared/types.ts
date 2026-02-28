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
  /** References an #EXT-X-MEDIA:TYPE=AUDIO GROUP-ID for this video variant */
  audioGroupId?: string;
}

export interface HlsKeyInfo {
  method: 'AES-128' | 'NONE';
  uri?: string;
  /** 16-byte initialisation vector. If absent, use segment sequence index as big-endian uint128. */
  iv?: Uint8Array;
}

export interface SegmentInfo {
  url: string;
  duration?: number;
  byteRange?: { start: number; length: number };
  /** Encryption key info from #EXT-X-KEY. Absent means no encryption. */
  key?: HlsKeyInfo;
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
