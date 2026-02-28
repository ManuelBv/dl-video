import type { QualityOption, SegmentInfo } from '../shared/types.ts';

export function parseDashManifest(
  xml: string,
  _baseUrl: string,
): { qualities: QualityOption[]; segments: SegmentInfo[] } {
  const empty = { qualities: [], segments: [] };
  if (!xml.trim()) return empty;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  if (doc.querySelector('parsererror')) return empty;

  const representations = doc.querySelectorAll('Representation');
  if (!representations.length) return empty;

  const qualities: QualityOption[] = [];

  representations.forEach((rep) => {
    const bandwidth = parseInt(rep.getAttribute('bandwidth') ?? '0', 10);
    const width = rep.getAttribute('width');
    const height = rep.getAttribute('height');
    const resolution = width && height ? `${width}x${height}` : undefined;

    // Use the representation's SegmentTemplate media URL as the quality URL placeholder
    const template = rep.querySelector('SegmentTemplate');
    const media = template?.getAttribute('media') ?? '';
    qualities.push({ bandwidth, resolution, url: media });
  });

  return { qualities, segments: [] };
}
