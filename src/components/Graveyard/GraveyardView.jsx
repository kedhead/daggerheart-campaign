import { useState } from 'react';
import { Skull, RefreshCw, Calendar, Flame } from 'lucide-react';
import Modal from '../Modal';

export default function GraveyardView({ characters, updateCharacter, isDM }) {
  const [resurrectTarget, setResurrectTarget] = useState(null);

  const fallenCharacters = characters.filter(c => c.deceased);

  const handleResurrect = () => {
    updateCharacter(resurrectTarget.id, {
      deceased: false,
      deathDate: null,
      causeOfDeath: null,
      epitaph: null,
    });
    setResurrectTarget(null);
  };

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 lr-fade-in" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div
        className="flex flex-col gap-4 pb-6"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <span
          className="text-[11px] font-bold uppercase block"
          style={{ color: 'var(--fear)', letterSpacing: '0.28em' }}
        >
          The Fallen
        </span>
        <h2
          className="text-3xl md:text-4xl"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}
        >
          The Graveyard
        </h2>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md w-fit"
          style={{ background: 'var(--surface-hi)', border: '1px solid var(--line-strong)' }}
        >
          <Skull size={11} style={{ color: 'var(--text-muted)' }} />
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
          >
            {fallenCharacters.length} {fallenCharacters.length === 1 ? 'Hero' : 'Heroes'} Lost
          </span>
        </div>
      </div>

      {fallenCharacters.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-16 md:p-24 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px dashed var(--line-strong)' }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'var(--surface-hi)', border: '1px solid var(--line-strong)' }}
          >
            <Skull size={40} style={{ color: 'var(--text-dim)' }} />
          </div>
          <h3
            className="text-2xl mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-muted)' }}
          >
            The graveyard stands empty
          </h3>
          <p className="text-sm text-center" style={{ color: 'var(--text-dim)' }}>
            May your party's luck hold. No heroes have fallen yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 pb-20 items-start grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
          {fallenCharacters.map(character => (
            <TombstoneCard
              key={character.id}
              character={character}
              isDM={isDM}
              onResurrect={() => setResurrectTarget(character)}
            />
          ))}
        </div>
      )}

      {resurrectTarget && (
        <Modal
          isOpen
          onClose={() => setResurrectTarget(null)}
          title="Resurrect Hero"
          size="small"
        >
          <div className="space-y-5 p-2">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Bring{' '}
              <strong style={{ color: 'var(--text)' }}>{resurrectTarget.name}</strong>{' '}
              back from the dead? They will be returned to the active roster.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--line)',
                  letterSpacing: '0.14em',
                }}
                onClick={() => setResurrectTarget(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
                style={{
                  background: 'var(--success)',
                  color: '#fff',
                  letterSpacing: '0.14em',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                onClick={handleResurrect}
              >
                Resurrect
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TombstoneCard({ character, isDM, onResurrect }) {
  const deathDateFormatted = character.deathDate
    ? new Date(character.deathDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className="group relative flex flex-col overflow-hidden transition-all duration-700"
      style={{
        borderRadius: '2.5rem',
        background: 'rgba(10, 5, 20, 0.85)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Portrait */}
      <div
        className="relative overflow-hidden border-b"
        style={{
          height: '18rem',
          borderColor: 'rgba(255,255,255,0.04)',
          background: 'linear-gradient(135deg, rgba(20,10,40,0.9), rgba(5,0,15,1))',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[12rem] font-serif font-black text-white/[0.02] select-none italic lowercase transform -rotate-12">
            {character.name.charAt(0)}
          </span>
        </div>
        {character.avatarUrl && (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-contain z-10 transition-all duration-1000 group-hover:brightness-[0.65]"
            style={{ filter: 'grayscale(1) brightness(0.45) sepia(0.25)' }}
          />
        )}
        <div
          className="absolute inset-0 z-20"
          style={{ background: 'linear-gradient(to top, rgba(10,5,20,1) 0%, rgba(10,5,20,0.2) 50%, transparent 100%)' }}
        />

        {/* Fallen badge */}
        <div className="absolute top-6 left-6 z-30">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(120,80,160,0.25)',
              color: 'rgba(150,110,190,0.7)',
            }}
          >
            <Skull size={13} strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Fallen</span>
          </div>
        </div>

        {/* Player attribution */}
        <div className="absolute bottom-6 left-8 z-30">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] block mb-1">
            Played by
          </span>
          <span className="text-sm font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {character.playerName || 'Unknown Player'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-6">
        {/* Name & class */}
        <div>
          <h3
            className="text-4xl font-serif font-black italic lowercase tracking-tighter leading-none"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {character.name}
          </h3>
          {(character.class || character.ancestry) && (
            <p
              className="text-[11px] font-bold uppercase tracking-widest mt-3"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              {character.class}
              {character.ancestry ? ` • ${character.ancestry}` : ''}
            </p>
          )}
        </div>

        {/* Date of death */}
        {deathDateFormatted && (
          <div className="flex items-center gap-2">
            <Calendar size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Fell on {deathDateFormatted}
            </span>
          </div>
        )}

        {/* Cause of death */}
        {character.causeOfDeath && (
          <div
            className="p-4 rounded-2xl space-y-1"
            style={{
              background: 'rgba(80,20,20,0.3)',
              border: '1px solid rgba(150,40,40,0.2)',
            }}
          >
            <span
              className="text-[9px] font-black uppercase tracking-[0.3em] block"
              style={{ color: 'rgba(200,80,80,0.6)' }}
            >
              Cause of Death
            </span>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,190,190,0.5)' }}>
              {character.causeOfDeath}
            </p>
          </div>
        )}

        {/* Epitaph */}
        {character.epitaph && (
          <div
            className="pt-4 border-t text-center"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <Flame size={12} className="mx-auto mb-3" style={{ color: 'rgba(200,150,80,0.4)' }} />
            <p
              className="text-sm italic"
              style={{
                color: 'rgba(255,255,255,0.28)',
                fontFamily: 'var(--font-display)',
                lineHeight: 1.7,
              }}
            >
              &ldquo;{character.epitaph}&rdquo;
            </p>
          </div>
        )}

        {/* Resurrect button - DM only */}
        {isDM && (
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-xs font-black uppercase tracking-[0.2em] transition-all duration-300"
            style={{
              background: 'rgba(52,211,153,0.04)',
              borderColor: 'rgba(52,211,153,0.15)',
              color: 'rgba(52,211,153,0.5)',
              letterSpacing: '0.18em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(52,211,153,0.12)';
              e.currentTarget.style.color = 'rgb(52,211,153)';
              e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(52,211,153,0.04)';
              e.currentTarget.style.color = 'rgba(52,211,153,0.5)';
              e.currentTarget.style.borderColor = 'rgba(52,211,153,0.15)';
            }}
            onClick={onResurrect}
          >
            <RefreshCw size={14} />
            Resurrect
          </button>
        )}
      </div>
    </div>
  );
}
