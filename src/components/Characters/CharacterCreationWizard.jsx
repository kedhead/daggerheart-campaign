import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Wand2, Loader2, Plus, Upload } from 'lucide-react';
import {
    CLASSES, SUBCLASSES, DOMAINS, ANCESTRIES, COMMUNITIES,
    STANDARD_ARRAY, TRAIT_RANGE, getBaseProficiency
} from '../../data/systems/daggerheart';
import { getCardsForCharacter } from '../../data/daggerheartDomainCards';
import { generateCharacterPortrait } from '../../services/portraitGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import './LevelUpWizard.css';

const TRAIT_NAMES = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };

export default function CharacterCreationWizard({ onComplete, onClose, isDM, campaign }) {
    const [step, setStep] = useState(0);

    // ── Step 1: Identity ──
    const [name, setName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [appearanceDescription, setAppearanceDescription] = useState('');
    const [generatingAvatar, setGeneratingAvatar] = useState(false);

    // ── Step 2: Class & Subclass ──
    const [charClass, setCharClass] = useState('');
    const [subclass, setSubclass] = useState('');
    const [customSubclass, setCustomSubclass] = useState(false);
    // Companion (Beastbound)
    const [companionName, setCompanionName] = useState('');
    const [companionType, setCompanionType] = useState('');
    const [companionAttack, setCompanionAttack] = useState('');

    // ── Step 3: Heritage ──
    const [ancestry, setAncestry] = useState('');
    const [customAncestry, setCustomAncestry] = useState(false);
    const [customAncestryName, setCustomAncestryName] = useState('');
    const [customAncestryDesc, setCustomAncestryDesc] = useState('');
    const [customAncestryFeatureName, setCustomAncestryFeatureName] = useState('');
    const [customAncestryFeatureDesc, setCustomAncestryFeatureDesc] = useState('');
    const [community, setCommunity] = useState('');
    const [customCommunity, setCustomCommunity] = useState(false);
    const [customCommunityName, setCustomCommunityName] = useState('');
    const [customCommunityDesc, setCustomCommunityDesc] = useState('');
    const [customCommunityFeatureName, setCustomCommunityFeatureName] = useState('');
    const [customCommunityFeatureDesc, setCustomCommunityFeatureDesc] = useState('');

    // ── Step 4: Traits ──
    const [traits, setTraits] = useState({ ...DEFAULT_TRAITS });

    // ── Step 5: Domains & Cards ──
    const [primaryDomain, setPrimaryDomain] = useState('');
    const [secondaryDomain, setSecondaryDomain] = useState('');
    const [domainCards, setDomainCards] = useState([]);

    // ── Step 6: Equipment & Details ──
    const [gold, setGold] = useState(0);
    const [inventory, setInventory] = useState('');
    const [experiences, setExperiences] = useState([]);
    const [experienceInput, setExperienceInput] = useState('');
    const [backstory, setBackstory] = useState('');
    const [demiplaneLink, setDemiplaneLink] = useState('');

    // API key for avatar generation
    const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
    const openaiKeyInfo = getEffectiveKey('openai');
    const hasOpenAIKey = !!openaiKeyInfo?.key;

    // ── Derived data ──
    const classData = charClass ? CLASSES[charClass] : null;
    const availableDomains = classData ? classData.domains : DOMAINS;
    const subclassOptions = charClass && SUBCLASSES[charClass] ? SUBCLASSES[charClass] : [];
    const selectedSubclassInfo = subclassOptions.find(s => s.name === subclass);
    const isBeastbound = charClass === 'Ranger' && subclass === 'Beastbound';

    const ancestryData = customAncestry ? null : (ancestry ? ANCESTRIES[ancestry] : null);
    const ancestryDesc = customAncestry ? customAncestryDesc : (ancestryData ? (typeof ancestryData === 'string' ? ancestryData : ancestryData.description) : '');
    const ancestryFeatures = customAncestry
        ? (customAncestryFeatureName ? [{ name: customAncestryFeatureName, description: customAncestryFeatureDesc }] : [])
        : (ancestryData && typeof ancestryData === 'object' ? ancestryData.features || [] : []);

    const communityData = customCommunity ? null : (community ? COMMUNITIES[community] : null);
    const communityDesc = customCommunity ? customCommunityDesc : (communityData ? (typeof communityData === 'string' ? communityData : communityData.description) : '');
    const communityFeatures = customCommunity
        ? (customCommunityFeatureName ? [{ name: customCommunityFeatureName, description: customCommunityFeatureDesc }] : [])
        : (communityData && typeof communityData === 'object' ? communityData.features || [] : []);

    const availableDomainCards = useMemo(() =>
        getCardsForCharacter(primaryDomain, secondaryDomain, 1),
        [primaryDomain, secondaryDomain]
    );

    // Some subclasses grant an extra starting domain card at character creation.
    // Wizard - School of Knowledge: "Prepared" foundation feature grants +1 card.
    const maxDomainCards = (charClass === 'Wizard' && subclass === 'School of Knowledge') ? 3 : 2;

    const cardsByDomain = useMemo(() => {
        const grouped = {};
        availableDomainCards.forEach(card => {
            if (!grouped[card.domain]) grouped[card.domain] = [];
            grouped[card.domain].push(card);
        });
        return grouped;
    }, [availableDomainCards]);

    // ── Steps definition ──
    const steps = [
        { id: 'identity', label: 'Identity' },
        { id: 'class', label: 'Class' },
        { id: 'heritage', label: 'Heritage' },
        { id: 'traits', label: 'Traits' },
        { id: 'domains', label: 'Domains' },
        { id: 'details', label: 'Details' },
        { id: 'summary', label: 'Summary' },
    ];

    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;

    // ── Class change handler ──
    const handleClassChange = (newClass) => {
        setCharClass(newClass);
        setSubclass('');
        setCustomSubclass(false);
        if (newClass && CLASSES[newClass]) {
            const cd = CLASSES[newClass];
            setPrimaryDomain(cd.domains[0]);
            setSecondaryDomain(cd.domains[1]);
        } else {
            setPrimaryDomain('');
            setSecondaryDomain('');
        }
    };

    const handleSubclassSelect = (value) => {
        if (value === '__custom__') {
            setCustomSubclass(true);
            setSubclass('');
        } else {
            setCustomSubclass(false);
            setSubclass(value);
        }
    };

    const handleAncestrySelect = (value) => {
        if (value === '__custom__') {
            setCustomAncestry(true);
            setAncestry('');
        } else {
            setCustomAncestry(false);
            setAncestry(value);
        }
    };

    const handleCommunitySelect = (value) => {
        if (value === '__custom__') {
            setCustomCommunity(true);
            setCommunity('');
        } else {
            setCustomCommunity(false);
            setCommunity(value);
        }
    };

    // ── Trait helpers ──
    const handleTraitChange = (trait, value) => {
        setTraits(prev => ({ ...prev, [trait]: value }));
    };

    const traitPool = useMemo(() => {
        const pool = [...STANDARD_ARRAY];
        Object.entries(traits).forEach(([t, v]) => {
            const idx = pool.indexOf(v);
            if (idx !== -1) pool.splice(idx, 1);
        });
        return pool;
    }, [traits]);

    const getTraitOptions = (trait) => {
        const pool = [...STANDARD_ARRAY];
        Object.entries(traits).forEach(([t, v]) => {
            if (t !== trait) {
                const idx = pool.indexOf(v);
                if (idx !== -1) pool.splice(idx, 1);
            }
        });
        const currentVal = traits[trait] ?? 0;
        const uniqueAvailable = [...new Set(pool)].sort((a, b) => a - b);
        if (!uniqueAvailable.includes(currentVal)) {
            uniqueAvailable.push(currentVal);
            uniqueAvailable.sort((a, b) => a - b);
        }
        return uniqueAvailable;
    };

    // ── Domain card toggle ──
    const toggleDomainCard = (cardName) => {
        setDomainCards(prev => {
            if (prev.includes(cardName)) return prev.filter(n => n !== cardName);
            if (prev.length >= maxDomainCards) return prev;
            return [...prev, cardName];
        });
    };

    // ── Experience helpers ──
    const addExperience = () => {
        if (experienceInput.trim()) {
            setExperiences(prev => [...prev, experienceInput.trim()]);
            setExperienceInput('');
        }
    };

    const removeExperience = (index) => {
        setExperiences(prev => prev.filter((_, i) => i !== index));
    };

    // ── Avatar generation ──
    const handleGenerateAvatar = async () => {
        if (!appearanceDescription.trim()) return;
        setGeneratingAvatar(true);
        try {
            const mockCharData = { name, class: charClass, subclass, ancestry, appearanceDescription };
            const imageUrl = await generateCharacterPortrait(
                mockCharData,
                openaiKeyInfo?.key || null,
                campaign?.gameSystem || 'daggerheart',
                campaign?.id
            );
            setAvatarUrl(imageUrl);
        } catch (err) {
            console.error('Avatar generation failed:', err);
            alert('Failed to generate avatar: ' + err.message);
        } finally {
            setGeneratingAvatar(false);
        }
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1 * 1024 * 1024) { alert('Avatar size must be less than 1MB'); return; }
        if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarUrl(ev.target.result);
        reader.onerror = () => alert('Failed to upload avatar');
        reader.readAsDataURL(file);
    };

    // ── Validation ──
    const canProceed = () => {
        if (!currentStep) return false;
        switch (currentStep.id) {
            case 'identity':
                return name.trim().length > 0;
            case 'class':
                return charClass !== '';
            case 'heritage':
                const hasAncestry = customAncestry ? customAncestryName.trim().length > 0 : ancestry !== '';
                const hasCommunity = customCommunity ? customCommunityName.trim().length > 0 : community !== '';
                return hasAncestry && hasCommunity;
            case 'traits':
                return true; // Standard array always valid since defaults are assigned
            case 'domains':
                return primaryDomain !== '' && domainCards.length === maxDomainCards;
            case 'details':
                return true; // All optional
            case 'summary':
                return true;
            default:
                return true;
        }
    };

    // ── Build final character ──
    const buildCharacter = () => {
        const evasion = classData?.baseEvasion || 10;
        const hpCount = classData?.baseHp || 6;

        const character = {
            name: name.trim(),
            playerName: playerName.trim(),
            avatarUrl,
            appearanceDescription,
            class: charClass,
            subclass,
            level: 1,
            proficiency: getBaseProficiency(1),
            ancestry: customAncestry ? customAncestryName.trim() : ancestry,
            community: customCommunity ? customCommunityName.trim() : community,
            ...(customAncestry ? { customAncestryData: { description: customAncestryDesc, features: customAncestryFeatureName ? [{ name: customAncestryFeatureName, description: customAncestryFeatureDesc }] : [] } } : {}),
            ...(customCommunity ? { customCommunityData: { description: customCommunityDesc, features: customCommunityFeatureName ? [{ name: customCommunityFeatureName, description: customCommunityFeatureDesc }] : [] } } : {}),
            traits,
            hpSlots: Array(hpCount).fill(true),
            stressSlots: [false, false, false, false, false, false],
            armorSlots: [false, false, false, false, false, false],
            // Characters start with 2 Hope (SRD)
            hopeSlots: [true, true, false, false, false, false],
            evasion,
            armor: 0,
            primaryDomain,
            secondaryDomain,
            domainNotes: '',
            domainCards,
            inventory,
            gold,
            experiences,
            backstory,
            playerNotes: '',
            dmNotes: '',
            demiplaneLink,
            subclassLevel: 'foundation',
            markedTraits: [],
            levelHistory: [],
        };

        // Beastbound companion
        if (isBeastbound && companionName.trim()) {
            character.companion = {
                name: companionName.trim(),
                type: companionType.trim(),
                attackDescription: companionAttack.trim(),
                stressSlots: [false, false, false, false, false, false],
                evasion: 10,
                damageDie: 'd6',
                range: 'Melee',
                experiences: [],
                upgrades: [],
            };
        }

        return character;
    };

    const handleComplete = () => {
        onComplete(buildCharacter());
        onClose();
    };

    // ═══════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════

    const renderIdentity = () => (
        <div className="luw-step-content">
            <h3 className="luw-step-title">Who is Your Hero?</h3>
            <p className="luw-step-desc">Give your character an identity. The avatar is optional — you can generate one with AI or upload your own.</p>

            <div className="luw-input-group">
                <label className="luw-label">Character Name *</label>
                <input
                    type="text"
                    className="luw-input"
                    placeholder="e.g., Eldrin Shadowstep"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="luw-input-group">
                <label className="luw-label">Player Name</label>
                <input
                    type="text"
                    className="luw-input"
                    placeholder="Your real name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                />
            </div>

            <div className="luw-input-group">
                <label className="luw-label">Appearance Description</label>
                <textarea
                    className="luw-input"
                    rows="3"
                    placeholder="Describe your character's physical appearance..."
                    value={appearanceDescription}
                    onChange={(e) => setAppearanceDescription(e.target.value)}
                    style={{ resize: 'vertical' }}
                />
                <div className="luw-hint">Used for AI avatar generation if available.</div>
            </div>

            {/* Avatar preview & controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '0.5rem' }}>
                {avatarUrl && (
                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                        <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="luw-btn luw-btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                        <Upload size={14} /> Upload Avatar
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </label>
                    <button
                        type="button"
                        className="luw-btn luw-btn-secondary"
                        onClick={handleGenerateAvatar}
                        disabled={generatingAvatar}
                        style={{ fontSize: '0.75rem' }}
                        title="Generate AI Avatar"
                    >
                        {generatingAvatar ? <Loader2 size={14} className="spinner" /> : <Wand2 size={14} />}
                        {generatingAvatar ? 'Generating...' : 'AI Generate'}
                    </button>
                    {avatarUrl && (
                        <button
                            type="button"
                            className="luw-btn luw-btn-secondary"
                            onClick={() => setAvatarUrl('')}
                            style={{ fontSize: '0.75rem' }}
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderClass = () => (
        <div className="luw-step-content">
            <h3 className="luw-step-title">Choose Your Class</h3>
            <p className="luw-step-desc">Your class determines your combat style, domains, and core abilities.</p>

            <div className="luw-options-list">
                {Object.entries(CLASSES).map(([className, data]) => {
                    const isSelected = charClass === className;
                    return (
                        <div key={className} className={`luw-option ${isSelected ? 'selected' : ''}`}>
                            <button
                                className="luw-option-btn"
                                onClick={() => handleClassChange(className)}
                            >
                                <div className="luw-option-header">
                                    <span className="luw-option-label">{className}</span>
                                    <span className="luw-option-meta">
                                        {data.domains.join(' · ')} | HP {data.baseHp} | Evasion {data.baseEvasion}
                                    </span>
                                </div>
                                <div className="luw-option-desc" style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                                    {data.description}
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Subclass picker */}
            {charClass && (
                <div style={{ marginTop: '1rem' }}>
                    <label className="luw-label">Subclass</label>
                    {!customSubclass ? (
                        <select
                            className="luw-select"
                            value={subclass}
                            onChange={(e) => handleSubclassSelect(e.target.value)}
                        >
                            <option value="">-- Select Subclass --</option>
                            {subclassOptions.map(sc => (
                                <option key={sc.name} value={sc.name}>{sc.name}</option>
                            ))}
                            <option value="__custom__">Custom...</option>
                        </select>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="luw-input"
                                value={subclass}
                                onChange={(e) => setSubclass(e.target.value)}
                                placeholder="Enter custom subclass name"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                className="luw-btn luw-btn-secondary"
                                onClick={() => { setCustomSubclass(false); setSubclass(''); }}
                                style={{ padding: '0.3rem 0.6rem' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {selectedSubclassInfo && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <div className="luw-hint" style={{ marginBottom: '0.25rem' }}>{selectedSubclassInfo.description}</div>
                            {selectedSubclassInfo.foundation && (
                                <div className="luw-achievement-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--hope-color, #fbbf24)' }}>{selectedSubclassInfo.foundation.name}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{selectedSubclassInfo.foundation.description}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Class features preview */}
            {classData?.classFeatures && (
                <div style={{ marginTop: '0.75rem' }}>
                    <div className="luw-label" style={{ marginBottom: '0.5rem' }}>Class Features</div>
                    {classData.classFeatures.map((f, i) => (
                        <div key={i} className="luw-achievement-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{f.name}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{f.description}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Companion fields for Beastbound */}
            {isBeastbound && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(200,164,78,0.06)', borderRadius: '8px', border: '1px solid rgba(200,164,78,0.15)' }}>
                    <div className="luw-label" style={{ color: 'var(--hope-color, #fbbf24)', marginBottom: '0.5rem' }}>Companion</div>
                    <div className="luw-input-group">
                        <label className="luw-label">Companion Name</label>
                        <input className="luw-input" type="text" placeholder="e.g., Fang, Shadow..." value={companionName} onChange={(e) => setCompanionName(e.target.value)} />
                    </div>
                    <div className="luw-input-group">
                        <label className="luw-label">Companion Type</label>
                        <input className="luw-input" type="text" placeholder="e.g., Wolf, Hawk..." value={companionType} onChange={(e) => setCompanionType(e.target.value)} />
                    </div>
                    <div className="luw-input-group">
                        <label className="luw-label">Attack Description</label>
                        <input className="luw-input" type="text" placeholder="e.g., Bite, Claw, Peck..." value={companionAttack} onChange={(e) => setCompanionAttack(e.target.value)} />
                    </div>
                </div>
            )}
        </div>
    );

    const renderHeritage = () => (
        <div className="luw-step-content">
            <h3 className="luw-step-title">Choose Your Heritage</h3>
            <p className="luw-step-desc">Your ancestry and community define where you come from and grant unique features.</p>

            <div className="luw-label" style={{ marginBottom: '0.5rem' }}>Ancestry *</div>
            <div className="luw-options-list">
                {Object.entries(ANCESTRIES).map(([ancestryName, data]) => {
                    const isSelected = !customAncestry && ancestry === ancestryName;
                    const desc = typeof data === 'string' ? data : data.description;
                    const features = typeof data === 'object' ? data.features || [] : [];
                    return (
                        <div key={ancestryName} className={`luw-option ${isSelected ? 'selected' : ''}`}>
                            <button
                                type="button"
                                className="luw-option-btn"
                                onClick={() => handleAncestrySelect(ancestryName)}
                            >
                                <div className="luw-option-header">
                                    <span className="luw-option-label">{ancestryName}</span>
                                    {isSelected && <span style={{ color: '#c8a44e', fontSize: '0.7rem' }}>✓ Selected</span>}
                                </div>
                                <div className="luw-option-desc" style={{ fontSize: '0.75rem', color: 'rgba(228,232,240,0.6)', marginTop: '0.15rem' }}>
                                    {desc}
                                </div>
                            </button>
                            {isSelected && features.length > 0 && (
                                <div className="luw-detail-panel">
                                    {features.map((f, i) => (
                                        <div key={i} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 700, color: '#c8a44e', fontSize: '0.8rem' }}>{f.name}: </span>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(228,232,240,0.8)' }}>{f.description}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* Custom ancestry option */}
                <div className={`luw-option ${customAncestry ? 'selected' : ''}`}>
                    <button type="button" className="luw-option-btn" onClick={() => handleAncestrySelect('__custom__')}>
                        <div className="luw-option-header">
                            <span className="luw-option-label">Custom / Homebrew</span>
                            {customAncestry && <span style={{ color: '#c8a44e', fontSize: '0.7rem' }}>✓ Selected</span>}
                        </div>
                        <div className="luw-option-desc" style={{ fontSize: '0.75rem', color: 'rgba(228,232,240,0.6)', marginTop: '0.15rem' }}>
                            Create a custom ancestry with your own name, description, and feature.
                        </div>
                    </button>
                    {customAncestry && (
                        <div className="luw-detail-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input className="luw-input" type="text" placeholder="Ancestry Name *" value={customAncestryName} onChange={(e) => setCustomAncestryName(e.target.value)} />
                            <textarea className="luw-input" placeholder="Description (optional)" rows={2} value={customAncestryDesc} onChange={(e) => setCustomAncestryDesc(e.target.value)} style={{ resize: 'vertical' }} />
                            <div style={{ borderTop: '1px solid rgba(228,232,240,0.15)', paddingTop: '0.4rem', marginTop: '0.1rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(228,232,240,0.5)', marginBottom: '0.3rem' }}>Ancestry Feature (optional)</div>
                                <input className="luw-input" type="text" placeholder="Feature Name" value={customAncestryFeatureName} onChange={(e) => setCustomAncestryFeatureName(e.target.value)} />
                                <textarea className="luw-input" placeholder="Feature Description" rows={2} value={customAncestryFeatureDesc} onChange={(e) => setCustomAncestryFeatureDesc(e.target.value)} style={{ resize: 'vertical', marginTop: '0.35rem' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="luw-label" style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>Community *</div>
            <div className="luw-options-list">
                {Object.entries(COMMUNITIES).map(([commName, data]) => {
                    const isSelected = !customCommunity && community === commName;
                    const desc = typeof data === 'string' ? data : data.description;
                    const features = typeof data === 'object' ? data.features || [] : [];
                    return (
                        <div key={commName} className={`luw-option ${isSelected ? 'selected' : ''}`}>
                            <button
                                type="button"
                                className="luw-option-btn"
                                onClick={() => handleCommunitySelect(commName)}
                            >
                                <div className="luw-option-header">
                                    <span className="luw-option-label">{commName}</span>
                                    {isSelected && <span style={{ color: '#c8a44e', fontSize: '0.7rem' }}>✓ Selected</span>}
                                </div>
                                <div className="luw-option-desc" style={{ fontSize: '0.75rem', color: 'rgba(228,232,240,0.6)', marginTop: '0.15rem' }}>
                                    {desc}
                                </div>
                            </button>
                            {isSelected && features.length > 0 && (
                                <div className="luw-detail-panel">
                                    {features.map((f, i) => (
                                        <div key={i} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 700, color: '#c8a44e', fontSize: '0.8rem' }}>{f.name}: </span>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(228,232,240,0.8)' }}>{f.description}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* Custom community option */}
                <div className={`luw-option ${customCommunity ? 'selected' : ''}`}>
                    <button type="button" className="luw-option-btn" onClick={() => handleCommunitySelect('__custom__')}>
                        <div className="luw-option-header">
                            <span className="luw-option-label">Custom / Homebrew</span>
                            {customCommunity && <span style={{ color: '#c8a44e', fontSize: '0.7rem' }}>✓ Selected</span>}
                        </div>
                        <div className="luw-option-desc" style={{ fontSize: '0.75rem', color: 'rgba(228,232,240,0.6)', marginTop: '0.15rem' }}>
                            Create a custom community with your own name, description, and feature.
                        </div>
                    </button>
                    {customCommunity && (
                        <div className="luw-detail-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input className="luw-input" type="text" placeholder="Community Name *" value={customCommunityName} onChange={(e) => setCustomCommunityName(e.target.value)} />
                            <textarea className="luw-input" placeholder="Description (optional)" rows={2} value={customCommunityDesc} onChange={(e) => setCustomCommunityDesc(e.target.value)} style={{ resize: 'vertical' }} />
                            <div style={{ borderTop: '1px solid rgba(228,232,240,0.15)', paddingTop: '0.4rem', marginTop: '0.1rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(228,232,240,0.5)', marginBottom: '0.3rem' }}>Community Feature (optional)</div>
                                <input className="luw-input" type="text" placeholder="Feature Name" value={customCommunityFeatureName} onChange={(e) => setCustomCommunityFeatureName(e.target.value)} />
                                <textarea className="luw-input" placeholder="Feature Description" rows={2} value={customCommunityFeatureDesc} onChange={(e) => setCustomCommunityFeatureDesc(e.target.value)} style={{ resize: 'vertical', marginTop: '0.35rem' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderTraits = () => (
        <div className="luw-step-content">
            <h3 className="luw-step-title">Assign Your Traits</h3>
            <p className="luw-step-desc">
                Distribute the standard array ({STANDARD_ARRAY.map(v => v >= 0 ? `+${v}` : `${v}`).join(', ')}) across your six traits.
                Each value can only be used the number of times it appears in the array.
            </p>

            <div className="luw-trait-picks luw-two-col">
                {TRAIT_NAMES.map(trait => {
                    const options = getTraitOptions(trait);
                    return (
                        <div key={trait} className="luw-input-group">
                            <label className="luw-label">{trait.charAt(0).toUpperCase() + trait.slice(1)}</label>
                            <select
                                className="luw-select"
                                value={traits[trait] ?? 0}
                                onChange={(e) => handleTraitChange(trait, parseInt(e.target.value))}
                            >
                                {options.map(val => (
                                    <option key={val} value={val}>{val >= 0 ? '+' : ''}{val}</option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>

            {traitPool.length > 0 && (
                <div className="luw-hint" style={{ marginTop: '0.5rem' }}>
                    Remaining: {traitPool.sort((a, b) => a - b).map(v => v >= 0 ? `+${v}` : `${v}`).join(', ')}
                </div>
            )}
        </div>
    );

    const renderDomains = () => (
        <div className="luw-step-content">
            <h3 className="luw-step-title">Domains & Domain Cards</h3>
            <p className="luw-step-desc">
                {charClass
                    ? `As a ${charClass}, your domains are ${availableDomains.join(' & ')}. You can adjust them below.`
                    : 'Choose your primary and secondary domains, then pick your starting domain cards.'}
            </p>

            <div className="luw-two-col">
                <div className="luw-input-group">
                    <label className="luw-label">Primary Domain *</label>
                    <select className="luw-select" value={primaryDomain} onChange={(e) => setPrimaryDomain(e.target.value)}>
                        <option value="">-- Select --</option>
                        {availableDomains.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="luw-input-group">
                    <label className="luw-label">Secondary Domain</label>
                    <select className="luw-select" value={secondaryDomain} onChange={(e) => setSecondaryDomain(e.target.value)}>
                        <option value="">-- Select --</option>
                        {availableDomains.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Domain card picker */}
            {(primaryDomain || secondaryDomain) && (
                <div style={{ marginTop: '1rem' }}>
                    <div className="luw-label" style={{ marginBottom: '0.25rem' }}>
                        Starting Domain Cards
                        <span style={{ marginLeft: '0.5rem', color: domainCards.length === maxDomainCards ? '#4ade80' : '#fbbf24' }}>
                            ({domainCards.length}/{maxDomainCards})
                        </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(228,232,240,0.5)', marginBottom: '0.5rem' }}>
                        Choose exactly {maxDomainCards} level 1 card{maxDomainCards > 1 ? 's' : ''} — from one or both domains.
                        {maxDomainCards === 3 && <span style={{ color: '#c8a44e', marginLeft: '0.3rem' }}>+1 from School of Knowledge (Prepared)</span>}
                    </div>
                    <div className="luw-card-grid">
                        {Object.entries(cardsByDomain).map(([domain, cards]) => (
                            <div key={domain}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--hope-color, #fbbf24)', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
                                    {domain}
                                </div>
                                {cards.map(card => {
                                    const isSelected = domainCards.includes(card.name);
                                    const isDisabled = !isSelected && domainCards.length >= maxDomainCards;
                                    return (
                                        <button
                                            key={card.name}
                                            className={`luw-card-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={() => toggleDomainCard(card.name)}
                                            disabled={isDisabled}
                                            style={isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                        >
                                            <div className="luw-card-header">
                                                <span className="luw-card-name">{card.name}</span>
                                                <span className="luw-card-meta">Lv {card.level} · {card.type}</span>
                                            </div>
                                            <div className="luw-card-desc">{card.description}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                        {availableDomainCards.length === 0 && (
                            <div className="luw-empty">Select domains above to see available cards.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderDetails = () => (
        <div className="luw-step-content">
            <h3 className="luw-step-title">Equipment & Story</h3>
            <p className="luw-step-desc">Fill in your starting equipment, experiences, and backstory. All fields are optional — you can always add more later.</p>

            <div className="luw-info-note" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', padding: '0.5rem 0.75rem', border: '1px dashed rgba(234,179,8,0.2)', borderRadius: '0.4rem', background: 'rgba(234,179,8,0.03)', marginBottom: '0.75rem' }}>
                You'll equip weapons and armor from the campaign catalog after creating the character — open character settings to pick from available items.
            </div>

            <div className="luw-two-col">
                <div className="luw-input-group">
                    <label className="luw-label">Starting Gold</label>
                    <input className="luw-input" type="number" value={gold} onChange={(e) => setGold(parseInt(e.target.value) || 0)} min="0" />
                </div>
            </div>

            <div className="luw-input-group">
                <label className="luw-label">Inventory Notes</label>
                <textarea className="luw-input" rows="2" placeholder="Healing potions, rope, torches, etc." value={inventory} onChange={(e) => setInventory(e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            {/* Experiences */}
            <div className="luw-input-group">
                <label className="luw-label">Experiences</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        className="luw-input"
                        type="text"
                        placeholder="Add an experience..."
                        value={experienceInput}
                        onChange={(e) => setExperienceInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExperience(); } }}
                        style={{ flex: 1 }}
                    />
                    <button type="button" className="luw-btn luw-btn-secondary" onClick={addExperience} style={{ padding: '0.3rem 0.6rem' }}>
                        <Plus size={14} />
                    </button>
                </div>
                {experiences.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                        {experiences.map((exp, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '0.75rem' }}>
                                {exp}
                                <button type="button" onClick={() => removeExperience(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '0' }}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="luw-hint">e.g., Survival, Intimidation, History — each starts at +2 modifier.</div>
            </div>

            <div className="luw-input-group">
                <label className="luw-label">Backstory</label>
                <textarea className="luw-input" rows="3" placeholder="Tell your character's story..." value={backstory} onChange={(e) => setBackstory(e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            <div className="luw-input-group">
                <label className="luw-label">Demiplane Character Sheet Link</label>
                <input className="luw-input" type="url" placeholder="https://app.demiplane.com/nexus/daggerheart/..." value={demiplaneLink} onChange={(e) => setDemiplaneLink(e.target.value)} />
                <div className="luw-hint">Optional: Link to your Demiplane character sheet.</div>
            </div>
        </div>
    );

    const renderSummary = () => {
        const hpCount = classData?.baseHp || 6;
        const evasion = classData?.baseEvasion || 10;

        return (
            <div className="luw-step-content">
                <h3 className="luw-step-title">Review Your Character</h3>
                <p className="luw-step-desc">Review your choices before creating your character.</p>

                <div className="luw-summary">
                    {avatarUrl && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>
                    )}

                    <div className="luw-summary-item">
                        <span className="luw-summary-label">Name</span>
                        <span className="luw-summary-value">{name || '—'}</span>
                    </div>
                    {playerName && (
                        <div className="luw-summary-item">
                            <span className="luw-summary-label">Player</span>
                            <span className="luw-summary-value">{playerName}</span>
                        </div>
                    )}
                    <div className="luw-summary-item">
                        <span className="luw-summary-label">Class</span>
                        <span className="luw-summary-value">{charClass}{subclass ? ` — ${subclass}` : ''}</span>
                    </div>
                    <div className="luw-summary-item">
                        <span className="luw-summary-label">Heritage</span>
                        <span className="luw-summary-value">{ancestry} · {community}</span>
                    </div>
                    <div className="luw-summary-item">
                        <span className="luw-summary-label">Traits</span>
                        <span className="luw-summary-value" style={{ fontSize: '0.75rem' }}>
                            {TRAIT_NAMES.map(t => `${t.slice(0, 3).toUpperCase()} ${traits[t] >= 0 ? '+' : ''}${traits[t]}`).join(' · ')}
                        </span>
                    </div>
                    <div className="luw-summary-item">
                        <span className="luw-summary-label">Vitals</span>
                        <span className="luw-summary-value">HP {hpCount} · Evasion {evasion}</span>
                    </div>
                    <div className="luw-summary-item">
                        <span className="luw-summary-label">Domains</span>
                        <span className="luw-summary-value">{primaryDomain}{secondaryDomain ? ` · ${secondaryDomain}` : ''}</span>
                    </div>
                    {domainCards.length > 0 && (
                        <div className="luw-summary-item">
                            <span className="luw-summary-label">Domain Cards</span>
                            <span className="luw-summary-value" style={{ fontSize: '0.75rem' }}>{domainCards.join(', ')}</span>
                        </div>
                    )}
                    {experiences.length > 0 && (
                        <div className="luw-summary-item">
                            <span className="luw-summary-label">Experiences</span>
                            <span className="luw-summary-value" style={{ fontSize: '0.75rem' }}>{experiences.join(', ')}</span>
                        </div>
                    )}
                    {isBeastbound && companionName && (
                        <div className="luw-summary-item">
                            <span className="luw-summary-label">Companion</span>
                            <span className="luw-summary-value">{companionName} ({companionType})</span>
                        </div>
                    )}
                    {backstory && (
                        <div className="luw-summary-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="luw-summary-label">Backstory</span>
                            <span className="luw-summary-value" style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', marginTop: '0.25rem' }}>{backstory}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCurrentStep = () => {
        if (!currentStep) return null;
        switch (currentStep.id) {
            case 'identity': return renderIdentity();
            case 'class': return renderClass();
            case 'heritage': return renderHeritage();
            case 'traits': return renderTraits();
            case 'domains': return renderDomains();
            case 'details': return renderDetails();
            case 'summary': return renderSummary();
            default: return null;
        }
    };

    // ═══════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════

    return (
        <div className="luw-overlay" onClick={onClose}>
            <div className="luw-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="luw-header">
                    <h2 className="luw-title">Create New Character</h2>
                    <button className="luw-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Progress */}
                <div className="luw-progress">
                    {steps.map((s, i) => (
                        <div
                            key={s.id}
                            className={`luw-progress-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                            onClick={() => i < step && setStep(i)}
                        >
                            <span className="luw-progress-num">{i + 1}</span>
                            <span className="luw-progress-label">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="luw-body">
                    {renderCurrentStep()}
                </div>

                {/* Footer */}
                <div className="luw-footer">
                    <button
                        className="luw-btn luw-btn-secondary"
                        onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                    >
                        <ChevronLeft size={16} />
                        {step > 0 ? 'Back' : 'Cancel'}
                    </button>

                    {isLastStep ? (
                        <button className="luw-btn luw-btn-primary" onClick={handleComplete}>
                            <Check size={16} /> Create Character
                        </button>
                    ) : (
                        <button
                            className="luw-btn luw-btn-primary"
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
