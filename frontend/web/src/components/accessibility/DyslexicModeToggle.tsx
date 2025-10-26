import { useId } from 'react';
import { useDyslexicMode } from '@/accessibility/DyslexicModeContext';

type DyslexicModeToggleProps = {
  className?: string;
};

export default function DyslexicModeToggle({ className }: DyslexicModeToggleProps) {
  const hintId = useId();
  const { dyslexicMode, toggleDyslexicMode } = useDyslexicMode();

  return (
    <div className={['accessibility-toggle', 'dyslexic-toggle', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accessibility-toggle-button dyslexic-toggle-button"
        aria-pressed={dyslexicMode}
        aria-describedby={hintId}
        onClick={toggleDyslexicMode}
      >
        <span className="accessibility-toggle-icon dyslexic-toggle-icon" aria-hidden />
        <span className="accessibility-toggle-text dyslexic-toggle-text">
          <strong>{dyslexicMode ? 'Dyslexia-friendly mode on' : 'Enable dyslexia-friendly mode'}</strong>
          <small>{dyslexicMode ? 'Readable fonts and spacing applied' : 'Switch to dyslexia-optimized view'}</small>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Adjusts typography, spacing, and highlighting to improve readability for readers with dyslexia.
      </span>
    </div>
  );
}
