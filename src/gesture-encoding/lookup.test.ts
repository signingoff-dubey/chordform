import { describe, it, expect } from 'vitest';
import { lookupRoot, lookupQuality, resolveChord } from './lookup';
import type { FingerState } from './types';

const T = (t: boolean, i: boolean, m: boolean, r: boolean, p: boolean): FingerState => [t, i, m, r, p];

describe('lookupRoot', () => {
  it('returns null for fist (all curled)', () => {
    expect(lookupRoot(T(false, false, false, false, false))).toBeNull();
  });

  it('returns A for index only', () => {
    expect(lookupRoot(T(false, true, false, false, false))).toBe('A');
  });

  it('returns A# for thumb only', () => {
    expect(lookupRoot(T(true, false, false, false, false))).toBe('A#');
  });

  it('returns B for pinky only', () => {
    expect(lookupRoot(T(false, false, false, false, true))).toBe('B');
  });

  it('returns C for thumb+index', () => {
    expect(lookupRoot(T(true, true, false, false, false))).toBe('C');
  });

  it('returns C# for index+middle', () => {
    expect(lookupRoot(T(false, true, true, false, false))).toBe('C#');
  });

  it('returns D for thumb+pinky', () => {
    expect(lookupRoot(T(true, false, false, false, true))).toBe('D');
  });

  it('returns D# for index+pinky', () => {
    expect(lookupRoot(T(false, true, false, false, true))).toBe('D#');
  });

  it('returns E for thumb+middle', () => {
    expect(lookupRoot(T(true, false, true, false, false))).toBe('E');
  });

  it('returns F for ring+pinky', () => {
    expect(lookupRoot(T(false, false, false, true, true))).toBe('F');
  });

  it('returns F# for thumb+index+pinky', () => {
    expect(lookupRoot(T(true, true, false, false, true))).toBe('F#');
  });

  it('returns G for thumb+index+middle', () => {
    expect(lookupRoot(T(true, true, true, false, false))).toBe('G');
  });

  it('returns G# for thumb+middle+pinky', () => {
    expect(lookupRoot(T(true, false, true, false, true))).toBe('G#');
  });

  it('returns null for middle only (isolated middle is unassigned)', () => {
    expect(lookupRoot(T(false, false, true, false, false))).toBeNull();
  });

  it('returns null for ring only (isolated ring is unassigned)', () => {
    expect(lookupRoot(T(false, false, false, true, false))).toBeNull();
  });

  it('returns null for reserved combinations', () => {
    expect(lookupRoot(T(false, false, true, true, false))).toBeNull();
    expect(lookupRoot(T(true, false, false, true, false))).toBeNull();
  });
});

describe('lookupQuality', () => {
  it('returns null for fist', () => {
    expect(lookupQuality(T(false, false, false, false, false))).toBeNull();
  });

  it('returns Major for index only', () => {
    const q = lookupQuality(T(false, true, false, false, false));
    expect(q?.name).toBe('Major');
    expect(q?.intervals).toEqual([0, 4, 7]);
  });

  it('returns Minor for thumb only', () => {
    const q = lookupQuality(T(true, false, false, false, false));
    expect(q?.name).toBe('Minor');
    expect(q?.intervals).toEqual([0, 3, 7]);
  });

  it('returns Dominant 7 for pinky only', () => {
    const q = lookupQuality(T(false, false, false, false, true));
    expect(q?.name).toBe('Dominant 7');
    expect(q?.intervals).toEqual([0, 4, 7, 10]);
  });

  it('returns Major 7 for thumb+index', () => {
    const q = lookupQuality(T(true, true, false, false, false));
    expect(q?.name).toBe('Major 7');
    expect(q?.intervals).toEqual([0, 4, 7, 11]);
  });

  it('returns Minor 7 for index+middle', () => {
    const q = lookupQuality(T(false, true, true, false, false));
    expect(q?.name).toBe('Minor 7');
    expect(q?.intervals).toEqual([0, 3, 7, 10]);
  });

  it('returns Sus2 for thumb+pinky', () => {
    const q = lookupQuality(T(true, false, false, false, true));
    expect(q?.name).toBe('Sus2');
  });

  it('returns Sus4 for index+pinky', () => {
    const q = lookupQuality(T(false, true, false, false, true));
    expect(q?.name).toBe('Sus4');
  });

  it('returns Diminished for thumb+middle', () => {
    const q = lookupQuality(T(true, false, true, false, false));
    expect(q?.name).toBe('Diminished');
    expect(q?.intervals).toEqual([0, 3, 6]);
  });

  it('returns Augmented for ring+pinky', () => {
    const q = lookupQuality(T(false, false, false, true, true));
    expect(q?.name).toBe('Augmented');
    expect(q?.intervals).toEqual([0, 4, 8]);
  });

  it('returns Major 6 for thumb+index+pinky', () => {
    const q = lookupQuality(T(true, true, false, false, true));
    expect(q?.name).toBe('Major 6');
  });

  it('returns Minor 6 for thumb+index+middle', () => {
    const q = lookupQuality(T(true, true, true, false, false));
    expect(q?.name).toBe('Minor 6');
  });

  it('returns Add9 for thumb+middle+pinky', () => {
    const q = lookupQuality(T(true, false, true, false, true));
    expect(q?.name).toBe('Add9');
    expect(q?.intervals).toEqual([0, 4, 7, 14]);
  });

  it('returns null for middle only and ring only (unassigned)', () => {
    expect(lookupQuality(T(false, false, true, false, false))).toBeNull();
    expect(lookupQuality(T(false, false, false, true, false))).toBeNull();
  });
});

describe('resolveChord', () => {
  it('returns null fields when no hands provided', () => {
    const result = resolveChord(null, null);
    expect(result.root).toBeNull();
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('returns null fields when only left hand provided', () => {
    const result = resolveChord(T(false, true, false, false, false), null);
    expect(result.root).toBeNull();
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('returns null fields when only right hand provided', () => {
    const result = resolveChord(null, T(false, true, false, false, false));
    expect(result.root).toBeNull();
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('resolves A Major correctly (index + index)', () => {
    const result = resolveChord(
      T(false, true, false, false, false),
      T(false, true, false, false, false)
    );
    expect(result.root).toBe('A');
    expect(result.quality?.name).toBe('Major');
    expect(result.chordName).toBe('A Major');
    expect(result.midiNotes).toEqual([57, 61, 64]);
  });

  it('resolves C Minor correctly (thumb+index root, thumb quality)', () => {
    const result = resolveChord(
      T(true, true, false, false, false),
      T(true, false, false, false, false)
    );
    expect(result.root).toBe('C');
    expect(result.quality?.name).toBe('Minor');
    expect(result.chordName).toBe('C Minor');
    expect(result.midiNotes).toEqual([48, 51, 55]);
  });

  it('resolves D Dominant 7 correctly (thumb+pinky root, pinky quality)', () => {
    const result = resolveChord(
      T(true, false, false, false, true),
      T(false, false, false, false, true)
    );
    expect(result.root).toBe('D');
    expect(result.quality?.name).toBe('Dominant 7');
    expect(result.midiNotes).toEqual([50, 54, 57, 60]);
  });

  it('resolves E Diminished correctly (thumb+middle root, thumb+middle quality)', () => {
    const result = resolveChord(
      T(true, false, true, false, false),
      T(true, false, true, false, false)
    );
    expect(result.root).toBe('E');
    expect(result.quality?.name).toBe('Diminished');
    expect(result.midiNotes).toEqual([52, 55, 58]);
  });

  it('returns null chord for fist left + valid right', () => {
    const result = resolveChord(
      T(false, false, false, false, false),
      T(false, true, false, false, false)
    );
    expect(result.root).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('returns null chord for valid left + fist right', () => {
    const result = resolveChord(
      T(false, true, false, false, false),
      T(false, false, false, false, false)
    );
    expect(result.root).toBe('A');
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('returns null for reserved (isolated middle) left gesture', () => {
    const result = resolveChord(
      T(false, false, true, false, false),
      T(false, true, false, false, false)
    );
    expect(result.root).toBeNull();
    expect(result.chordName).toBeNull();
  });

  it('returns null for reserved (isolated ring) right gesture', () => {
    const result = resolveChord(
      T(false, true, false, false, false),
      T(false, false, false, true, false)
    );
    expect(result.root).toBe('A');
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
  });

  it('Add9 (thumb+middle+pinky) produces 4 midi notes', () => {
    const result = resolveChord(
      T(true, true, false, false, false),
      T(true, false, true, false, true)
    );
    expect(result.midiNotes).toHaveLength(4);
    expect(result.chordName).toBe('C Add9');
  });
});
