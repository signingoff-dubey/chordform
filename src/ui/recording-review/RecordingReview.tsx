import { useRef, useEffect } from 'react';
import './recording-review.css';

interface RecordingReviewProps {
  url: string;
  onDownload: () => void;
  onDiscard: () => void;
}

export function RecordingReview({ url, onDownload, onDiscard }: RecordingReviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const discardBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (videoRef.current && url) {
      videoRef.current.src = url;
    }
  }, [url]);

  useEffect(() => {
    discardBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDiscard();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDiscard]);

  return (
    <div className="review-overlay">
      <div className="review-panel" role="dialog" aria-modal="true" aria-labelledby="review-panel-title">
        <h2 className="review-panel__title" id="review-panel-title">Recording</h2>

        <video
          ref={videoRef}
          className="review-panel__video"
          controls
          playsInline
        />

        <div className="review-panel__actions">
          <button ref={discardBtnRef} className="review-panel__btn review-panel__btn--discard" onClick={onDiscard}>
            Discard
          </button>
          <button className="review-panel__btn review-panel__btn--download" onClick={onDownload}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
