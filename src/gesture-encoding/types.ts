export type FingerState = [boolean, boolean, boolean, boolean, boolean];

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

export interface ChordQuality {
  name: string;
  intervals: number[];
}

export interface GestureResult {
  root: string | null;
  quality: ChordQuality | null;
  chordName: string | null;
  notes: number[] | null;
}

export interface HandState {
  fingers: FingerState;
  centroid: { x: number; y: number } | null;
  confidence: number;
}
