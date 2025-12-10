import { Check } from 'lucide-react';
import './WizardProgress.css';

const STEP_NAMES = [
  'Pitch',
  'Tone & Feel',
  'Themes',
  'Touchstones',
  'Overview',
  'Communities',
  'Ancestries',
  'Classes',
  'Player Principles',
  'GM Principles',
  'Distinctions',
  'Inciting Incident',
  'Campaign Mechanics',
  'Session Zero'
];

export default function WizardProgress({ currentStep, completedSteps, onStepClick }) {
  return (
    <div className="wizard-progress">
      <div className="progress-steps">
        {STEP_NAMES.map((name, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isClickable = index <= currentStep || isCompleted;

          return (
            <button
              key={index}
              className={`progress-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              title={name}
            >
              <div className="step-number">
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <div className="step-name">{name}</div>
            </button>
          );
        })}
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / STEP_NAMES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
