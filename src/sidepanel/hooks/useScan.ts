import { useState, useCallback } from 'react';
import type { ScanResult } from '../../shared/types.ts';

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'done'; result: ScanResult }
  | { status: 'error'; message: string };

export function useScan() {
  const [state, setState] = useState<ScanState>({ status: 'idle' });

  const scan = useCallback(async () => {
    setState({ status: 'scanning' });
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab');

      const response = await chrome.runtime.sendMessage({ type: 'SCAN_PAGE' });
      if (response?.result?.error) {
        setState({ status: 'error', message: response.result.error });
      } else {
        setState({ status: 'done', result: response.result });
      }
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  return { state, scan };
}
