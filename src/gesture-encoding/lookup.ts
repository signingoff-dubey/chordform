import type { FingerState, ChordQuality } from './types';

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const STATE_INDEX = (f: FingerState): number =>
  (f[0] ? 1 : 0) |
  (f[1] ? 2 : 0) |
  (f[2] ? 4 : 0) |
  (f[3] ? 8 : 0) |
  (f[4] ? 16 : 0);

// Gesture states are ordered by how comfortable they are to form (isolating
// just the middle or just the ring finger is genuinely hard for most
// people, so neither is ever used alone — they only appear combined with
// other fingers). The progression starts at Index (not Thumb) and moves
// through easy solos, then duos, then trios:
//   1. Index            5. Index+Middle    9. Ring+Pinky
//   2. Thumb            6. Thumb+Pinky    10. Thumb+Index+Pinky
//   3. Pinky            7. Index+Pinky    11. Thumb+Index+Middle
//   4. Thumb+Index      8. Thumb+Middle   12. Thumb+Middle+Pinky
//
// Root notes are assigned to that progression in full chromatic order
// (A, A#, B, C, C#, D, D#, E, F, F#, G, G#) rather than naturals-then-sharps,
// so the note sequence itself always reads in order regardless of which
// gesture happens to be easiest.
const LEFT_ROOT_TABLE: Record<number, string> = {
  2: 'A',    // Index
  1: 'A#',   // Thumb
  16: 'B',   // Pinky
  3: 'C',    // Thumb+Index
  6: 'C#',   // Index+Middle
  17: 'D',   // Thumb+Pinky
  18: 'D#',  // Index+Pinky
  5: 'E',    // Thumb+Middle
  24: 'F',   // Ring+Pinky
  19: 'F#',  // Thumb+Index+Pinky
  7: 'G',    // Thumb+Index+Middle
  21: 'G#',  // Thumb+Middle+Pinky
};

const RIGHT_QUALITY_TABLE: Record<number, ChordQuality> = {
  2:  { name: 'Major',      intervals: [0, 4, 7] },       // Index
  1:  { name: 'Minor',      intervals: [0, 3, 7] },       // Thumb
  16: { name: 'Dominant 7', intervals: [0, 4, 7, 10] },   // Pinky
  3:  { name: 'Major 7',    intervals: [0, 4, 7, 11] },   // Thumb+Index
  6:  { name: 'Minor 7',    intervals: [0, 3, 7, 10] },   // Index+Middle
  17: { name: 'Sus2',       intervals: [0, 2, 7] },       // Thumb+Pinky
  18: { name: 'Sus4',       intervals: [0, 5, 7] },       // Index+Pinky
  5:  { name: 'Diminished', intervals: [0, 3, 6] },       // Thumb+Middle
  24: { name: 'Augmented',  intervals: [0, 4, 8] },       // Ring+Pinky
  19: { name: 'Major 6',    intervals: [0, 4, 7, 9] },    // Thumb+Index+Pinky
  7:  { name: 'Minor 6',    intervals: [0, 3, 7, 9] },    // Thumb+Index+Middle
  21: { name: 'Add9',       intervals: [0, 4, 7, 14] },   // Thumb+Middle+Pinky
};

const MIDI_NOTE = (rootIndex: number, semitone: number, octave: number = 3): number => {
  const rootMidi = (octave + 1) * 12 + rootIndex;
  return rootMidi + semitone;
};

export function lookupRoot(leftFingers: FingerState): string | null {
  const idx = STATE_INDEX(leftFingers);
  if (idx === 0) return null;
  return LEFT_ROOT_TABLE[idx] ?? null;
}

export function lookupQuality(rightFingers: FingerState): ChordQuality | null {
  const idx = STATE_INDEX(rightFingers);
  if (idx === 0) return null;
  return RIGHT_QUALITY_TABLE[idx] ?? null;
}

export function resolveChord(
  leftFingers: FingerState | null,
  rightFingers: FingerState | null
): { root: string | null; quality: ChordQuality | null; chordName: string | null; midiNotes: number[] | null } {
  if (!leftFingers || !rightFingers) {
    return { root: null, quality: null, chordName: null, midiNotes: null };
  }

  const root = lookupRoot(leftFingers);
  const quality = lookupQuality(rightFingers);

  if (!root || !quality) {
    return { root, quality, chordName: null, midiNotes: null };
  }

  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  const midiNotes = quality.intervals.map(interval => MIDI_NOTE(rootIndex, interval));

  const chordName = `${root} ${quality.name}`;

  return { root, quality, chordName, midiNotes };
}

export function getRootNoteName(fingers: FingerState): string | null {
  return lookupRoot(fingers);
}

export function getQualityName(fingers: FingerState): string | null {
  const q = lookupQuality(fingers);
  return q?.name ?? null;
}

export const ALL_QUALITIES: ChordQuality[] = Object.values(RIGHT_QUALITY_TABLE);

export const LEFT_ROOT_TABLE_ENTRIES = Object.entries(LEFT_ROOT_TABLE).map(([state, note]) => ({
  state: parseInt(state),
  note,
  fingers: [
    !!(parseInt(state) & 1),
    !!(parseInt(state) & 2),
    !!(parseInt(state) & 4),
    !!(parseInt(state) & 8),
    !!(parseInt(state) & 16),
  ] as FingerState,
}));

export const RIGHT_QUALITY_TABLE_ENTRIES = Object.entries(RIGHT_QUALITY_TABLE).map(([state, quality]) => ({
  state: parseInt(state),
  quality,
  fingers: [
    !!(parseInt(state) & 1),
    !!(parseInt(state) & 2),
    !!(parseInt(state) & 4),
    !!(parseInt(state) & 8),
    !!(parseInt(state) & 16),
  ] as FingerState,
}));
