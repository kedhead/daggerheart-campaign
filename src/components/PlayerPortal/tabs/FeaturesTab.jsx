export default function FeaturesTab({ character }) {
  const groups = [
    { source: 'Class',                items: character.classFeatures || [] },
    { source: 'Subclass',             items: character.subclassFeatures || [] },
    { source: 'Ancestry & Community', items: character.heritage || [] },
  ].filter(g => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: 13 }}>
        No features recorded.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map((group, gi) => (
        <div key={gi}>
          <div className="lrp-section-label">{group.source}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.items.map((f, i) => (
              <div key={i} className="lrp-card">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#eab308' }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 6, lineHeight: 1.5 }}>
                  {f.desc || f.text || ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
