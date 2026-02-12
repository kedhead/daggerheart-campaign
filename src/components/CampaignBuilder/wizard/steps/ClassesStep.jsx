import { useEffect } from 'react';
import WizardStep from '../WizardStep';
import { CLASSES } from '../../../../data/systems/daggerheart';
import { Check } from 'lucide-react';

export default function ClassesStep({ value, onChange }) {
  // Initialize with all classes selected if value is empty/string
  useEffect(() => {
    if (!value || typeof value === 'string') {
      onChange(Object.keys(CLASSES));
    }
  }, []);

  const selectedClasses = Array.isArray(value) ? value : [];

  const toggleClass = (name) => {
    if (selectedClasses.includes(name)) {
      onChange(selectedClasses.filter(c => c !== name));
    } else {
      onChange([...selectedClasses, name]);
    }
  };

  const toggleAll = () => {
    if (selectedClasses.length === Object.keys(CLASSES).length) {
      onChange([]);
    } else {
      onChange(Object.keys(CLASSES));
    }
  };

  return (
    <WizardStep
      title="Classes"
      description="Select the classes available in your campaign world."
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <label className="text-sm font-bold text-white/80 uppercase tracking-wider">Available Classes</label>
          <button
            onClick={toggleAll}
            className="text-xs text-[rgb(var(--color-primary))] hover:underline"
          >
            {selectedClasses.length === Object.keys(CLASSES).length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(CLASSES).map(([name, data]) => {
            const isSelected = selectedClasses.includes(name);
            return (
              <div
                key={name}
                onClick={() => toggleClass(name)}
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
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{data.description}</p>
                    {data.domains && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {data.domains.slice(0, 2).map(d => (
                          <span key={d} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/60">{d}</span>
                        ))}
                        {data.domains.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/60">+{data.domains.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-200/80">
          <p>Selected classes will determine available options for players during character creation.</p>
        </div>
      </div>
    </WizardStep>
  );
}
