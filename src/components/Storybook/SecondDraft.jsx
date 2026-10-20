import { useEffect, useRef, useState } from 'react';
import { X, Wand2, Check as CheckIcon, AlertTriangle, RotateCcw, Trash2, ChevronRight } from 'lucide-react';
import { writeSecondDraft } from '../../services/bookDraftGenerator';
import { draftStatus, proseFingerprint } from '../../utils/bookLayout';
import { DIALOGUE_OPTIONS } from '../../services/storybookGenerator';

/* ─────────────────────────────────────────────────────────────────────────────
   Second Draft — the Book Press section that rewrites chapters for the book
   with the whole story in view, and the side-by-side review that decides
   which rewrites the book uses.
   ──────────────────────────────────────────────────────────────────────────── */

const STATUS_LABEL = {
  none: 'Not written',
  review: 'To review',
  accepted: 'Accepted',
  stale: 'Chronicle changed'
};

export default function SecondDraftSection({ bound, characters, npcs, sessions = [], settings, set, updateChapter, apiKey, gameSystem }) {
  const [run, setRun] = useState(null);        // { done, total, current } while drafting
  const [errors, setErrors] = useState({});    // chapterId -> message
  const [reviewId, setReviewId] = useState(null);
  const stopRef = useRef(false);

  const statuses = bound.map(c => draftStatus(c));
  const count = (s) => statuses.filter(x => x === s).length;
  const todo = bound.map((c, i) => ({ c, i })).filter(({ c }) => ['none', 'stale'].includes(draftStatus(c)));

  const draftOne = async (index) => {
    const chapter = bound[index];
    try {
      const bookDraft = await writeSecondDraft({ bound, index, characters, npcs, sessions, threads: settings.threads || '', dialogue: settings.dialogue, gameSystem, apiKey });
      await updateChapter(chapter.id, { bookDraft });
      setErrors(prev => { const next = { ...prev }; delete next[chapter.id]; return next; });
      return true;
    } catch (err) {
      setErrors(prev => ({ ...prev, [chapter.id]: err.message }));
      return false;
    }
  };

  // One chapter at a time: each takes the better part of a minute, and the
  // drafts are saved as they land, so stopping part-way keeps what's done.
  const draftAll = async () => {
    stopRef.current = false;
    const queue = todo;
    for (let n = 0; n < queue.length; n++) {
      if (stopRef.current) break;
      setRun({ done: n, total: queue.length, current: queue[n].c.id });
      await draftOne(queue[n].i);
    }
    setRun(null);
  };

  const draftSingle = async (index) => {
    setRun({ done: 0, total: 1, current: bound[index].id });
    await draftOne(index);
    setRun(null);
  };

  const reviewIndex = bound.findIndex(c => c.id === reviewId);

  return (
    <>
    <section className="bp-group">
      <h3>Second Draft</h3>
      <p className="bp-muted">
        The editor rewrites each chapter knowing how the whole story goes: it plants foreshadowing, keeps everyone in
        their Story Voice, turns dice and tokens into story, and ends chapters on a hook. Your Chronicle stays as it was
        played. The book uses a rewrite only after you accept it.
      </p>
      <label>What the story builds to
        <textarea
          rows={3}
          value={settings.threads || ''}
          placeholder="Secrets, reveals and payoffs to hint at, e.g. Mother Quill is the Ember Queen in disguise. Orwyn's lost brother returns at the end."
          onChange={e => set({ threads: e.target.value })}
        />
      </label>
      <label>Dialogue
        <select value={settings.dialogue || 'fleshed'} onChange={e => set({ dialogue: e.target.value })}>
          {DIALOGUE_OPTIONS.map(d => <option key={d.key} value={d.key}>{d.label}: {d.hint}</option>)}
        </select>
      </label>
      <label className="bp-check">
        <input type="checkbox" checked={settings.useSecondDraft !== false} onChange={e => set({ useSecondDraft: e.target.checked })} />
        <span>Use accepted second drafts in the book</span>
      </label>

      <p className="bp-muted">
        {count('accepted')} accepted · {count('review')} to review · {count('none')} not written
        {count('stale') ? ` · ${count('stale')} changed since` : ''}
      </p>

      {run ? (
        <div className="bp-sd-run">
          <span className="bp-sd-spinner" aria-hidden="true" />
          <span>Writing chapter {Math.min(run.done + 1, run.total)} of {run.total}… about a minute each</span>
          {run.total > 1 && (
            <button type="button" className="bp-sd-link" onClick={() => { stopRef.current = true; }}>Stop after this one</button>
          )}
        </div>
      ) : (
        <button type="button" className="bp-print-btn bp-print-btn-alt" onClick={draftAll} disabled={todo.length === 0}>
          <Wand2 size={16} />
          {todo.length ? `Write ${todo.length} second draft${todo.length === 1 ? '' : 's'}` : 'Every chapter has a draft'}
        </button>
      )}

      <div className="bp-sd-list">
        {bound.map((c, i) => {
          const st = statuses[i];
          const busy = run?.current === c.id;
          return (
            <div key={c.id} className="bp-sd-row">
              <div className="bp-sd-row-main">
                <span className="bp-sd-title">{i + 1}. {c.title || 'Untitled'}</span>
                <span className={`bp-sd-chip bp-sd-chip-${st}`}>{busy ? 'Writing…' : STATUS_LABEL[st]}</span>
              </div>
              {errors[c.id] && <div className="bp-warn bp-sd-error">{errors[c.id]}</div>}
              <div className="bp-sd-actions">
                {st !== 'none' && (
                  <button type="button" className="bp-sd-link" onClick={() => setReviewId(c.id)} disabled={busy}>Review</button>
                )}
                {(st === 'none' || st === 'stale' || errors[c.id]) && (
                  <button type="button" className="bp-sd-link" onClick={() => draftSingle(i)} disabled={!!run}>
                    {st === 'none' ? 'Write' : 'Rewrite'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>

    {/* Outside the panel section, so the panel's form styles don't reach it. */}
    {reviewIndex >= 0 && (
        <DraftReview
          chapter={bound[reviewIndex]}
          number={reviewIndex + 1}
          busy={!!run}
          onClose={() => setReviewId(null)}
          onSave={(patch) => updateChapter(bound[reviewIndex].id, { bookDraft: { ...bound[reviewIndex].bookDraft, ...patch } })}
          onDiscard={() => updateChapter(bound[reviewIndex].id, { bookDraft: null }).then(() => setReviewId(null))}
          onRewrite={() => draftSingle(reviewIndex)}
          onNext={() => {
            const next = bound.slice(reviewIndex + 1).find(c => draftStatus(c) === 'review');
            setReviewId(next ? next.id : null);
          }}
          hasNext={bound.slice(reviewIndex + 1).some(c => draftStatus(c) === 'review')}
        />
      )}
    </>
  );
}

function DraftReview({ chapter, number, busy, onClose, onSave, onDiscard, onRewrite, onNext, hasNext }) {
  const draft = chapter.bookDraft || {};
  const [text, setText] = useState(draft.prose || '');
  const [title, setTitle] = useState(draft.title || chapter.title || '');
  const [pane, setPane] = useState('draft'); // phones show one side at a time
  const status = draftStatus(chapter);

  // A rewrite landing while the review is open replaces what's shown.
  useEffect(() => {
    setText(draft.prose || '');
    setTitle(draft.title || chapter.title || '');
  }, [draft.createdAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = () => ({ prose: text, title: title !== chapter.title ? title : '' });
  const original = (chapter.prose || '').split(/\n\n+/).filter(p => p.trim());

  return (
    <div className="bp-sd-review" role="dialog" aria-label={`Second draft of chapter ${number}`}>
      <header className="bp-sd-review-head">
        <div>
          <span className="bp-eyebrow">Second Draft · Chapter {number}</span>
          <input className="bp-sd-review-title" value={title} onChange={e => setTitle(e.target.value)} aria-label="Chapter title" />
        </div>
        <button type="button" className="bp-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </header>

      {(draft.notes?.length > 0 || draft.shrunk || status === 'stale') && (
        <div className="bp-sd-notes">
          {status === 'stale' && (
            <p className="bp-warn bp-note"><AlertTriangle size={14} /><span>The Chronicle text of this chapter was edited after this draft was written. Rewrite it to pick up the changes.</span></p>
          )}
          {draft.shrunk && (
            <p className="bp-warn bp-note"><AlertTriangle size={14} /><span>This draft is much shorter than the original. Check that nothing that happened was dropped.</span></p>
          )}
          {draft.notes?.length > 0 && (
            <>
              <span className="bp-sd-notes-head">Editor’s notes</span>
              <ul>{draft.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </>
          )}
        </div>
      )}

      <div className="bp-sd-tabs">
        <button type="button" className={pane === 'original' ? 'on' : ''} onClick={() => setPane('original')}>Original</button>
        <button type="button" className={pane === 'draft' ? 'on' : ''} onClick={() => setPane('draft')}>Second draft</button>
      </div>

      <div className="bp-sd-compare" data-pane={pane}>
        <div className="bp-sd-col bp-sd-original">
          <div className="bp-sd-col-head">Original · {wordCount(chapter.prose)} words</div>
          <div className="bp-sd-col-body">{original.map((p, i) => <p key={i}>{p}</p>)}</div>
        </div>
        <div className="bp-sd-col bp-sd-draft">
          <div className="bp-sd-col-head">Second draft · {wordCount(text)} words · edit freely</div>
          <textarea className="bp-sd-col-body" value={text} onChange={e => setText(e.target.value)} />
        </div>
      </div>

      <footer className="bp-sd-review-foot">
        <button type="button" className="bp-sd-btn bp-sd-danger" onClick={onDiscard} disabled={busy}><Trash2 size={14} /> Discard</button>
        <button type="button" className="bp-sd-btn" onClick={onRewrite} disabled={busy}><RotateCcw size={14} /> {busy ? 'Writing…' : 'Rewrite'}</button>
        <span className="bp-sd-spacer" />
        <button type="button" className="bp-sd-btn" onClick={() => onSave({ ...patch(), status: draft.status || 'review' })} disabled={busy}>Save edits</button>
        <button
          type="button"
          className="bp-sd-btn bp-sd-accept"
          disabled={busy || !text.trim()}
          onClick={async () => {
            // Accepting is the author's say-so that the draft fits the
            // chronicle as it stands now, so it stops counting as stale.
            await onSave({ ...patch(), status: 'accepted', basedOn: proseFingerprint(chapter.prose) });
            if (hasNext) onNext(); else onClose();
          }}
        >
          <CheckIcon size={14} /> {hasNext ? 'Accept & next' : 'Accept'} {hasNext && <ChevronRight size={14} />}
        </button>
      </footer>
    </div>
  );
}

function wordCount(s) {
  return (String(s || '').trim().match(/\S+/g) || []).length.toLocaleString();
}
