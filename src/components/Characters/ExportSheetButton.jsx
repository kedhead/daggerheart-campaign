import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { downloadBlob, slugify } from '../../utils/downloadBlob';

/**
 * Export a character onto the official Daggerheart character sheet as a PDF.
 *
 * The renderer and pdf-lib are loaded on click, not on mount — together they're
 * around a megabyte, and most sheet views never export.
 */
export default function ExportSheetButton({ character, items, isDM = false, className = '' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { exportCharacterSheetPdf } = await import('../../utils/exportCharacterSheetPdf');
      const blob = await exportCharacterSheetPdf(character, {
        items,
        // GM notes are private; only a DM's export may carry them.
        includeDmNotes: isDM,
      });
      downloadBlob(blob, `${slugify(character?.name, 'character')}-daggerheart-sheet.pdf`);
    } catch (err) {
      console.error('Character sheet export failed:', err);
      setError(
        err?.code === 'TEMPLATE_MISSING'
          ? 'Sheet template unavailable.'
          : 'Export failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className={`dh-btn dh-btn-export ${className}`}
        onClick={handleExport}
        disabled={busy}
        title="Download this character on the official Daggerheart character sheet"
      >
        {busy ? <Loader2 size={14} className="dh-spin" /> : <FileDown size={14} />}
        {busy ? 'Exporting…' : 'Export PDF'}
      </button>
      {error && <div className="dh-export-error">{error}</div>}
    </>
  );
}
