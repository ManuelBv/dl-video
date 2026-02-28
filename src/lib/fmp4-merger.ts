/**
 * Minimal fMP4 init-segment merger.
 *
 * Takes a video-only and an audio-only fragmented-MP4 init segment and
 * produces a single init segment that declares both tracks.  Also
 * provides a helper to patch the track_id inside audio media segments
 * so they reference the correct track after the merge.
 *
 * Supports:
 *  - version-0 and version-1 tkhd boxes
 *  - Extended-size (64-bit) boxes are NOT supported — they are extremely
 *    rare in HLS init segments.
 */

// ── Box primitives ────────────────────────────────────────────────────────────

function readU32(buf: Uint8Array, off: number): number {
  return ((buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]) >>> 0;
}

function writeU32(buf: Uint8Array, off: number, val: number): void {
  buf[off]     = (val >>> 24) & 0xff;
  buf[off + 1] = (val >>> 16) & 0xff;
  buf[off + 2] = (val >>> 8)  & 0xff;
  buf[off + 3] =  val         & 0xff;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.byteLength; }
  return out;
}

/** Wrap payload bytes in an MP4 box with the given 4-char type. */
function makeBox(type: string, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + payload.byteLength);
  writeU32(out, 0, out.byteLength);
  out[4] = type.charCodeAt(0); out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2); out[7] = type.charCodeAt(3);
  out.set(payload, 8);
  return out;
}

interface Box { type: string; bytes: Uint8Array }

/** Parse the direct children of a container starting at `startOffset` (default 8, skipping the box's own header). */
function parseChildren(buf: Uint8Array, startOffset = 8): Box[] {
  const result: Box[] = [];
  let pos = startOffset;
  while (pos + 8 <= buf.length) {
    const size = readU32(buf, pos);
    if (size < 8) break;
    const type = String.fromCharCode(buf[pos+4], buf[pos+5], buf[pos+6], buf[pos+7]);
    result.push({ type, bytes: buf.slice(pos, pos + size) });
    pos += size;
  }
  return result;
}

function findChild(container: Uint8Array, type: string): Uint8Array | null {
  for (const child of parseChildren(container)) {
    if (child.type === type) return child.bytes;
  }
  return null;
}

// ── Track ID helpers ──────────────────────────────────────────────────────────

function getTrackId(trak: Uint8Array): number {
  const tkhd = findChild(trak, 'tkhd');
  if (!tkhd) return 1;
  const version = tkhd[8];
  // tkhd payload after 8-byte header:
  //   version 0: flags(3) + creation(4) + modification(4) + track_id(4) → byte 8+4+4+4 = 20
  //   version 1: flags(3) + creation(8) + modification(8) + track_id(4) → byte 8+4+8+8 = 28
  const offset = version === 1 ? 28 : 20;
  return readU32(tkhd, offset);
}

/** Return a copy of `trak` with its tkhd.track_id changed to `newId`. */
function patchTrakId(trak: Uint8Array, newId: number): Uint8Array {
  const children = parseChildren(trak);
  const patched = children.map(({ type, bytes }) => {
    if (type !== 'tkhd') return bytes;
    const out = bytes.slice();
    const version = out[8];
    const offset = version === 1 ? 28 : 20;
    writeU32(out, offset, newId);
    return out;
  });
  return makeBox('trak', concat(...patched));
}

/** Build a minimal trex box for `trackId` (all defaults set to 0 / 1). */
function makeTrex(trackId: number): Uint8Array {
  // Full box payload per ISO 14496-12 §8.8.3:
  // version(1) + flags(3) + track_id(4) + default_sample_description_index(4)
  // + default_sample_duration(4) + default_sample_size(4) + default_sample_flags(4) = 24 bytes
  const payload = new Uint8Array(24);
  writeU32(payload, 4, trackId);
  writeU32(payload, 8, 1); // default_sample_description_index
  return makeBox('trex', payload);
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface MergeResult {
  initSegment: Uint8Array;
  audioTrackIdOriginal: number;
  audioTrackIdFinal: number;
}

/**
 * Merge a video-only fMP4 init segment and an audio-only fMP4 init segment
 * into a single init segment that declares both tracks.
 *
 * Returns the merged init segment and the original / final audio track IDs
 * so that callers can patch audio media segments when the ID changed.
 */
export function mergeInitSegments(videoInit: Uint8Array, audioInit: Uint8Array): MergeResult {
  const vBoxes = parseChildren(videoInit, 0);
  const aBoxes = parseChildren(audioInit, 0);

  const videoMoov = vBoxes.find((b) => b.type === 'moov')?.bytes;
  const audioMoov = aBoxes.find((b) => b.type === 'moov')?.bytes;
  const ftyp      = vBoxes.find((b) => b.type === 'ftyp')?.bytes;

  if (!videoMoov || !audioMoov) throw new Error('fmp4-merger: missing moov in init segment');

  const videoTrak = findChild(videoMoov, 'trak');
  const audioTrak = findChild(audioMoov, 'trak');
  if (!videoTrak || !audioTrak) throw new Error('fmp4-merger: missing trak in moov');

  const videoTrackId         = getTrackId(videoTrak);
  const audioTrackIdOriginal = getTrackId(audioTrak);
  // Ensure audio uses a different track_id than video
  const audioTrackIdFinal    = videoTrackId === audioTrackIdOriginal
    ? videoTrackId + 1
    : audioTrackIdOriginal;

  const finalAudioTrak = audioTrackIdOriginal !== audioTrackIdFinal
    ? patchTrakId(audioTrak, audioTrackIdFinal)
    : audioTrak;

  // Build the combined moov: mvhd + video trak + audio trak + mvex
  const mvhd = findChild(videoMoov, 'mvhd') ?? new Uint8Array(0);
  const mvex = makeBox('mvex', concat(makeTrex(videoTrackId), makeTrex(audioTrackIdFinal)));
  const newMoov = makeBox('moov', concat(mvhd, videoTrak, finalAudioTrak, mvex));

  return {
    initSegment: ftyp ? concat(ftyp, newMoov) : newMoov,
    audioTrackIdOriginal,
    audioTrackIdFinal,
  };
}

/**
 * Patch every `moof > traf > tfhd` track_id in an audio media segment
 * from `oldId` to `newId`.  Returns the original buffer unchanged if the
 * IDs are the same.
 */
export function patchAudioSegment(segment: Uint8Array, oldId: number, newId: number): Uint8Array {
  if (oldId === newId) return segment;
  const out = segment.slice();

  let pos = 0;
  while (pos + 8 <= out.length) {
    const size = readU32(out, pos);
    const type = String.fromCharCode(out[pos+4], out[pos+5], out[pos+6], out[pos+7]);
    if (size < 8) break;

    if (type === 'moof') {
      // Walk moof children for traf
      let moofPos = pos + 8;
      while (moofPos + 8 <= pos + size) {
        const cSize = readU32(out, moofPos);
        const cType = String.fromCharCode(out[moofPos+4], out[moofPos+5], out[moofPos+6], out[moofPos+7]);
        if (cSize < 8) break;

        if (cType === 'traf') {
          // Walk traf children for tfhd
          let trafPos = moofPos + 8;
          while (trafPos + 8 <= moofPos + cSize) {
            const tSize = readU32(out, trafPos);
            const tType = String.fromCharCode(out[trafPos+4], out[trafPos+5], out[trafPos+6], out[trafPos+7]);
            if (tSize < 8) break;

            if (tType === 'tfhd') {
              // tfhd: 8(header) + 4(version+flags) + 4(track_id)
              if (readU32(out, trafPos + 12) === oldId) writeU32(out, trafPos + 12, newId);
            }
            trafPos += tSize;
          }
        }
        moofPos += cSize;
      }
    }
    pos += size;
  }

  return out;
}
