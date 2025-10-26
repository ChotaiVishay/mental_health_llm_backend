import { useId } from 'react';
import { useLargeTextMode } from '@/accessibility/LargeTextModeContext';

type LargeTextModeToggleProps = {
  className?: string;
};

export default function LargeTextModeToggle({ className }: LargeTextModeToggleProps) {
  const hintId = useId();
  const { largeText, toggleLargeText } = useLargeTextMode();

  return (
    <div className={['accessibility-toggle', 'large-text-toggle', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accessibility-toggle-button large-text-toggle-button"
        aria-pressed={largeText}
        aria-describedby={hintId}
        onClick={toggleLargeText}
      >
        <span className="accessibility-toggle-icon large-text-toggle-icon" aria-hidden>Aa</span>
        <span className="accessibility-toggle-text large-text-toggle-text">
          <strong>{largeText ? 'Large text mode on' : 'Enable large text mode'}</strong>
          <small>{largeText ? 'Extra-large typography in use' : 'Increase type size and spacing for readability'}</small>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Enlarges typography, line spacing, and interactive targets across the app for low-vision users.
      </span>
    </div>
  );
}
