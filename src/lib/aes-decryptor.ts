/**
 * AES-128-CBC segment decryption for HLS streams.
 * Uses the Web Crypto API — no external dependencies.
 */

// Cache imported CryptoKeys by URI to avoid refetching the same key for every segment
const keyCache = new Map<string, CryptoKey>();

async function fetchCryptoKey(uri: string, signal: AbortSignal): Promise<CryptoKey> {
  const cached = keyCache.get(uri);
  if (cached) return cached;

  const res = await fetch(uri, { signal, credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch decryption key (${res.status}): ${uri}`);

  const keyBytes = await res.arrayBuffer();
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['decrypt']);
  keyCache.set(uri, key);
  return key;
}

export async function decryptAes128(
  ciphertext: Uint8Array,
  keyUri: string,
  iv: Uint8Array,
  signal: AbortSignal,
): Promise<Uint8Array> {
  const key = await fetchCryptoKey(keyUri, signal);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, ciphertext);
  return new Uint8Array(decrypted);
}
