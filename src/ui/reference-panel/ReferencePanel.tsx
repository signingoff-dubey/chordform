import { useEffect, useRef } from 'react';
import { LEFT_ROOT_TABLE_ENTRIES, RIGHT_QUALITY_TABLE_ENTRIES } from '../../gesture-encoding';
import './reference-panel.css';

interface ReferencePanelProps {
  onClose: () => void;
}

const FINGER_LABELS = ['T', 'I', 'M', 'R', 'P'];

export function ReferencePanel({ onClose }: ReferencePanelProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="ref-panel-overlay" onClick={onClose}>
      <div
        className="ref-panel"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ref-panel-title"
      >
        <div className="ref-panel__header">
          <h2 className="ref-panel__title" id="ref-panel-title">Chord Reference</h2>
          <button ref={closeBtnRef} className="ref-panel__close" onClick={onClose} aria-label="Close reference">×</button>
        </div>

        <div className="ref-panel__section">
          <h3 className="ref-panel__section-title">Left Hand — Root Notes</h3>
          <p className="ref-panel__note">● = extended, ○ = curled</p>
          <table className="ref-panel__table">
            <thead>
              <tr>
                <th>Note</th>
                {FINGER_LABELS.map((f, i) => (
                  <th key={i} className="ref-panel__finger-h">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEFT_ROOT_TABLE_ENTRIES.map(({ note, fingers }) => (
                <tr key={note}>
                  <td className="ref-panel__result">{note}</td>
                  {fingers.map((ext, i) => (
                    <td key={i} className={`ref-panel__finger ${ext ? 'ref-panel__finger--up' : 'ref-panel__finger--down'}`}>
                      {ext ? '●' : '○'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ref-panel__section">
          <h3 className="ref-panel__section-title">Right Hand — Chord Quality</h3>
          <p className="ref-panel__note">● = extended, ○ = curled</p>
          <table className="ref-panel__table">
            <thead>
              <tr>
                <th>Quality</th>
                {FINGER_LABELS.map((f, i) => (
                  <th key={i} className="ref-panel__finger-h">{f}</th>
                ))}
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {RIGHT_QUALITY_TABLE_ENTRIES.map(({ quality, fingers }) => (
                <tr key={quality.name}>
                  <td className="ref-panel__result">{quality.name}</td>
                  {fingers.map((ext, i) => (
                    <td key={i} className={`ref-panel__finger ${ext ? 'ref-panel__finger--up' : 'ref-panel__finger--down'}`}>
                      {ext ? '●' : '○'}
                    </td>
                  ))}
                  <td className="ref-panel__intervals">{quality.intervals.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
