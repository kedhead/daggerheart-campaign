import { useEffect } from 'react';
import WizardStep from '../WizardStep';
import { ANCESTRIES } from '../../../../data/systems/daggerheart';
import { Check } from 'lucide-react';

export default function AncestriesStep({ value, onChange }) {
  // Initialize with all ancestries selected if value is empty/string
  useEffect(() => {
    if (!value || typeof value === 'string') {
      onChange(Object.keys(ANCESTRIES));
    }
  }, []);

  const selectedAncestries = Array.isArray(value) ? value : [];

  const toggleAncestry = (name) => {
    if (selectedAncestries.includes(name)) {
      onChange(selectedAncestries.filter(a => a !== name));
    } else {
      onChange([...selectedAncestries, name]);
    }
  };

  const toggleAll = () => {
    if (selectedAncestries.length === Object.keys(ANCESTRIES).length) {
      onChange([]);
    } else {
      onChange(Object.keys(ANCESTRIES));
    }
  };

  return (
    <WizardStep
      title="Ancestries"
      description="Select the ancestries available in your campaign world."
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <label className="text-sm font-bold text-white/80 uppercase tracking-wider">Available Ancestries</label>
          <button
            onClick={toggleAll}
            className="text-xs text-[rgb(var(--color-primary))] hover:underline"
          >
            {selectedAncestries.length === Object.keys(ANCESTRIES).length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ANCESTRIES).map(([name, data]) => {
            const isSelected = selectedAncestries.includes(name);
            const description = typeof data === 'string' ? data : data.description;
            return (
              <div
                key={name}
                onClick={() => toggleAncestry(name)}
                className={`
                  cursor-pointer p-3 rounded-lg border transition-all duration-200 relative overflow-hidden group
                  ${isSelected
                    ? 'bg-[rgb(var(--color-primary))]/10 border-[rgb(var(--color-primary))]/50'
                    : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5
                    ${isSelected
                      ? 'bg-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))] text-white'
                      : 'border-white/20 group-hover:border-white/40'}
                  `}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/80'}`}>{name}</h4>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-200/80">
          <p>Selected ancestries will be used to generate diverse NPCs appropriate for your setting.</p>
        </div>
      </div>
    </WizardStep>
  );
}
