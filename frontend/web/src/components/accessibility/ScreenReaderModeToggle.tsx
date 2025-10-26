import { useId } from 'react';
import { useScreenReaderMode } from '@/accessibility/ScreenReaderModeContext';

type ScreenReaderModeToggleProps = {
  className?: string;
};

export default function ScreenReaderModeToggle({ className }: ScreenReaderModeToggleProps) {
  const hintId = useId();
  const { screenReaderAssist, toggleScreenReaderAssist } = useScreenReaderMode();

  return (
    <div className={['accessibility-toggle', 'screen-reader-toggle', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accessibility-toggle-button screen-reader-toggle-button"
        aria-pressed={screenReaderAssist}
        aria-describedby={hintId}
        onClick={toggleScreenReaderAssist}
      >
        <span className="accessibility-toggle-icon screen-reader-toggle-icon" aria-hidden>🔊</span>
        <span className="accessibility-toggle-text screen-reader-toggle-text">
          <strong>{screenReaderAssist ? 'Screen reader assist on' : 'Enable screen reader assist'}</strong>
          <small>{screenReaderAssist ? 'Extra cues and skip links active' : 'Expose landmarks, labels, and skip links'}</small>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Adds persistent skip links, louder focus outlines, and supplementary labels to support screen reader users.
      </span>
    </div>
  );
}
