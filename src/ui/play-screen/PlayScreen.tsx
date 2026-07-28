import { useEffect, useRef, useCallback } from 'react';
import { HUD } from '../hud/HUD';
import { ReferencePanel } from '../reference-panel/ReferencePanel';
import { RecordingReview } from '../recording-review/RecordingReview';
import { Visualizer } from '../visualizer/Visualizer';
import type { ChordDisplay, RecordingState } from '../../hooks/useAppState';
import type { SynthPreset } from '../../audio-engine';
import './play-screen.css';

interface PlayScreenProps {
  chord: ChordDisplay;
  preset: SynthPreset;
  transpose: number;
  recording: RecordingState;
  showReference: boolean;
  oneHandVisible: boolean;
  cameraStream: MediaStream | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  getWaveform: () => Float32Array | null;
  onStartCamera: (videoEl: HTMLVideoElement, overlayCanvas: HTMLCanvasElement) => void;
  onExit: () => void;
  onToggleReference: () => void;
  onSelectInstrument: (preset: SynthPreset) => void;
  onAdjustTranspose: (delta: number) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDiscardRecording: () => void;
  onDownloadRecording: () => void;
}

const KEY_HANDLED = new Set(['Escape', ' ', 'r', 'R', 'ArrowUp', 'ArrowDown']);

export function PlayScreen({
  chord,
  preset,
  transpose,
  recording,
  showReference,
  oneHandVisible,
  cameraStream,
  canvasRef,
  getWaveform,
  onStartCamera,
  onExit,
  onToggleReference,
  onSelectInstrument,
  onAdjustTranspose,
  onStartRecording,
  onStopRecording,
  onDiscardRecording,
  onDownloadRecording,
}: PlayScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);

  const startCamera = useCallback(() => {
    if (videoRef.current && canvasRef.current && cameraStream && !startedRef.current) {
      startedRef.current = true;
      onStartCamera(videoRef.current, canvasRef.current);
    }
  }, [cameraStream, canvasRef, onStartCamera]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && videoRef.current) {
        const parent = videoRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
        }
      }
    };

    let orientationTimeout: number | undefined;
    const handleOrientationChange = () => {
      orientationTimeout = window.setTimeout(handleResize, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.clearTimeout(orientationTimeout);
    };
  }, [canvasRef]);

  useEffect(() => {
    // Reference panel / recording review each own Escape while open — don't
    // double-handle shortcuts underneath a modal.
    if (showReference || recording.url) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!KEY_HANDLED.has(e.key)) return;
      e.preventDefault();

      switch (e.key) {
        case 'Escape':
          onExit();
          break;
        case ' ':
          if (recording.isRecording) onStopRecording();
          else onStartRecording();
          break;
        case 'r':
        case 'R':
          onToggleReference();
          break;
        case 'ArrowUp':
          onAdjustTranspose(1);
          break;
        case 'ArrowDown':
          onAdjustTranspose(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReference, recording.url, recording.isRecording, onExit, onToggleReference, onStartRecording, onStopRecording, onAdjustTranspose]);

  return (
    <div className="play-screen">
      <video
        ref={videoRef}
        className="play-screen__video"
        playsInline
        muted
      />

      <canvas
        ref={canvasRef}
        className="play-screen__canvas"
      />

      <Visualizer getWaveform={getWaveform} isSounding={chord.isSounding} />

      <HUD
        chord={chord}
        preset={preset}
        transpose={transpose}
        isRecording={recording.isRecording}
        oneHandVisible={oneHandVisible}
        onExit={onExit}
        onToggleReference={onToggleReference}
        onSelectInstrument={onSelectInstrument}
        onAdjustTranspose={onAdjustTranspose}
        onRecord={onStartRecording}
        onStopRecording={onStopRecording}
      />

      <div className="play-screen__disclaimer" aria-hidden="true">
        Camera & microphone never leave this device
      </div>

      {showReference && (
        <ReferencePanel onClose={onToggleReference} />
      )}

      {recording.url && (
        <RecordingReview
          url={recording.url}
          onDownload={onDownloadRecording}
          onDiscard={onDiscardRecording}
        />
      )}
    </div>
  );
}
