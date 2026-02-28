import { DRM_KEYWORDS } from '../shared/constants.ts';

export function detectDrmSignals(doc: Document): string[] {
  const found = new Set<string>();
  const scripts = doc.querySelectorAll<HTMLScriptElement>('script');

  scripts.forEach((script) => {
    const text = script.textContent ?? '';
    DRM_KEYWORDS.forEach((keyword) => {
      if (text.includes(keyword)) {
        found.add(keyword);
      }
    });
  });

  return Array.from(found);
}
