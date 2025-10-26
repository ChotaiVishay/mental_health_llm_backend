import { useId } from 'react';
import { useEasyMode } from '@/accessibility/EasyModeContext';

type EasyModeToggleProps = {
  className?: string;
};

export default function EasyModeToggle({ className }: EasyModeToggleProps) {
  const hintId = useId();
  const { easyMode, toggleEasyMode } = useEasyMode();

  return (
    <div className={['accessibility-toggle', 'easy-toggle', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accessibility-toggle-button easy-toggle-button"
        aria-pressed={easyMode}
        aria-describedby={hintId}
        onClick={toggleEasyMode}
      >
        <span className="accessibility-toggle-icon easy-toggle-icon" aria-hidden />
        <span className="accessibility-toggle-text easy-toggle-text">
          <strong>{easyMode ? 'Easy Mode on' : 'Switch to Easy Mode'}</strong>
          <small>{easyMode ? 'Simplified layout applied' : 'Streamline the interface for focus'}</small>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Enables a simplified interface with larger controls, calmer colors, and hides advanced options.
      </span>
    </div>
  );
}
