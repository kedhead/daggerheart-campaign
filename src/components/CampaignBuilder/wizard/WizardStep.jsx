import './WizardStep.css';

export default function WizardStep({ title, description, children }) {
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>{title}</h2>
        {description && <p className="step-description">{description}</p>}
      </div>
      <div className="step-content">
        {children}
      </div>
    </div>
  );
}
