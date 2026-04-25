import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import Modal from '../Modal';
import { STORYBOOK_STYLES, DEFAULT_STYLE_KEY } from '../../services/storybookGenerator';

export default function StorybookSettingsPanel({ isOpen, onClose, campaign, updateCampaign }) {
  const [styleKey, setStyleKey] = useState(campaign?.storybookStyle || DEFAULT_STYLE_KEY);
  const [styleCustom, setStyleCustom] = useState(campaign?.storybookStyleCustom || '');
  const [chroniclePublic, setChroniclePublic] = useState(!!campaign?.chroniclePublic);
  const [linkCopied, setLinkCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const shareLink = typeof window !== 'undefined' && campaign?.id
    ? `${window.location.origin}/?chronicle=${campaign.id}`
    : '';

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback: select-and-copy is the user's job
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCampaign({
        storybookStyle: styleKey,
        storybookStyleCustom: styleKey === 'custom' ? styleCustom : '',
        chroniclePublic
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

        {/* ── Public Chronicle ─────────────────────────────────────────── */}
        <div
          className="space-y-3 p-4 rounded-lg border"
          style={{
            background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
            borderColor: 'var(--line)'
          }}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={chroniclePublic}
              onChange={(e) => setChroniclePublic(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-white">
                Public Chronicle
              </div>
              <p className="text-xs text-white/55 mt-1 leading-relaxed">
                Share a read-only link to the chronicle with anyone — no account required.
                Only published chapters are visible. In-character journal entries stay private to the campaign.
                Anyone with the link will be able to read every published chapter and view its illustrations.
              </p>
            </div>
          </label>

          {chroniclePublic && shareLink && (
            <div className="space-y-2 pt-2" style={{ borderTop: '1px dashed var(--line)' }}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Share link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  onClick={(e) => e.target.select()}
                  className="flex-1 p-2 rounded bg-black/30 border border-white/10 text-white/80 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold text-white"
                  style={{
                    background: linkCopied
                      ? 'rgba(34, 197, 94, 0.25)'
                      : 'color-mix(in srgb, var(--primary) 22%, transparent)',
                    border: linkCopied
                      ? '1px solid rgba(34, 197, 94, 0.4)'
                      : '1px solid color-mix(in srgb, var(--primary) 40%, transparent)'
                  }}
                >
                  {linkCopied ? <><Check size={12} /> Copied</> : <><Link2 size={12} /> Copy</>}
                </button>
              </div>
              {!campaign?.chroniclePublic && (
                <p className="text-[11px] text-amber-300">
                  Save settings to make this link active.
                </p>
              )}
            </div>
          )}
        </div>

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
