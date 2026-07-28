import { Finger, FingerCurl, GestureDescription, GestureEstimator } from 'fingerpose';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { FingerState } from '../gesture-encoding';

// fingerpose classifies per-finger curl (NoCurl / HalfCurl / FullCurl) using the
// angles between consecutive finger-joint vectors, which holds up under hand
// rotation/tilt — unlike a raw tip-vs-pip coordinate comparison. We build one
// GestureDescription per possible 5-finger extended/curled combination (32
// total) and let the estimator pick the best-scoring match each frame.
const FINGER_ORDER = [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky];

function buildEstimator(): GestureEstimator {
  const descriptions: GestureDescription[] = [];
  for (let state = 0; state < 32; state++) {
    const gesture = new GestureDescription(`state_${state}`);
    for (let i = 0; i < 5; i++) {
      const extended = !!(state & (1 << i));
      gesture.addCurl(FINGER_ORDER[i], extended ? FingerCurl.NoCurl : FingerCurl.FullCurl, 1.0);
      gesture.addCurl(FINGER_ORDER[i], FingerCurl.HalfCurl, 0.5);
    }
    descriptions.push(gesture);
  }
  return new GestureEstimator(descriptions);
}

const estimator = buildEstimator();

// fingerpose scores are normalized to a 0-10 scale; below ~7.5 a frame is
// genuinely ambiguous (hand mid-transition, rotated, occluded) rather than a
// clean match to any of the 32 states. Below that, treat it as "no gesture"
// (state 0 / fist) instead of forcing the nearest match.
const MIN_SCORE = 7.5;

export function classifyFingerState(landmarks: NormalizedLandmark[]): FingerState {
  const points = landmarks.map(lm => [lm.x, lm.y, lm.z]);
  const result = estimator.estimate(points, MIN_SCORE);

  let best = result.gestures[0] ?? null;
  for (const g of result.gestures) {
    if (!best || g.score > best.score) best = g;
  }

  const stateIdx = best ? parseInt(best.name.replace('state_', ''), 10) : 0;
  return [0, 1, 2, 3, 4].map(i => !!(stateIdx & (1 << i))) as FingerState;
}
