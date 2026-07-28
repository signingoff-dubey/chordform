declare module 'fingerpose' {
  export const Finger: {
    Thumb: number;
    Index: number;
    Middle: number;
    Ring: number;
    Pinky: number;
  };

  export const FingerCurl: {
    NoCurl: number;
    HalfCurl: number;
    FullCurl: number;
  };

  export class GestureDescription {
    constructor(name: string);
    addCurl(finger: number, curl: number, confidence: number): void;
  }

  export interface EstimatedGesture {
    name: string;
    score: number;
  }

  export interface GestureEstimatorResult {
    gestures: EstimatedGesture[];
  }

  export class GestureEstimator {
    constructor(gestures: GestureDescription[]);
    estimate(landmarks: number[][], minConfidence: number): GestureEstimatorResult;
  }
}
