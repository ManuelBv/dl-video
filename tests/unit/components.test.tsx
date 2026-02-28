import { render, screen, fireEvent } from '@testing-library/react';
import type { DetectedVideo } from '../../src/shared/types.ts';
import { ScanButton } from '../../src/sidepanel/components/ScanButton.tsx';
import { ScannedUrl } from '../../src/sidepanel/components/ScannedUrl.tsx';
import { EmptyState } from '../../src/sidepanel/components/EmptyState.tsx';
import { ErrorState } from '../../src/sidepanel/components/ErrorState.tsx';
import { VideoItem } from '../../src/sidepanel/components/VideoItem.tsx';
import { RightsCheckbox } from '../../src/sidepanel/components/RightsCheckbox.tsx';
import { DownloadProgress } from '../../src/sidepanel/components/DownloadProgress.tsx';

const mockVideo: DetectedVideo = {
  url: 'https://example.com/video.mp4',
  label: 'Sample Video',
  format: 'mp4',
  drmProtected: false,
};

const drmVideo: DetectedVideo = {
  ...mockVideo,
  drmProtected: true,
};

// Cycle 1: ScanButton renders and calls onScan
test('ScanButton renders and calls onScan when clicked', () => {
  const onScan = vi.fn();
  render(<ScanButton onScan={onScan} />);
  const btn = screen.getByRole('button', { name: /scan/i });
  fireEvent.click(btn);
  expect(onScan).toHaveBeenCalledTimes(1);
});

// Cycle 2: ScannedUrl shows URL when provided
test('ScannedUrl shows URL text when provided', () => {
  render(<ScannedUrl url="https://example.com" />);
  expect(screen.getByText('https://example.com')).toBeInTheDocument();
});

test('ScannedUrl renders nothing when url is null', () => {
  const { container } = render(<ScannedUrl url={null} />);
  expect(container.firstChild).toBeNull();
});

// Cycle 3: EmptyState shows explanation
test('EmptyState shows explanatory text', () => {
  render(<EmptyState />);
  expect(screen.getByText(/no videos/i)).toBeInTheDocument();
});

// Cycle 4: ErrorState shows error message
test('ErrorState shows error message', () => {
  render(<ErrorState message="Login required to access this content" />);
  expect(screen.getByText(/login required/i)).toBeInTheDocument();
});

// Cycle 5: VideoItem renders label and format
test('VideoItem renders video label', () => {
  render(<VideoItem video={mockVideo} rightsGranted={false} isDownloading={false} downloadDone={false} onDownload={() => {}} />);
  expect(screen.getByText('Sample Video')).toBeInTheDocument();
});

// Cycle 6: VideoItem DRM shows badge and disables download
test('VideoItem shows DRM badge for protected video', () => {
  render(<VideoItem video={drmVideo} rightsGranted={false} isDownloading={false} downloadDone={false} onDownload={() => {}} />);
  expect(screen.getByText(/drm/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
});

// Cycle 7: RightsCheckbox unchecked by default, toggles on click
test('RightsCheckbox is unchecked by default and toggles', () => {
  const onChange = vi.fn();
  render(<RightsCheckbox checked={false} onChange={onChange} />);
  const checkbox = screen.getByRole('checkbox');
  expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith(true);
});

// Cycle 8: VideoItem download button disabled until rights granted
test('VideoItem download button disabled when rights not granted', () => {
  render(<VideoItem video={mockVideo} rightsGranted={false} isDownloading={false} downloadDone={false} onDownload={() => {}} />);
  expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
});

test('VideoItem download button enabled when rights granted', () => {
  render(<VideoItem video={mockVideo} rightsGranted={true} isDownloading={false} downloadDone={false} onDownload={() => {}} />);
  expect(screen.getByRole('button', { name: /download/i })).not.toBeDisabled();
});

// Cycle 10: VideoItem shows Downloading… when isDownloading
test('VideoItem shows downloading state on active item', () => {
  render(<VideoItem video={mockVideo} rightsGranted={true} isDownloading={true} downloadDone={false} onDownload={() => {}} />);
  expect(screen.getByRole('button', { name: /downloading/i })).toBeDisabled();
});

// Cycle 11: VideoItem shows Done after download completes
test('VideoItem shows done state after download', () => {
  render(<VideoItem video={mockVideo} rightsGranted={true} isDownloading={false} downloadDone={true} onDownload={() => {}} />);
  expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
});

// Cycle 9: DownloadProgress shows percentage
test('DownloadProgress shows correct percentage', () => {
  render(<DownloadProgress downloaded={3} total={10} />);
  expect(screen.getByText('30%')).toBeInTheDocument();
});
