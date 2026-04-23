import { useState } from 'react';
import Modal from '../Modal';
import { STORYBOOK_STYLES, DEFAULT_STYLE_KEY } from '../../services/storybookGenerator';

export default function StorybookSettingsPanel({ isOpen, onClose, campaign, updateCampaign }) {
  const [styleKey, setStyleKey] = useState(campaign?.storybookStyle || DEFAULT_STYLE_KEY);
  const [styleCustom, setStyleCustom] = useState(campaign?.storybookStyleCustom || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCampaign({
        storybookStyle: styleKey,
        storybookStyleCustom: styleKey === 'custom' ? styleCustom : ''
      });
      onClose();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Storybook Style" size="medium">
      <div className="space-y-5">
        <p className="text-sm text-white/60 leading-relaxed">
          Choose the art style for new chapters. Styled character portraits are cached per-style on each entity — changing the style will cause portraits to be regenerated the next time a chapter features them.
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
            Default style
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {STORYBOOK_STYLES.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStyleKey(s.key)}
                className="text-left px-4 py-3 rounded-xl border transition"
                style={{
                  background: styleKey === s.key
                    ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
                    : 'color-mix(in srgb, var(--surface) 70%, transparent)',
                  borderColor: styleKey === s.key
                    ? 'color-mix(in srgb, var(--primary) 50%, transparent)'
                    : 'var(--line)',
                  color: 'var(--text)'
                }}
              >
                <div className="text-sm font-bold">{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {styleKey === 'custom' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
              Custom style preamble
            </label>
            <textarea
              value={styleCustom}
              onChange={(e) => setStyleCustom(e.target.value)}
              rows={3}
              placeholder="e.g. 'Vintage pulp fantasy illustration, gouache, warm sepia tones, no text or labels'"
              className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
            />
            <p className="text-[11px] text-white/40">
              This text is prepended to every image prompt. Be descriptive about medium, palette, and composition.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-white/70 font-semibold hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (styleKey === 'custom' && !styleCustom.trim())}
            className="px-5 py-2.5 rounded-lg text-white font-bold disabled:opacity-40"
            style={{
              background: 'color-mix(in srgb, var(--primary) 25%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 45%, transparent)'
            }}
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
