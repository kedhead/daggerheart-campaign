import { useEffect, useState } from 'react';
import {
  doc, onSnapshot, collection, query, orderBy
} from 'firebase/firestore';
import { BookMarked } from 'lucide-react';
import { db } from '../../config/firebase';
import ChapterReader from './ChapterReader';
import './Storybook.css';

/* PublicChronicleView — read-only, unauthenticated chronicle page reachable
   at /?chronicle={campaignId}.

   Permission to read everything below is gated by the campaign doc's
   `chroniclePublic` flag (see firestore.rules and storage.rules). Journal
   entries are deliberately not loaded — they remain private even when the
   chronicle is public. */
export default function PublicChronicleView({ campaignId }) {
  const [campaign, setCampaign] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!campaignId) {
      setError('No chronicle specified.');
      setLoading(false);
      return;
    }

    let chaptersUnsub = () => {};

    const campaignUnsub = onSnapshot(
      doc(db, 'campaigns', campaignId),
      (snap) => {
        if (!snap.exists()) {
          setError('This chronicle could not be found.');
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        if (!data.chroniclePublic) {
          setError('This chronicle is no longer public.');
          setLoading(false);
          return;
        }
        setCampaign(data);
        setError(null);
      },
      (err) => {
        console.error('[PublicChronicle] campaign read error:', err);
        setError('You do not have access to this chronicle.');
        setLoading(false);
      }
    );

    chaptersUnsub = onSnapshot(
      query(
        collection(db, `campaigns/${campaignId}/storybook`),
        orderBy('chapterNumber', 'asc')
      ),
      (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Public visitors only see published chapters
        setChapters(all.filter(c => c.status === 'published'));
        setLoading(false);
      },
      (err) => {
        console.error('[PublicChronicle] chapters read error:', err);
        setLoading(false);
      }
    );

    return () => { campaignUnsub(); chaptersUnsub(); };
  }, [campaignId]);

  if (loading) {
    return (
      <div className="sb-desk" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <div style={{ color:'rgba(233,212,170,0.55)', fontFamily:"'Cinzel', serif", letterSpacing:'0.3em', textTransform:'uppercase', fontSize:'0.78rem' }}>
          Opening the chronicle…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sb-desk" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'2rem' }}>
        <div className="sb-page" style={{ maxWidth: 560, textAlign:'center' }}>
          <BookMarked size={40} style={{ color:'var(--sb-gilt-deep)', margin:'0 auto 1rem', display:'block' }} />
          <span className="sb-eyebrow">A Closed Volume</span>
          <h1 className="sb-title" style={{ fontSize:'clamp(1.4rem, 3vw, 2rem)' }}>{error}</h1>
          <div className="sb-fleuron" aria-hidden="true" />
          <p style={{ fontStyle:'italic', color:'var(--sb-ink-soft)' }}>
            Ask the campaign's keeper for a current share link.
          </p>
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="sb-desk" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'2rem' }}>
        <div className="sb-page" style={{ maxWidth: 560, textAlign:'center' }}>
          <BookMarked size={40} style={{ color:'var(--sb-gilt-deep)', margin:'0 auto 1rem', display:'block' }} />
          <span className="sb-eyebrow">The Chronicle Of</span>
          <h1 className="sb-title">{campaign?.name || 'this campaign'}</h1>
          <div className="sb-fleuron" aria-hidden="true" />
          <p style={{ fontStyle:'italic', color:'var(--sb-ink-soft)' }}>
            No chapters have been published yet. Check back after the next session.
          </p>
        </div>
      </div>
    );
  }

  // Stub storybook ops (mutations should never fire in public view; the
  // journal section is hidden, scenes are read-only).
  const noop = () => {};
  const stubStorybook = {
    addJournalEntry: noop,
    deleteJournalEntry: noop,
    publishChapter: noop,
    deleteChapter: noop,
    updateChapter: noop
  };

  return (
    <ChapterReader
      chapters={chapters}
      campaign={campaign}
      campaignId={campaignId}
      characters={[]}
      isDM={false}
      currentUserId={null}
      storybook={stubStorybook}
      onEditChapter={noop}
      hideJournal
    />
  );
}
