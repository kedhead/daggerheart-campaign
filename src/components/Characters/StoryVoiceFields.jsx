/**
 * The story fields every character form shares: how they talk and act, a few
 * lines in their voice, and anything that has changed since their portrait.
 *
 * They feed the AI storyteller (chapters, Second Draft, epilogue) and the
 * story art (see utils/characterState.js), so they belong on every form a
 * player might use — the quick one included — not only the full sheet.
 *
 * @param {object} props
 * @param {object} props.values   - the form data (storyVoice, voiceLines, currentLook)
 * @param {(field: string, value: string) => void} props.onChange
 * @param {string} [props.hintClass] - the form's own hint class (forms use form-hint or input-hint)
 */
export default function StoryVoiceFields({ values, onChange, hintClass = 'form-hint' }) {
  return (
    <>
      <div className="input-group">
        <label>Story Voice &amp; Personality</label>
        <textarea
          value={values.storyVoice || ''}
          onChange={(e) => onChange('storyVoice', e.target.value)}
          rows="3"
          maxLength={600}
          placeholder="How they talk, think and act. e.g. Slow to speak, short blunt sentences, solves problems by hitting them, fiercely loyal, gentle with animals."
        />
        <small className={hintClass}>The AI storyteller follows this so the character stays in character in every chapter</small>
      </div>

      <div className="input-group">
        <label>Sample Lines</label>
        <textarea
          value={values.voiceLines || ''}
          onChange={(e) => onChange('voiceLines', e.target.value)}
          rows="3"
          maxLength={600}
          placeholder={'A few things they would say, one per line, e.g.\n"Hit it?"\n"Too many words."\n"Food first. Then fighting."'}
        />
        <small className={hintClass}>Real lines teach the AI their voice best. It echoes the rhythm, not the exact words every time</small>
      </div>

      <div className="input-group">
        <label>Current Changes (for story art)</label>
        <textarea
          value={values.currentLook || ''}
          onChange={(e) => onChange('currentLook', e.target.value)}
          rows="2"
          maxLength={300}
          placeholder="Anything that's changed since the portrait, e.g. Lost his left eye; hair turned white after the curse"
        />
        <small className={hintClass}>Story illustrations draw this over the portrait. A Transformation (like Ghost) on the sheet is drawn automatically</small>
      </div>
    </>
  );
}
