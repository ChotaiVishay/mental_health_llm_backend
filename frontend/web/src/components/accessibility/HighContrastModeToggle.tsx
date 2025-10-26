import { useId } from 'react';
import { useHighContrastMode } from '@/accessibility/HighContrastModeContext';

type HighContrastModeToggleProps = {
  className?: string;
};

export default function HighContrastModeToggle({ className }: HighContrastModeToggleProps) {
  const hintId = useId();
  const { highContrast, toggleHighContrast } = useHighContrastMode();

  return (
    <div className={['accessibility-toggle', 'high-contrast-toggle', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accessibility-toggle-button high-contrast-toggle-button"
        aria-pressed={highContrast}
        aria-describedby={hintId}
        onClick={toggleHighContrast}
      >
        <span className="accessibility-toggle-icon high-contrast-toggle-icon" aria-hidden />
        <span className="accessibility-toggle-text high-contrast-toggle-text">
          <strong>{highContrast ? 'High contrast mode on' : 'Enable high contrast mode'}</strong>
          <small>{highContrast ? 'Bold palette and outlines applied' : 'Boost contrast with color-blind safe hues'}</small>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Applies a high-contrast, color-blind safe palette with stronger outlines and link styles for visibility.
      </span>
    </div>
  );
}
