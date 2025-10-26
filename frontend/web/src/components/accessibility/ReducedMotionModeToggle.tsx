import { useId } from 'react';
import { useReducedMotionMode } from '@/accessibility/ReducedMotionModeContext';

type ReducedMotionModeToggleProps = {
  className?: string;
};

export default function ReducedMotionModeToggle({ className }: ReducedMotionModeToggleProps) {
  const hintId = useId();
  const { reducedMotion, toggleReducedMotion } = useReducedMotionMode();

  return (
    <div className={['accessibility-toggle', 'reduced-motion-toggle', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accessibility-toggle-button reduced-motion-toggle-button"
        aria-pressed={reducedMotion}
        aria-describedby={hintId}
        onClick={toggleReducedMotion}
      >
        <span className="accessibility-toggle-icon reduced-motion-toggle-icon" aria-hidden>◼︎</span>
        <span className="accessibility-toggle-text reduced-motion-toggle-text">
          <strong>{reducedMotion ? 'Reduced motion on' : 'Reduce motion and effects'}</strong>
          <small>{reducedMotion ? 'Animations minimised' : 'Minimise animation, parallax, and auto-scroll'}</small>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Limits transitions, animations, and auto-scrolling to support users sensitive to motion or vestibular disorders.
      </span>
    </div>
  );
}
