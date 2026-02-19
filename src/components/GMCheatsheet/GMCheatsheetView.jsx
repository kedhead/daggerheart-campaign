import { useState, useMemo } from 'react';
import {
    Search, ChevronDown, Expand, Minimize2,
    Dice5, Target, Heart, Ruler, AlertTriangle,
    Moon, Zap, Swords, Users, Shield, TrendingUp,
    BookOpen, Flame
} from 'lucide-react';
import {
    CLASSES, SUBCLASSES, ANCESTRIES, COMMUNITIES,
    ADVANCEMENT_OPTIONS, DOMAINS
} from '../../data/systems/daggerheart';
import './GMCheatsheetView.css';

// ═══════════════════════════════════════════
// STATIC REFERENCE DATA
// ═══════════════════════════════════════════

const DIFFICULTY_TABLE = [
    { difficulty: 6, label: 'Very Easy', when: 'Trivial tasks, might not require a roll' },
    { difficulty: 9, label: 'Easy', when: 'Simple tasks most could manage' },
    { difficulty: 12, label: 'Moderate', when: 'Typical challenges, default difficulty' },
    { difficulty: 15, label: 'Hard', when: 'Challenging tasks requiring skill or luck' },
    { difficulty: 18, label: 'Very Hard', when: 'Extreme challenges, experts struggle' },
    { difficulty: 21, label: 'Near Impossible', when: 'Legendary feats, borderline miracles' },
];

const DAMAGE_THRESHOLDS = [
    { tier: 1, minor: '1–4', major: '5–9', severe: '10+' },
    { tier: 2, minor: '1–7', major: '8–14', severe: '15+' },
    { tier: 3, minor: '1–11', major: '12–20', severe: '21+' },
    { tier: 4, minor: '1–15', major: '16–25', severe: '26+' },
];

const RANGE_BANDS = [
    { range: 'Connected', desc: 'Touching / grappling distance' },
    { range: 'Melee', desc: 'Within arm\'s reach (~5 ft)' },
    { range: 'Very Close', desc: 'A few steps away (~10 ft)' },
    { range: 'Close', desc: 'Across a room (~30 ft)' },
    { range: 'Far', desc: 'Across a large area (~60 ft)' },
    { range: 'Very Far', desc: 'Edge of visibility (~120 ft)' },
];

const CONDITIONS = [
    { name: 'Vulnerable', effect: 'Attacks against this creature gain advantage. Cleared after being attacked.' },
    { name: 'Restrained', effect: 'Cannot move. Attacks against this creature gain advantage. Must succeed on a roll to escape.' },
    { name: 'Cloaked', effect: 'Hidden from enemies. Attacks made while cloaked gain advantage. Cleared when you attack, cast a spell, or are spotted.' },
    { name: 'Hidden', effect: 'Cannot be targeted. Cleared when you attack, cast a spell, or enter line of sight.' },
    { name: 'Frightened', effect: 'Cannot willingly move closer to the source of fear. Disadvantage on action rolls while the source is in sight.' },
    { name: 'Dazed', effect: 'Can only take one action on your turn.' },
    { name: 'Weakened', effect: 'Roll with disadvantage on Strength and Agility action rolls.' },
    { name: 'Slowed', effect: 'Move only up to Very Close range on your turn.' },
];

const REST_RULES = {
    short: [
        'Takes about 1 hour in a safe place',
        'Clear all marked Armor Slots',
        'Clear Stress equal to your level (minimum 1)',
        'Each character may take 1 downtime move',
    ],
    long: [
        'Takes about 8 hours, requires a safe place',
        'Clear all Stress and Armor Slots',
        'Clear Hit Points equal to half your max (round up)',
        'Reset all "once per rest" features',
        'Each character may take 2 downtime moves',
    ],
    downtime: [
        'Forage / Hunt — find food and supplies',
        'Craft — create or repair an item',
        'Tend — heal an ally\'s Hit Points (roll a d6)',
        'Explore — scout the area',
        'Study — research a question or mystery',
        'Prepare — gain a preparation benefit',
        'Socialize — interact with NPCs or allies',
    ],
};

const HOPE_FEAR_RULES = {
    hope: [
        'Players gain Hope when they roll with Hope (higher Hope Die)',
        'Hope can be spent to: activate class features, Help an Ally (costs 1 Hope), activate Hope abilities',
        'Hope is shared in a communal pool between all players',
        'Max Hope pool = 2 × number of players',
    ],
    fear: [
        'GM gains Fear when players roll with Fear (higher Fear Die)',
        'Fear can be spent to: activate adversary abilities, deal extra damage, introduce complications',
        'GM Fear pool has no maximum',
        'Fear is a pacing tool — spend it to escalate tension',
        'Critical Failure: GM gains Fear AND the action fails',
    ],
    duality: [
        'Roll 2d12 (Hope Die + Fear Die) + Trait modifier',
        'If Hope Die ≥ Fear Die → Success with Hope',
        'If Fear Die > Hope Die → Success with Fear (GM gains 1 Fear)',
        'Ties go to Hope',
        'Critical Success: Doubles on a success — extra powerful outcome',
    ],
};

const ACTION_ECONOMY = [
    { action: 'Action', desc: 'Your main activity: attack, cast spell, interact, move' },
    { action: 'Reaction', desc: 'Triggered by specific circumstances; each limited to once per trigger' },
    { action: 'Free Action', desc: 'Brief, simple things: speak a sentence, drop an item' },
    { action: 'Movement', desc: 'Move up to Close range as part of your action; can split before/after' },
    { action: 'Sprint', desc: 'Mark a Stress to move an additional Close range' },
];

// ═══════════════════════════════════════════
// SECTION DEFINITIONS
// ═══════════════════════════════════════════

function useSections() {
    return useMemo(() => [
        {
            id: 'duality',
            title: 'Duality Dice & Action Resolution',
            icon: Dice5,
            keywords: ['dice', 'roll', 'hope', 'fear', 'duality', 'action', 'resolution', 'success', 'failure', 'critical'],
            render: () => (
                <>
                    <div className="gm-callout hope">
                        <strong>Core Mechanic:</strong> Roll 2d12 (Hope Die + Fear Die) + Trait modifier vs. Difficulty.
                        If the result meets or exceeds the Difficulty, it's a success.
                    </div>
                    <ul className="gm-compact-list">
                        {HOPE_FEAR_RULES.duality.map((rule, i) => (
                            <li key={i}>{rule}</li>
                        ))}
                    </ul>
                </>
            ),
        },
        {
            id: 'difficulty',
            title: 'Difficulty Tiers',
            icon: Target,
            keywords: ['difficulty', 'dc', 'target', 'number', 'easy', 'hard', 'moderate'],
            render: () => (
                <table className="gm-table">
                    <thead>
                        <tr><th>DC</th><th>Difficulty</th><th>When to Use</th></tr>
                    </thead>
                    <tbody>
                        {DIFFICULTY_TABLE.map(row => (
                            <tr key={row.difficulty}>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.difficulty}</td>
                                <td>{row.label}</td>
                                <td>{row.when}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ),
        },
        {
            id: 'damage',
            title: 'Damage Thresholds',
            icon: Heart,
            keywords: ['damage', 'threshold', 'minor', 'major', 'severe', 'hp', 'hit point', 'tier'],
            render: () => (
                <>
                    <div className="gm-callout fear">
                        <strong>Damage → Hit Points:</strong> Minor = 1 HP, Major = 2 HP, Severe = 3 HP.
                        Armor Slots absorb 1 threshold step each.
                    </div>
                    <table className="gm-table">
                        <thead>
                            <tr><th>Tier</th><th>Minor</th><th>Major</th><th>Severe</th></tr>
                        </thead>
                        <tbody>
                            {DAMAGE_THRESHOLDS.map(row => (
                                <tr key={row.tier}>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tier {row.tier}</td>
                                    <td>{row.minor}</td>
                                    <td>{row.major}</td>
                                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{row.severe}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ),
        },
        {
            id: 'ranges',
            title: 'Range Bands',
            icon: Ruler,
            keywords: ['range', 'melee', 'close', 'far', 'very close', 'very far', 'distance', 'connected'],
            render: () => (
                <table className="gm-table">
                    <thead>
                        <tr><th>Range</th><th>Approximate Distance</th></tr>
                    </thead>
                    <tbody>
                        {RANGE_BANDS.map(row => (
                            <tr key={row.range}>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.range}</td>
                                <td>{row.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ),
        },
        {
            id: 'conditions',
            title: 'Conditions',
            icon: AlertTriangle,
            keywords: ['condition', 'vulnerable', 'restrained', 'cloaked', 'hidden', 'frightened', 'dazed', 'weakened', 'slowed', 'status'],
            render: () => (
                <table className="gm-table">
                    <thead>
                        <tr><th>Condition</th><th>Effect</th></tr>
                    </thead>
                    <tbody>
                        {CONDITIONS.map(row => (
                            <tr key={row.name}>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{row.name}</td>
                                <td>{row.effect}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ),
        },
        {
            id: 'actions',
            title: 'Economy of Action',
            icon: Zap,
            keywords: ['action', 'reaction', 'movement', 'sprint', 'free', 'turn', 'economy'],
            render: () => (
                <table className="gm-table">
                    <thead>
                        <tr><th>Action Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        {ACTION_ECONOMY.map(row => (
                            <tr key={row.action}>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{row.action}</td>
                                <td>{row.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ),
        },
        {
            id: 'rests',
            title: 'Rest Mechanics',
            icon: Moon,
            keywords: ['rest', 'short', 'long', 'downtime', 'heal', 'recovery', 'stress', 'armor'],
            render: () => (
                <>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ color: 'var(--hope-color)', fontSize: '0.82rem' }}>Short Rest</strong>
                        <ul className="gm-compact-list">
                            {REST_RULES.short.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ color: 'var(--hope-color)', fontSize: '0.82rem' }}>Long Rest</strong>
                        <ul className="gm-compact-list">
                            {REST_RULES.long.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    <div>
                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Downtime Moves</strong>
                        <ul className="gm-compact-list">
                            {REST_RULES.downtime.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                </>
            ),
        },
        {
            id: 'hope-fear',
            title: 'Hope & Fear Economy',
            icon: Flame,
            keywords: ['hope', 'fear', 'pool', 'economy', 'spend', 'gain', 'gm'],
            render: () => (
                <>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ color: 'var(--hope-color)', fontSize: '0.82rem' }}>Hope (Players)</strong>
                        <ul className="gm-compact-list">
                            {HOPE_FEAR_RULES.hope.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    <div>
                        <strong style={{ color: 'var(--fear-color, #a855f7)', fontSize: '0.82rem' }}>Fear (GM)</strong>
                        <ul className="gm-compact-list">
                            {HOPE_FEAR_RULES.fear.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                </>
            ),
        },
        {
            id: 'classes',
            title: 'Class Quick Reference',
            icon: Swords,
            keywords: ['class', ...Object.keys(CLASSES).map(c => c.toLowerCase()), 'domains', 'hp', 'evasion', 'features'],
            render: () => (
                <div>
                    {Object.entries(CLASSES).map(([name, data]) => (
                        <div key={name} className="gm-ref-card">
                            <div className="gm-ref-card-name">{name}</div>
                            <div className="gm-ref-card-meta">
                                {data.domains.join(' · ')} | HP {data.baseHp} | Evasion {data.baseEvasion} | Prof +1
                            </div>
                            <div className="gm-ref-card-desc">{data.description}</div>
                            {data.classFeatures?.map((f, i) => (
                                <div key={i} className="gm-ref-card-feature">
                                    <div className="gm-ref-card-feature-name">{f.name}</div>
                                    <div className="gm-ref-card-feature-desc">{f.description}</div>
                                </div>
                            ))}
                            {data.hopeFeature && (
                                <div className="gm-ref-card-feature" style={{ borderLeftColor: 'var(--hope-color)' }}>
                                    <div className="gm-ref-card-feature-name">⭐ {data.hopeFeature.name}</div>
                                    <div className="gm-ref-card-feature-desc">{data.hopeFeature.description}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ),
        },
        {
            id: 'ancestries',
            title: 'Ancestry Features',
            icon: Users,
            keywords: ['ancestry', 'race', ...Object.keys(ANCESTRIES).map(a => a.toLowerCase()), 'feature'],
            render: () => (
                <div>
                    {Object.entries(ANCESTRIES).map(([name, data]) => {
                        const desc = typeof data === 'string' ? data : data.description;
                        const features = typeof data === 'object' ? data.features || [] : [];
                        return (
                            <div key={name} className="gm-ref-card">
                                <div className="gm-ref-card-name">{name}</div>
                                <div className="gm-ref-card-desc">{desc}</div>
                                {features.map((f, i) => (
                                    <div key={i} className="gm-ref-card-feature">
                                        <div className="gm-ref-card-feature-name">{f.name}</div>
                                        <div className="gm-ref-card-feature-desc">{f.description}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            ),
        },
        {
            id: 'communities',
            title: 'Community Features',
            icon: Shield,
            keywords: ['community', ...Object.keys(COMMUNITIES).map(c => c.toLowerCase()), 'feature'],
            render: () => (
                <div>
                    {Object.entries(COMMUNITIES).map(([name, data]) => {
                        const desc = typeof data === 'string' ? data : data.description;
                        const features = typeof data === 'object' ? data.features || [] : [];
                        return (
                            <div key={name} className="gm-ref-card">
                                <div className="gm-ref-card-name">{name}</div>
                                <div className="gm-ref-card-desc">{desc}</div>
                                {features.map((f, i) => (
                                    <div key={i} className="gm-ref-card-feature">
                                        <div className="gm-ref-card-feature-name">{f.name}</div>
                                        <div className="gm-ref-card-feature-desc">{f.description}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            ),
        },
        {
            id: 'advancements',
            title: 'Advancement Options',
            icon: TrendingUp,
            keywords: ['advancement', 'level', 'tier', 'level up', 'traits', 'hp', 'stress', 'evasion', 'proficiency', 'multiclass'],
            render: () => (
                <>
                    {Object.entries(ADVANCEMENT_OPTIONS).map(([tierKey, options]) => (
                        <div key={tierKey} style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ color: 'var(--fear-color, #a855f7)', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                                {tierKey.replace('tier', 'Tier ')}
                            </strong>
                            <table className="gm-table">
                                <thead>
                                    <tr><th>Advancement</th><th>Slots</th><th>Cost</th></tr>
                                </thead>
                                <tbody>
                                    {options.map(opt => (
                                        <tr key={opt.id}>
                                            <td>{opt.label}</td>
                                            <td>{opt.slots}</td>
                                            <td>{opt.cost} advancement{opt.cost > 1 ? 's' : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </>
            ),
        },
    ], []);
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function GMCheatsheetView() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState(new Set(['duality', 'difficulty', 'damage']));

    const sections = useSections();

    const filteredSections = useMemo(() => {
        if (!searchTerm.trim()) return sections;
        const lower = searchTerm.toLowerCase();
        return sections.filter(s =>
            s.title.toLowerCase().includes(lower) ||
            s.keywords.some(k => k.includes(lower))
        );
    }, [sections, searchTerm]);

    const toggleSection = (id) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedSections(new Set(sections.map(s => s.id)));
    };

    const collapseAll = () => {
        setExpandedSections(new Set());
    };

    return (
        <div className="gm-cheatsheet">
            <div className="gm-cheatsheet-header">
                <h1>
                    <BookOpen size={24} />
                    GM Screen
                </h1>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="gm-bulk-actions">
                        <button onClick={expandAll}><Expand size={14} /> Expand All</button>
                        <button onClick={collapseAll}><Minimize2 size={14} /> Collapse All</button>
                    </div>
                    <div className="gm-search">
                        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search rules..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {filteredSections.length === 0 ? (
                <div className="gm-no-results">
                    <div className="no-results-icon">🔍</div>
                    No sections match "{searchTerm}"
                </div>
            ) : (
                <div className="gm-sections">
                    {filteredSections.map(section => {
                        const Icon = section.icon;
                        const isExpanded = expandedSections.has(section.id);
                        return (
                            <div key={section.id} className={`gm-section ${isExpanded ? 'expanded' : ''}`}>
                                <button className="gm-section-header" onClick={() => toggleSection(section.id)}>
                                    <Icon size={18} className="section-icon" />
                                    <span className="section-title">{section.title}</span>
                                    <ChevronDown size={16} className="chevron" />
                                </button>
                                {isExpanded && (
                                    <div className="gm-section-body">
                                        {section.render()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
