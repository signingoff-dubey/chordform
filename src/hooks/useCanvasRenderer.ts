import { useRef, useCallback } from 'react';
import type { TrackingResult } from '../hand-tracking';
import { drawHandOverlay, drawVideoFrame, drawChordHUD } from '../hand-tracking/drawing';
import type { ChordDisplay } from './useAppState';

export function useCanvasRenderer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const latestResultRef = useRef<TrackingResult | null>(null);
  const latestChordRef = useRef<ChordDisplay | null>(null);
  const isRecordingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoElRef.current;
    if (video && video.readyState >= 2) {
      drawVideoFrame(ctx, video, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const result = latestResultRef.current;

    drawHandOverlay(
      ctx,
      canvas.width,
      canvas.height,
      result?.left ?? null,
      result?.right ?? null
    );

    // Only burn the chord name into the canvas while actually recording — the
    // live view already shows it via the DOM HUD, so drawing it here too
    // would show it twice on screen. It's only needed on the canvas for the
    // saved recording, which captures this canvas as its video track.
    if (isRecordingRef.current) {
      const chord = latestChordRef.current;
      drawChordHUD(ctx, canvas.width, canvas.height, chord?.chordName ?? null, chord?.isSounding ?? false);
    }

    rafRef.current = requestAnimationFrame(render);
  }, []);

  const startRenderer = useCallback((canvas: HTMLCanvasElement, videoEl: HTMLVideoElement) => {
    canvasRef.current = canvas;
    videoElRef.current = videoEl;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(render);
    }
  }, [render]);

  const stopRenderer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvasRef.current = null;
    videoElRef.current = null;
  }, []);

  const updateTrackingResult = useCallback((result: TrackingResult) => {
    latestResultRef.current = result;
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      if (parent && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }
  }, []);

  const updateChordDisplay = useCallback((chord: ChordDisplay) => {
    latestChordRef.current = chord;
  }, []);

  const setRecording = useCallback((isRecording: boolean) => {
    isRecordingRef.current = isRecording;
  }, []);

  return {
    canvasRef,
    startRenderer,
    stopRenderer,
    updateTrackingResult,
    updateChordDisplay,
    setRecording,
  };
}
