import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import './StepNavigation.css';

export default function StepNavigation({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onSaveDraft,
  saving = false
}) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="step-navigation">
      <button
        className="btn btn-secondary"
        onClick={onSaveDraft}
        disabled={saving}
      >
        <Save size={20} />
        {saving ? 'Saving...' : 'Save Draft'}
      </button>

      <div className="nav-buttons">
        <button
          className="btn btn-secondary"
          onClick={onPrevious}
          disabled={isFirstStep}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          {isLastStep ? 'Review' : 'Next'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
