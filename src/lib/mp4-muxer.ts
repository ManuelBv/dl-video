// Thin wrapper — concatenates raw TS segments as a passthrough.
// Full muxing via mp4-muxer npm package would require codec metadata from the stream;
// for now we pass segments through and let the browser handle the container.

export function concatSegments(segments: Uint8Array[]): Uint8Array {
  const totalLength = segments.reduce((sum, s) => sum + s.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const seg of segments) {
    result.set(seg, offset);
    offset += seg.byteLength;
  }
  return result;
}
