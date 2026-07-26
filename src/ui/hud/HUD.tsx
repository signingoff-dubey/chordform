import type { ChordDisplay } from '../../hooks/useAppState';
import type { SynthPreset } from '../../audio-engine';
import './hud.css';

interface HUDProps {
  chord: ChordDisplay;
  preset: SynthPreset;
  isRecording: boolean;
  oneHandVisible: boolean;
  onExit: () => void;
  onToggleReference: () => void;
  onSetPreset: (preset: SynthPreset) => void;
  onRecord: () => void;
  onStopRecording: () => void;
}

export function HUD({
  chord,
  preset,
  isRecording,
  oneHandVisible,
  onExit,
  onToggleReference,
  onSetPreset,
  onRecord,
  onStopRecording,
}: HUDProps) {
  return (
    <div className="hud">
      <div className="hud__top">
        <button
          className="hud__exit-btn"
          onClick={onExit}
          aria-label="Stop camera and exit"
        >
          ×
        </button>
        <div className="hud__chord-container">
          {oneHandVisible && (
            <div className="hud__hint">Show your other hand</div>
          )}
          <div
            className={`hud__chord-name ${chord.isSounding ? 'hud__chord-name--active' : ''}`}
            aria-live="polite"
          >
            {chord.chordName ?? '—'}
          </div>
          <div className="hud__chord-detail">
            <span className="hud__root">{chord.root ?? '?'}</span>
            <span className="hud__quality">{chord.quality ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="hud__bottom">
        <div className="hud__controls">
          <button
            className="hud__btn"
            onClick={onToggleReference}
            aria-label="Toggle chord reference"
          >
            Chords
          </button>

          <div className="hud__presets">
            <button
              className={`hud__preset-btn ${preset === 'warm' ? 'hud__preset-btn--active' : ''}`}
              onClick={() => onSetPreset('warm')}
            >
              Warm
            </button>
            <button
              className={`hud__preset-btn ${preset === 'bright' ? 'hud__preset-btn--active' : ''}`}
              onClick={() => onSetPreset('bright')}
            >
              Bright
            </button>
          </div>

          <button
            className={`hud__record-btn ${isRecording ? 'hud__record-btn--recording' : ''}`}
            onClick={isRecording ? onStopRecording : onRecord}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? '■' : '●'}
          </button>
        </div>
      </div>
    </div>
  );
}
