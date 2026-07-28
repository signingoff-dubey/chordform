import { useEffect, useRef, useState } from 'react';
import type { ChordDisplay } from '../../hooks/useAppState';
import type { SynthPreset } from '../../audio-engine';
import { INSTRUMENTS } from '../../audio-engine';
import './hud.css';

interface HUDProps {
  chord: ChordDisplay;
  preset: SynthPreset;
  transpose: number;
  isRecording: boolean;
  oneHandVisible: boolean;
  onExit: () => void;
  onToggleReference: () => void;
  onSelectInstrument: (preset: SynthPreset) => void;
  onAdjustTranspose: (delta: number) => void;
  onRecord: () => void;
  onStopRecording: () => void;
}

export function HUD({
  chord,
  preset,
  transpose,
  isRecording,
  oneHandVisible,
  onExit,
  onToggleReference,
  onSelectInstrument,
  onAdjustTranspose,
  onRecord,
  onStopRecording,
}: HUDProps) {
  const [showInstrumentMenu, setShowInstrumentMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const instrumentLabel = INSTRUMENTS.find(i => i.id === preset)?.label ?? preset;
  const transposeLabel = transpose > 0 ? `+${transpose}` : `${transpose}`;

  useEffect(() => {
    if (!showInstrumentMenu) return;

    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowInstrumentMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInstrumentMenu(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInstrumentMenu]);

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
          <div className="hud__instrument-wrap" ref={menuRef}>
            <button
              className="hud__btn hud__instrument-btn"
              onClick={() => setShowInstrumentMenu(v => !v)}
              aria-haspopup="true"
              aria-expanded={showInstrumentMenu}
              aria-label={`Instrument: ${instrumentLabel}. Tap to choose.`}
            >
              {instrumentLabel}
            </button>

            {showInstrumentMenu && (
              <div className="hud__instrument-menu" role="menu">
                {INSTRUMENTS.map(instrument => (
                  <button
                    key={instrument.id}
                    role="menuitemradio"
                    aria-checked={instrument.id === preset}
                    className={`hud__instrument-option ${instrument.id === preset ? 'hud__instrument-option--active' : ''}`}
                    onClick={() => {
                      onSelectInstrument(instrument.id);
                      setShowInstrumentMenu(false);
                    }}
                  >
                    {instrument.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hud__transpose" role="group" aria-label="Transpose">
            <button
              className="hud__stepper-btn"
              onClick={() => onAdjustTranspose(-1)}
              aria-label="Transpose down one semitone"
              aria-keyshortcuts="ArrowDown"
              title="Transpose down (↓)"
              disabled={transpose <= -12}
            >
              −
            </button>
            <span className="hud__transpose-value" aria-live="polite">{transposeLabel}</span>
            <button
              className="hud__stepper-btn"
              onClick={() => onAdjustTranspose(1)}
              aria-label="Transpose up one semitone"
              aria-keyshortcuts="ArrowUp"
              title="Transpose up (↑)"
              disabled={transpose >= 12}
            >
              +
            </button>
          </div>

          <button
            className="hud__btn"
            onClick={onToggleReference}
            aria-label="Toggle chord reference"
            aria-keyshortcuts="R"
            title="Chord reference (R)"
          >
            Chords
          </button>

          <button
            className={`hud__record-btn ${isRecording ? 'hud__record-btn--recording' : ''}`}
            onClick={isRecording ? onStopRecording : onRecord}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            aria-keyshortcuts="Space"
            title={isRecording ? 'Stop recording (Space)' : 'Start recording (Space)'}
          >
            {isRecording ? '■' : '●'}
          </button>
        </div>
      </div>
    </div>
  );
}
