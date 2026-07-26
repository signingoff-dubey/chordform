import type { FingerState, ChordQuality } from './types';

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const STATE_INDEX = (f: FingerState): number =>
  (f[0] ? 1 : 0) |
  (f[1] ? 2 : 0) |
  (f[2] ? 4 : 0) |
  (f[3] ? 8 : 0) |
  (f[4] ? 16 : 0);

const LEFT_ROOT_TABLE: Record<number, string> = {
  1: 'A',
  2: 'B',
  4: 'C',
  8: 'D',
  16: 'E',
  3: 'F',
  6: 'G',
  5: 'A#',
  9: 'C#',
  17: 'D#',
  10: 'F#',
  18: 'G#',
};

const RIGHT_QUALITY_TABLE: Record<number, ChordQuality> = {
  1:  { name: 'Major',    intervals: [0, 4, 7] },
  2:  { name: 'Minor',    intervals: [0, 3, 7] },
  4:  { name: 'Dominant 7', intervals: [0, 4, 7, 10] },
  8:  { name: 'Major 7',  intervals: [0, 4, 7, 11] },
  16: { name: 'Minor 7',  intervals: [0, 3, 7, 10] },
  3:  { name: 'Sus2',     intervals: [0, 2, 7] },
  5:  { name: 'Sus4',     intervals: [0, 5, 7] },
  9:  { name: 'Diminished', intervals: [0, 3, 6] },
  17: { name: 'Augmented', intervals: [0, 4, 8] },
  6:  { name: 'Major 6',  intervals: [0, 4, 7, 9] },
  10: { name: 'Minor 6',  intervals: [0, 3, 7, 9] },
  18: { name: 'Add9',     intervals: [0, 4, 7, 14] },
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
