import { useEffect, useRef, useCallback } from 'react';
import { HUD } from '../hud/HUD';
import { ReferencePanel } from '../reference-panel/ReferencePanel';
import { RecordingReview } from '../recording-review/RecordingReview';
import type { ChordDisplay, RecordingState } from '../../hooks/useAppState';
import type { SynthPreset } from '../../audio-engine';
import './play-screen.css';

interface PlayScreenProps {
  chord: ChordDisplay;
  preset: SynthPreset;
  recording: RecordingState;
  showReference: boolean;
  oneHandVisible: boolean;
  cameraStream: MediaStream | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStartCamera: (videoEl: HTMLVideoElement, overlayCanvas: HTMLCanvasElement) => void;
  onExit: () => void;
  onToggleReference: () => void;
  onSetPreset: (preset: SynthPreset) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDiscardRecording: () => void;
  onDownloadRecording: () => void;
}

export function PlayScreen({
  chord,
  preset,
  recording,
  showReference,
  oneHandVisible,
  cameraStream,
  canvasRef,
  onStartCamera,
  onExit,
  onToggleReference,
  onSetPreset,
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

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 300);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [canvasRef]);

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

      <HUD
        chord={chord}
        preset={preset}
        isRecording={recording.isRecording}
        oneHandVisible={oneHandVisible}
        onExit={onExit}
        onToggleReference={onToggleReference}
        onSetPreset={onSetPreset}
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
