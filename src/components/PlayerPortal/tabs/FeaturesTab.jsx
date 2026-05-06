import { CLASSES, SUBCLASSES, ANCESTRIES, COMMUNITIES } from '../../../data/systems/daggerheart';

function FeatureCard({ tag, name, description, accentColor }) {
  return (
    <div className="lrp-card" style={{ borderColor: accentColor ? `${accentColor}33` : undefined }}>
      {tag && (
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: accentColor || '#eab308', marginBottom: 4 }}>
          {tag}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf6dc', marginBottom: description ? 6 : 0 }}>{name}</div>
      {description && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{description}</div>
      )}
    </div>
  );
}

export default function FeaturesTab({ character }) {
  const charClass     = character.class || '';
  const subclass      = character.subclass || '';
  const ancestry      = character.ancestry || '';
  const community     = character.community || '';
  const subclassLevel = character.subclassLevel || 'foundation';

  const classData     = charClass ? CLASSES[charClass] : null;
  const classFeatures = classData?.classFeatures || [];
  const hopeFeature   = classData?.hopeFeature || null;

  const subclassInfo = charClass && subclass && SUBCLASSES[charClass]
    ? SUBCLASSES[charClass].find(s => s.name === subclass) || null
    : null;

  const mcSubclassInfo = character.multiclass && SUBCLASSES[character.multiclass?.class]
    ? SUBCLASSES[character.multiclass.class].find(s => s.name === character.multiclass.subclass) || null
    : null;

  const ancestryData      = ANCESTRIES[ancestry] || character.customAncestryData || null;
  const ancestryFeatures  = ancestryData?.features || [];
  const communityData     = COMMUNITIES[community] || character.customCommunityData || null;
  const communityFeatures = communityData?.features || [];

  const hasHeritage = ancestryFeatures.length > 0 || communityFeatures.length > 0;
  const hasContent  = classFeatures.length > 0 || hopeFeature || subclassInfo || mcSubclassInfo || hasHeritage;

  if (!hasContent) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: 13 }}>
        No features recorded.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Class features */}
      {(classFeatures.length > 0 || hopeFeature) && (
        <div>
          <div className="lrp-section-label">{charClass} Features</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hopeFeature && (
              <FeatureCard tag="Hope Feature" name={hopeFeature.name} description={hopeFeature.description} accentColor="#eab308" />
            )}
            {classFeatures.map((f, i) => (
              <FeatureCard key={i} name={f.name} description={f.description} />
            ))}
          </div>
        </div>
      )}

      {/* Subclass features */}
      {subclassInfo && (
        <div>
          <div className="lrp-section-label">{subclassInfo.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subclassInfo.foundation && (
              <FeatureCard tag="Foundation" name={subclassInfo.foundation.name} description={subclassInfo.foundation.description} accentColor="#a78bfa" />
            )}
            {(subclassLevel === 'specialization' || subclassLevel === 'mastery') && subclassInfo.specialization && (
              <FeatureCard tag="Specialization" name={subclassInfo.specialization.name} description={subclassInfo.specialization.description} accentColor="#a78bfa" />
            )}
            {subclassLevel === 'mastery' && subclassInfo.mastery && (
              <FeatureCard tag="Mastery" name={subclassInfo.mastery.name} description={subclassInfo.mastery.description} accentColor="#a78bfa" />
            )}
          </div>
        </div>
      )}

      {/* Multiclass foundation */}
      {mcSubclassInfo?.foundation && (
        <div>
          <div className="lrp-section-label">{character.multiclass?.class} — {mcSubclassInfo.name} (Multiclass)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FeatureCard tag="Foundation" name={mcSubclassInfo.foundation.name} description={mcSubclassInfo.foundation.description} accentColor="#a78bfa" />
          </div>
        </div>
      )}

      {/* Heritage features */}
      {hasHeritage && (
        <div>
          <div className="lrp-section-label">Heritage Features</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ancestryFeatures.map((f, i) => (
              <FeatureCard key={`a-${i}`} tag={`Ancestry — ${ancestry}`} name={f.name} description={f.description} accentColor="#60a5fa" />
            ))}
            {communityFeatures.map((f, i) => (
              <FeatureCard key={`c-${i}`} tag={`Community — ${community}`} name={f.name} description={f.description} accentColor="#60a5fa" />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
