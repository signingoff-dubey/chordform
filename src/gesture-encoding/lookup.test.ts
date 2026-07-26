import { describe, it, expect } from 'vitest';
import { lookupRoot, lookupQuality, resolveChord } from './lookup';
import type { FingerState } from './types';

const T = (t: boolean, i: boolean, m: boolean, r: boolean, p: boolean): FingerState => [t, i, m, r, p];

describe('lookupRoot', () => {
  it('returns null for fist (all curled)', () => {
    expect(lookupRoot(T(false, false, false, false, false))).toBeNull();
  });

  it('returns A for thumb only', () => {
    expect(lookupRoot(T(true, false, false, false, false))).toBe('A');
  });

  it('returns B for index only', () => {
    expect(lookupRoot(T(false, true, false, false, false))).toBe('B');
  });

  it('returns C for middle only', () => {
    expect(lookupRoot(T(false, false, true, false, false))).toBe('C');
  });

  it('returns D for ring only', () => {
    expect(lookupRoot(T(false, false, false, true, false))).toBe('D');
  });

  it('returns E for pinky only', () => {
    expect(lookupRoot(T(false, false, false, false, true))).toBe('E');
  });

  it('returns F for thumb+index', () => {
    expect(lookupRoot(T(true, true, false, false, false))).toBe('F');
  });

  it('returns G for index+middle', () => {
    expect(lookupRoot(T(false, true, true, false, false))).toBe('G');
  });

  it('returns A# for thumb+middle', () => {
    expect(lookupRoot(T(true, false, true, false, false))).toBe('A#');
  });

  it('returns C# for thumb+ring', () => {
    expect(lookupRoot(T(true, false, false, true, false))).toBe('C#');
  });

  it('returns D# for thumb+pinky', () => {
    expect(lookupRoot(T(true, false, false, false, true))).toBe('D#');
  });

  it('returns F# for index+ring', () => {
    expect(lookupRoot(T(false, true, false, true, false))).toBe('F#');
  });

  it('returns G# for index+pinky', () => {
    expect(lookupRoot(T(false, true, false, false, true))).toBe('G#');
  });

  it('returns null for reserved combinations', () => {
    expect(lookupRoot(T(false, false, true, true, false))).toBeNull();
    expect(lookupRoot(T(false, false, true, false, true))).toBeNull();
    expect(lookupRoot(T(false, false, false, true, true))).toBeNull();
    expect(lookupRoot(T(false, true, true, true, false))).toBeNull();
  });
});

describe('lookupQuality', () => {
  it('returns null for fist', () => {
    expect(lookupQuality(T(false, false, false, false, false))).toBeNull();
  });

  it('returns Major for thumb only', () => {
    const q = lookupQuality(T(true, false, false, false, false));
    expect(q?.name).toBe('Major');
    expect(q?.intervals).toEqual([0, 4, 7]);
  });

  it('returns Minor for index only', () => {
    const q = lookupQuality(T(false, true, false, false, false));
    expect(q?.name).toBe('Minor');
    expect(q?.intervals).toEqual([0, 3, 7]);
  });

  it('returns Dominant 7 for middle only', () => {
    const q = lookupQuality(T(false, false, true, false, false));
    expect(q?.name).toBe('Dominant 7');
    expect(q?.intervals).toEqual([0, 4, 7, 10]);
  });

  it('returns Major 7 for ring only', () => {
    const q = lookupQuality(T(false, false, false, true, false));
    expect(q?.name).toBe('Major 7');
    expect(q?.intervals).toEqual([0, 4, 7, 11]);
  });

  it('returns Minor 7 for pinky only', () => {
    const q = lookupQuality(T(false, false, false, false, true));
    expect(q?.name).toBe('Minor 7');
    expect(q?.intervals).toEqual([0, 3, 7, 10]);
  });

  it('returns Sus2 for thumb+index', () => {
    const q = lookupQuality(T(true, true, false, false, false));
    expect(q?.name).toBe('Sus2');
  });

  it('returns Sus4 for thumb+middle', () => {
    const q = lookupQuality(T(true, false, true, false, false));
    expect(q?.name).toBe('Sus4');
  });

  it('returns Diminished for thumb+ring', () => {
    const q = lookupQuality(T(true, false, false, true, false));
    expect(q?.name).toBe('Diminished');
    expect(q?.intervals).toEqual([0, 3, 6]);
  });

  it('returns Augmented for thumb+pinky', () => {
    const q = lookupQuality(T(true, false, false, false, true));
    expect(q?.name).toBe('Augmented');
    expect(q?.intervals).toEqual([0, 4, 8]);
  });

  it('returns Major 6 for index+middle', () => {
    const q = lookupQuality(T(false, true, true, false, false));
    expect(q?.name).toBe('Major 6');
  });

  it('returns Minor 6 for index+ring', () => {
    const q = lookupQuality(T(false, true, false, true, false));
    expect(q?.name).toBe('Minor 6');
  });

  it('returns Add9 for index+pinky', () => {
    const q = lookupQuality(T(false, true, false, false, true));
    expect(q?.name).toBe('Add9');
    expect(q?.intervals).toEqual([0, 4, 7, 14]);
  });

  it('returns null for reserved combinations', () => {
    expect(lookupQuality(T(false, false, true, true, false))).toBeNull();
    expect(lookupQuality(T(false, true, true, true, false))).toBeNull();
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
    const result = resolveChord(T(true, false, false, false, false), null);
    expect(result.root).toBeNull();
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('returns null fields when only right hand provided', () => {
    const result = resolveChord(null, T(true, false, false, false, false));
    expect(result.root).toBeNull();
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('resolves A Major correctly', () => {
    const result = resolveChord(
      T(true, false, false, false, false),
      T(true, false, false, false, false)
    );
    expect(result.root).toBe('A');
    expect(result.quality?.name).toBe('Major');
    expect(result.chordName).toBe('A Major');
    expect(result.midiNotes).toEqual([57, 61, 64]);
  });

  it('resolves C Minor correctly', () => {
    const result = resolveChord(
      T(false, false, true, false, false),
      T(false, true, false, false, false)
    );
    expect(result.root).toBe('C');
    expect(result.quality?.name).toBe('Minor');
    expect(result.chordName).toBe('C Minor');
    expect(result.midiNotes).toEqual([48, 51, 55]);
  });

  it('resolves G Dominant 7 correctly', () => {
    const result = resolveChord(
      T(false, true, true, false, false),
      T(false, false, true, false, false)
    );
    expect(result.root).toBe('G');
    expect(result.quality?.name).toBe('Dominant 7');
    expect(result.chordName).toBe('G Dominant 7');
    expect(result.midiNotes).toEqual([55, 59, 62, 65]);
  });

  it('resolves F# Diminished correctly', () => {
    const result = resolveChord(
      T(false, true, false, true, false),
      T(true, false, false, true, false)
    );
    expect(result.root).toBe('F#');
    expect(result.quality?.name).toBe('Diminished');
    expect(result.midiNotes).toEqual([54, 57, 60]);
  });

  it('returns null chord for fist left + valid right', () => {
    const result = resolveChord(
      T(false, false, false, false, false),
      T(true, false, false, false, false)
    );
    expect(result.root).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('returns null chord for valid left + fist right', () => {
    const result = resolveChord(
      T(true, false, false, false, false),
      T(false, false, false, false, false)
    );
    expect(result.root).toBe('A');
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
    expect(result.midiNotes).toBeNull();
  });

  it('returns null for reserved left gesture', () => {
    const result = resolveChord(
      T(false, false, true, true, false),
      T(true, false, false, false, false)
    );
    expect(result.root).toBeNull();
    expect(result.chordName).toBeNull();
  });

  it('returns null for reserved right gesture', () => {
    const result = resolveChord(
      T(true, false, false, false, false),
      T(false, false, true, true, false)
    );
    expect(result.root).toBe('A');
    expect(result.quality).toBeNull();
    expect(result.chordName).toBeNull();
  });

  it('Add9 produces 4 midi notes', () => {
    const result = resolveChord(
      T(false, false, true, false, false),
      T(false, true, false, false, true)
    );
    expect(result.midiNotes).toHaveLength(4);
    expect(result.chordName).toBe('C Add9');
  });
});
