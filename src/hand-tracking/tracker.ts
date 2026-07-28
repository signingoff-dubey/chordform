import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { FingerState } from '../gesture-encoding';
import { classifyFingerState } from './finger-curl';

export interface TrackedHand {
  fingers: FingerState;
  landmarks: NormalizedLandmark[];
  centroid: { x: number; y: number };
  confidence: number;
  debounceProgress: number;
}

export interface TrackingResult {
  left: TrackedHand | null;
  right: TrackedHand | null;
}

interface DebounceEntry {
  fingers: FingerState;
  startTime: number;
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private running = false;
  private onResult: ((result: TrackingResult) => void) | null = null;
  private animationId: number | null = null;
  private videoEl: HTMLVideoElement | null = null;

  private readonly DEBOUNCE_MS = 220;
  // This is MediaPipe's left/right classification confidence, not a
  // hand-presence score — we don't use the handedness label (see loop()),
  // so this is only a loose sanity filter against near-garbage detections,
  // not a real detection-quality gate. Keep it lenient to avoid dropping
  // clearly-visible hands just because left/right is ambiguous.
  private readonly MIN_CONFIDENCE = 0.3;

  private debounceStore: Record<string, DebounceEntry | null> = {
    left: null,
    right: null,
  };
  private committedFingers: Record<string, FingerState | null> = {
    left: null,
    right: null,
  };

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
  }

  start(videoEl: HTMLVideoElement, onResult: (result: TrackingResult) => void): void {
    this.videoEl = videoEl;
    this.onResult = onResult;
    this.running = true;
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.debounceStore = { left: null, right: null };
    this.committedFingers = { left: null, right: null };
  }

  private loop = (): void => {
    if (!this.running || !this.handLandmarker || !this.videoEl) return;

    const results = this.handLandmarker.detectForVideo(this.videoEl, performance.now());

    const detected: TrackedHand[] = [];

    if (results.landmarks) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const confidence = results.handednesses?.[i]?.[0]?.score ?? 1;

        if (confidence < this.MIN_CONFIDENCE) continue;

        const fingers = this.landmarksToFingerState(landmarks);

        let cx = 0, cy = 0;
        for (const lm of landmarks) {
          cx += lm.x;
          cy += lm.y;
        }
        cx /= landmarks.length;
        cy /= landmarks.length;

        detected.push({
          fingers,
          landmarks,
          centroid: { x: cx, y: cy },
          confidence,
          debounceProgress: 0,
        });
      }
    }

    // We feed MediaPipe the raw (unmirrored) video frame, but the video is
    // displayed mirrored (selfie view). MediaPipe's Left/Right handedness
    // output assumes pre-mirrored input, so trusting it here would swap
    // root/quality relative to what the user sees on screen. Instead, assign
    // left/right purely from mirrored on-screen x-position: whichever hand
    // sits on the left half of what the user actually sees is "left" (root).
    // Raw centroid.x maps to mirroredX = 1 - x, so a larger raw x means it
    // renders further left on screen.
    let detectedLeft: TrackedHand | null = null;
    let detectedRight: TrackedHand | null = null;

    if (detected.length === 1) {
      const mirroredX = 1 - detected[0].centroid.x;
      if (mirroredX < 0.5) {
        detectedLeft = detected[0];
      } else {
        detectedRight = detected[0];
      }
    } else if (detected.length >= 2) {
      const sorted = [...detected].sort((a, b) => b.centroid.x - a.centroid.x);
      detectedLeft = sorted[0];
      detectedRight = sorted[1];
    }

    const finalLeft = this.debounceHand('left', detectedLeft);
    const finalRight = this.debounceHand('right', detectedRight);

    this.onResult?.({ left: finalLeft, right: finalRight });

    this.animationId = requestAnimationFrame(this.loop);
  };

  private landmarksToFingerState(landmarks: NormalizedLandmark[]): FingerState {
    return classifyFingerState(landmarks);
  }

  private debounceHand(side: string, raw: TrackedHand | null): TrackedHand | null {
    const debounce = this.debounceStore[side];
    const committed = this.committedFingers[side];

    if (!raw) {
      this.debounceStore[side] = null;
      this.committedFingers[side] = null;
      return null;
    }

    const currentFingers = raw.fingers;

    if (!debounce) {
      this.debounceStore[side] = { fingers: currentFingers, startTime: performance.now() };
      raw.debounceProgress = 0;
      if (committed) {
        raw.fingers = committed;
        raw.debounceProgress = 0.9;
      }
      return raw;
    }

    const fingersMatch = this.fingerArraysEqual(debounce.fingers, currentFingers);

    if (!fingersMatch) {
      this.debounceStore[side] = { fingers: currentFingers, startTime: performance.now() };
      if (committed) {
        raw.fingers = committed;
        raw.debounceProgress = 0.1;
      } else {
        raw.debounceProgress = 0;
      }
      return raw;
    }

    const elapsed = performance.now() - debounce.startTime;
    const progress = Math.min(elapsed / this.DEBOUNCE_MS, 1);
    raw.debounceProgress = progress;

    if (progress >= 1) {
      this.committedFingers[side] = currentFingers;
      return raw;
    }

    if (committed) {
      raw.fingers = committed;
    }
    return raw;
  }

  private fingerArraysEqual(a: FingerState, b: FingerState): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4];
  }

  dispose(): void {
    this.stop();
    this.handLandmarker?.close();
    this.handLandmarker = null;
  }
}
