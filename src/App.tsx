import { useAppState } from './hooks/useAppState';
import { PlayScreen } from './ui/play-screen/PlayScreen';
import './design-tokens/tokens.css';

function App() {
  const {
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
  } = useAppState();

  const { screen, chord, preset, transpose, recording, showReference, oneHandVisible, cameraStream } = state;

  if (screen === 'landing') {
    return (
      <div className="landing">
        <div className="landing__content">
          <h1 className="landing__title">ChordForm</h1>
          <p className="landing__desc">
            Play chords with your hands — no instrument needed.<br />
            Left hand picks the root note, right hand picks the chord quality.
          </p>
          <button className="landing__cta" onClick={startPlaying}>
            Enable Camera
          </button>
          <p className="landing__privacy">
            Your camera and microphone never leave this device.
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'loading') {
    return (
      <div className="landing">
        <div className="landing__content">
          <div className="landing__spinner" aria-hidden="true" />
          <h1 className="landing__title">ChordForm</h1>
          <p className="landing__desc">
            Setting up your camera and hand tracking…
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'permission-denied') {
    return (
      <div className="landing">
        <div className="landing__content">
          <h1 className="landing__title">Camera Access Needed</h1>
          <p className="landing__desc">
            Camera access is turned off. ChordForm needs your camera to detect hand gestures.
          </p>
          <p className="landing__desc" style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--signal-dim)' }}>
            Please enable camera access in your browser settings, then try again.
          </p>
          <button className="landing__cta" onClick={startPlaying}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'camera-unavailable') {
    return (
      <div className="landing">
        <div className="landing__content">
          <h1 className="landing__title">Camera Not Available</h1>
          <p className="landing__desc">
            ChordForm requires a camera to detect hand gestures.
          </p>
          <p className="landing__desc" style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--signal-dim)' }}>
            Make sure a camera is connected and your browser supports camera access.
          </p>
          <button className="landing__cta" onClick={startPlaying}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <PlayScreen
      chord={chord}
      preset={preset}
      transpose={transpose}
      recording={recording}
      showReference={showReference}
      oneHandVisible={oneHandVisible}
      cameraStream={cameraStream}
      canvasRef={canvasRef}
      getWaveform={getWaveform}
      onStartCamera={startCamera}
      onExit={stopCamera}
      onToggleReference={toggleReference}
      onSelectInstrument={setPreset}
      onAdjustTranspose={adjustTranspose}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onDiscardRecording={discardRecording}
      onDownloadRecording={downloadRecording}
    />
  );
}

export default App;
