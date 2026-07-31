import { useState, useCallback, useRef, useEffect } from 'react';
import { HandTracker } from '../hand-tracking';
import type { TrackingResult } from '../hand-tracking';
import { AudioEngine } from '../audio-engine';
import { resolveChord } from '../gesture-encoding';
import type { FingerState } from '../gesture-encoding';
import { SessionRecorder } from '../recording';
import type { SynthPreset } from '../audio-engine';
import { useCanvasRenderer } from './useCanvasRenderer';

const TRANSPOSE_MIN = -12;
const TRANSPOSE_MAX = 12;

export type AppScreen = 'landing' | 'loading' | 'play' | 'permission-denied' | 'camera-unavailable';

export interface ChordDisplay {
  root: string | null;
  quality: string | null;
  chordName: string | null;
  isSounding: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  blob: Blob | null;
  url: string | null;
}

interface AppState {
  screen: AppScreen;
  cameraStream: MediaStream | null;
  chord: ChordDisplay;
  recording: RecordingState;
  preset: SynthPreset;
  transpose: number;
  showReference: boolean;
  oneHandVisible: boolean;
}

export function useAppState() {
  const handTrackerRef = useRef<HandTracker | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const recorderRef = useRef<SessionRecorder | null>(null);
  const wasSoundingRef = useRef(false);
  const transposeRef = useRef(0);

  const vibratoBufferRef = useRef<number[]>([]);
  const VIBRATO_SMOOTH_WINDOW = 6;
  const stopCameraRef = useRef<() => void>(() => {});

  const {
    canvasRef,
    startRenderer,
    stopRenderer,
    updateTrackingResult,
    updateChordDisplay,
    setRecording,
  } = useCanvasRenderer();

  const micStreamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<AppState>({
    screen: 'landing',
    cameraStream: null,
    chord: { root: null, quality: null, chordName: null, isSounding: false },
    recording: { isRecording: false, blob: null, url: null },
    preset: 'warm',
    transpose: 0,
    showReference: false,
    oneHandVisible: false,
  });

  const setPartial = useCallback((partial: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPartial({ screen: 'camera-unavailable' });
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setPartial({ cameraStream: stream });
      return true;
    } catch (err) {
      const error = err as DOMException;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPartial({ screen: 'permission-denied' });
      } else {
        setPartial({ screen: 'camera-unavailable' });
      }
      return false;
    }
  }, [setPartial]);

  const requestMic = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return null;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch {
      return null;
    }
  }, []);

  const isStartingRef = useRef(false);

  const startPlaying = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    setPartial({ screen: 'loading' });

    const ok = await requestCamera();
    if (!ok) {
      isStartingRef.current = false;
      return;
    }

    try {
      const engine = new AudioEngine();
      await engine.init();
      // A fresh AudioEngine always constructs its default 'warm' voice — if
      // the user previously picked a different instrument, restore it so
      // the UI (which still shows the last selection) matches what's heard.
      if (state.preset !== 'warm') {
        engine.setPreset(state.preset);
      }
      audioEngineRef.current = engine;

      const tracker = new HandTracker();
      await tracker.init();
      handTrackerRef.current = tracker;

      const recorder = new SessionRecorder();
      recorderRef.current = recorder;

      setPartial({ screen: 'play' });
    } catch {
      audioEngineRef.current?.dispose();
      audioEngineRef.current = null;
      handTrackerRef.current?.dispose();
      handTrackerRef.current = null;

      setState(prev => {
        prev.cameraStream?.getTracks().forEach(t => t.stop());
        return { ...prev, cameraStream: null, screen: 'camera-unavailable' };
      });
    } finally {
      isStartingRef.current = false;
    }
  }, [requestCamera, setPartial, state.preset]);

  const onTrackingResult = useCallback((result: TrackingResult) => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    updateTrackingResult(result);

    const leftFingers: FingerState | null = result.left?.fingers ?? null;
    const rightFingers: FingerState | null = result.right?.fingers ?? null;

    const resolved = resolveChord(leftFingers, rightFingers);

    const oneHandVisible = (result.left !== null && result.right === null)
      || (result.left === null && result.right !== null);
    const anyHands = result.left !== null || result.right !== null;
    const isSounding = resolved.midiNotes !== null;

    const chordDisplay: ChordDisplay = {
      root: resolved.root,
      quality: resolved.quality?.name ?? null,
      chordName: resolved.chordName,
      isSounding,
    };
    updateChordDisplay(chordDisplay);

    setState(prev => ({
      ...prev,
      chord: chordDisplay,
      oneHandVisible: oneHandVisible && anyHands,
    }));

    if (isSounding && resolved.midiNotes) {
      const shiftedNotes = transposeRef.current === 0
        ? resolved.midiNotes
        : resolved.midiNotes.map(n => n + transposeRef.current);
      engine.playNotes(shiftedNotes);
      wasSoundingRef.current = true;
    } else {
      // Anything short of a fully-resolved chord must be silent: no hand in
      // frame, a hand held at fist (no fingers extended), or a gesture that
      // doesn't map to a note/quality. Checking hand presence alone missed
      // the fist case, since a fisted hand is still a non-null, truthy
      // FingerState — just one whose lookup resolves to nothing.
      engine.stopAll();
      wasSoundingRef.current = false;
    }

    const rightCentroid = result.right?.centroid;

    if (rightCentroid && resolved.quality && result.right) {
      vibratoBufferRef.current.push(rightCentroid.x);
      if (vibratoBufferRef.current.length > VIBRATO_SMOOTH_WINDOW) {
        vibratoBufferRef.current.shift();
      }

      const smoothedX = vibratoBufferRef.current.reduce((a, b) => a + b, 0)
        / vibratoBufferRef.current.length;

      const displacement = (smoothedX - 0.5) * 2;
      const deadzone = 0.15;
      let detune = 0;
      if (Math.abs(displacement) > deadzone) {
        detune = (displacement > 0 ? 1 : -1)
          * Math.min(Math.abs(displacement), 1)
          * 50;
      }
      engine.setVibrato(detune);
    } else {
      vibratoBufferRef.current = [];
      engine.setVibrato(0);
    }
  }, [updateTrackingResult, updateChordDisplay]);

  const startCamera = useCallback(async (videoEl: HTMLVideoElement, overlayCanvas: HTMLCanvasElement) => {
    const stream = state.cameraStream;
    if (!stream) return;
    videoEl.srcObject = stream;
    await videoEl.play();

    const parent = videoEl.parentElement;
    if (parent) {
      overlayCanvas.width = parent.clientWidth;
      overlayCanvas.height = parent.clientHeight;
    }
    startRenderer(overlayCanvas, videoEl);

    if (handTrackerRef.current) {
      handTrackerRef.current.start(videoEl, onTrackingResult);
    }
  }, [state.cameraStream, onTrackingResult, startRenderer]);

  const hiddenTimeoutRef = useRef<number | null>(null);
  const BACKGROUND_STOP_MS = 20000;

  useEffect(() => {
    const handleVisibility = () => {
      const engine = audioEngineRef.current;
      if (document.hidden) {
        if (engine) {
          engine.stopAll();
          wasSoundingRef.current = false;
        }
        if (hiddenTimeoutRef.current === null) {
          hiddenTimeoutRef.current = window.setTimeout(() => {
            hiddenTimeoutRef.current = null;
            stopCameraRef.current();
          }, BACKGROUND_STOP_MS);
        }
      } else if (hiddenTimeoutRef.current !== null) {
        window.clearTimeout(hiddenTimeoutRef.current);
        hiddenTimeoutRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (hiddenTimeoutRef.current !== null) {
        window.clearTimeout(hiddenTimeoutRef.current);
      }
    };
  }, []);

  const toggleReference = useCallback(() => {
    setPartial({ showReference: !state.showReference });
  }, [state.showReference, setPartial]);

  const setPreset = useCallback((preset: SynthPreset) => {
    audioEngineRef.current?.setPreset(preset);
    setPartial({ preset });
  }, [setPartial]);

  const adjustTranspose = useCallback((delta: number) => {
    setState(prev => {
      const next = Math.max(TRANSPOSE_MIN, Math.min(TRANSPOSE_MAX, prev.transpose + delta));
      transposeRef.current = next;
      return { ...prev, transpose: next };
    });
  }, []);

  const startRecording = useCallback(async () => {
    const engine = audioEngineRef.current;
    const recorder = recorderRef.current;
    const canvas = canvasRef.current;

    if (!engine || !recorder || !canvas) return;

    const audioStream = engine.getStreamForCapture();
    const micStream = await requestMic();
    micStreamRef.current = micStream;

    await recorder.startRecording(canvas, audioStream ?? null, micStream);

    setRecording(true);
    setPartial({ recording: { isRecording: true, blob: null, url: null } });
  }, [requestMic, setPartial, setRecording]);

  const stopRecording = useCallback(async () => {
    setRecording(false);
    const blob = await recorderRef.current?.stopRecording();
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    if (blob && blob.size > 0) {
      const url = URL.createObjectURL(blob);
      setPartial({
        recording: { isRecording: false, blob, url },
      });
    } else {
      setPartial({
        recording: { isRecording: false, blob: null, url: null },
      });
    }
  }, [setPartial, setRecording]);

  const discardRecording = useCallback(() => {
    if (state.recording.url) {
      URL.revokeObjectURL(state.recording.url);
    }
    setPartial({ recording: { isRecording: false, blob: null, url: null } });
  }, [state.recording.url, setPartial]);

  const downloadRecording = useCallback(() => {
    if (!state.recording.blob || !state.recording.url) return;

    // The actual container depends on what the browser's MediaRecorder
    // supported (see SessionRecorder.startRecording) — Safari records mp4,
    // not webm — so name the file from the blob's real MIME type.
    const ext = state.recording.blob.type.includes('mp4') ? 'mp4' : 'webm';

    const a = document.createElement('a');
    a.href = state.recording.url;
    a.download = `chordform-recording-${Date.now()}.${ext}`;
    a.click();
  }, [state.recording]);

  const stopCamera = useCallback(() => {
    handTrackerRef.current?.dispose();
    handTrackerRef.current = null;
    audioEngineRef.current?.dispose();
    audioEngineRef.current = null;
    recorderRef.current?.dispose();
    recorderRef.current = null;
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    stopRenderer();

    setState(prev => {
      prev.cameraStream?.getTracks().forEach(t => t.stop());
      if (prev.recording.url) {
        URL.revokeObjectURL(prev.recording.url);
      }
      return {
        ...prev,
        screen: 'landing',
        cameraStream: null,
        chord: { root: null, quality: null, chordName: null, isSounding: false },
        recording: { isRecording: false, blob: null, url: null },
        oneHandVisible: false,
      };
    });
  }, [stopRenderer]);

  useEffect(() => {
    stopCameraRef.current = stopCamera;
  }, [stopCamera]);

  const getWaveform = useCallback((): Float32Array | null => {
    return audioEngineRef.current?.getWaveform() ?? null;
  }, []);

  return {
    state,
    canvasRef,
    getWaveform,
    startPlaying,
    startCamera,
    stopCamera,
    toggleReference,
    setPreset,
    adjustTranspose,
    startRecording,
    stopRecording,
    discardRecording,
    downloadRecording,
  };
}
