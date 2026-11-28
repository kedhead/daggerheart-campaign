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

// Checked against the core rulebook text the app ships (api/daggerheart-rules.json).
const DIFFICULTY_TABLE = [
    { difficulty: 5, label: 'Very Easy', when: 'Barely worth a roll' },
    { difficulty: 10, label: 'Easy', when: 'Most people could do it' },
    { difficulty: 15, label: 'Average', when: 'A real challenge for a capable hero' },
    { difficulty: 20, label: 'Hard', when: 'Takes skill, luck, or both' },
    { difficulty: 25, label: 'Very Hard', when: 'Experts often fail' },
    { difficulty: 30, label: 'Nearly Impossible', when: 'The stuff of legend' },
];

const DAMAGE_STEPS = [
    { damage: 'Below Major', marks: '1 HP' },
    { damage: 'Major or more', marks: '2 HP' },
    { damage: 'Severe or more', marks: '3 HP' },
    { damage: 'Double Severe or more (Massive)', marks: '4 HP' },
];

const RANGE_BANDS = [
    { range: 'Melee', desc: 'Touching distance, a few feet (more for very large creatures)' },
    { range: 'Very Close', desc: "About 5–10 ft; fine details visible. On a map: a card's short edge (2–3 in)" },
    { range: 'Close', desc: 'About 10–30 ft; across a room' },
    { range: 'Far', desc: "About 30–100 ft; across a small battlefield. On a map: a sheet of paper's long edge (11–12 in)" },
    { range: 'Very Far', desc: 'About 100–300 ft; shapes but no detail' },
    { range: 'Out of Range', desc: "Beyond Very Far: usually can't be targeted" },
];

const CONDITIONS = [
    { name: 'Hidden', effect: "Out of sight of all foes and they don't know where you are: rolls against you have disadvantage. Ends when an adversary would see you, you move into their line of sight, or you attack." },
    { name: 'Restrained', effect: "You can't move until it is cleared, but you can still act from where you are." },
    { name: 'Vulnerable', effect: "You're in a bad spot (knocked down, off balance, caught off guard): all rolls targeting you have advantage." },
];

const REST_RULES = {
    general: [
        'Each PC makes two downtime moves (the same one twice is allowed) and can swap domain cards between loadout and vault',
        'Up to three short rests in a row; then the next rest must be a long rest',
        "An interrupted short rest gives nothing; an interrupted long rest gives a short rest's benefits",
        '"Per rest" features refresh on either rest; "per long rest" only on a long rest',
    ],
    short: [
        'About an hour',
        'Tend to Wounds: clear 1d4 + tier Hit Points (yourself or an ally)',
        'Clear Stress: clear 1d4 + tier Stress',
        "Repair Armor: clear 1d4 + tier Armor Slots (yours or an ally's)",
        'Prepare: gain a Hope, or 2 Hope each if you Prepare together',
        'GM gains 1d4 Fear',
    ],
    long: [
        'A few hours: make camp and sleep',
        'Tend to All Wounds: clear all Hit Points (yourself or an ally)',
        'Clear All Stress',
        "Repair All Armor (yours or an ally's)",
        'Prepare: gain a Hope, or 2 Hope each if you Prepare together',
        'Work on a Project: tick its countdown, or roll for progress if the GM asks',
        'GM gains 1d4 + number of PCs Fear, and may advance a long-term countdown',
    ],
};

const HOPE_FEAR_RULES = {
    hope: [
        'Each PC has their own Hope, up to 6; it carries over between sessions',
        'Gain a Hope on any action roll with Hope, and on a critical success',
        'Help an Ally: 1 Hope, the ally adds a d6 advantage die (any number can help)',
        'Utilize an Experience: 1 Hope per Experience, add its modifier to an action or reaction roll',
        'Initiate a Tag Team Roll: 3 Hope',
        'Hope features: spend exactly what the feature says',
    ],
    fear: [
        'GM gains a Fear whenever a player rolls with Fear, and from rests',
        'Maximum 12 Fear; it carries over between sessions — keep it visible to the players',
        'Spend a Fear to: interrupt the players and make a GM move',
        '…make an additional GM move after one you just made',
        "…use an adversary's or environment's Fear feature",
        "…add an adversary's Experience to a roll",
    ],
    duality: [
        'Roll 2d12 (Hope Die + Fear Die) + trait + modifiers; meet or beat the Difficulty to succeed',
        'Hope Die higher: the roll is "with Hope" (the player gains a Hope)',
        'Fear Die higher: the roll is "with Fear" (the GM gains a Fear), success or failure',
        'Matching dice: a critical success, even if the total missed. Gain a Hope and clear a Stress',
        "Critical on an attack: extra damage. Start with the dice's maximum, then roll and add",
        'There are no critical failures',
        "Reaction rolls don't give Hope or Fear, and no one can help with them",
    ],
};

const SPOTLIGHT_RULES = [
    { action: 'No turns', desc: 'There is no initiative: the spotlight moves between the players and the GM' },
    { action: "GM's turn", desc: 'A player fails a roll or rolls with Fear, or the GM spends a Fear to interrupt' },
    { action: 'Movement', desc: 'As part of an action, move anywhere within Close range you could plausibly reach' },
    { action: 'Farther', desc: 'Beyond Close, or somewhere hard to reach (climb, swim, jump): an Agility roll or a move of its own' },
    { action: 'Into melee', desc: 'While in danger, you can move into Melee with anything within Close range as part of your action' },
    { action: 'Reactions', desc: 'Reaction rolls dodge or withstand an effect; they generate no Hope, Fear or GM moves' },
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
                        <strong>Core Mechanic:</strong> Roll 2d12 (Hope Die + Fear Die) + trait vs. Difficulty.
                        Meet or beat it to succeed. Matching dice always succeed (a critical).
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
            keywords: ['damage', 'threshold', 'minor', 'major', 'severe', 'massive', 'hp', 'hit point', 'armor'],
            render: () => (
                <>
                    <div className="gm-callout fear">
                        <strong>Thresholds:</strong> a PC's Major and Severe thresholds are their armor's base thresholds plus their level.
                        Adversaries' are on their stat block. Damage marks Hit Points by threshold, not one per point.
                    </div>
                    <table className="gm-table">
                        <thead>
                            <tr><th>Damage taken</th><th>Mark</th></tr>
                        </thead>
                        <tbody>
                            {DAMAGE_STEPS.map(row => (
                                <tr key={row.damage}>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.damage}</td>
                                    <td>{row.marks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <ul className="gm-compact-list">
                        <li>Armor: mark one Armor Slot per attack to drop the damage one step (Severe → Major → Minor → none)</li>
                        <li>A PC has Armor Slots equal to their Armor Score</li>
                    </ul>
                </>
            ),
        },
        {
            id: 'ranges',
            title: 'Range Bands',
            icon: Ruler,
            keywords: ['range', 'melee', 'close', 'far', 'very close', 'very far', 'distance', 'out of range', 'feet', 'map'],
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
            keywords: ['condition', 'vulnerable', 'restrained', 'hidden', 'status', 'advantage', 'disadvantage'],
            render: () => (
                <>
                <div className="gm-callout">
                    Daggerheart has three conditions. Others come from features and work as their text says. A condition can't stack on the same target.
                </div>
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
                </>
            ),
        },
        {
            id: 'actions',
            title: 'Spotlight & Movement',
            icon: Zap,
            keywords: ['action', 'reaction', 'movement', 'spotlight', 'turn', 'initiative', 'agility', 'move'],
            render: () => (
                <table className="gm-table">
                    <thead>
                        <tr><th></th><th>How it works</th></tr>
                    </thead>
                    <tbody>
                        {SPOTLIGHT_RULES.map(row => (
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
            keywords: ['rest', 'short', 'long', 'downtime', 'heal', 'recovery', 'stress', 'armor', 'prepare', 'project', 'fear'],
            render: () => (
                <>
                    <ul className="gm-compact-list" style={{ marginBottom: '0.75rem' }}>
                        {REST_RULES.general.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
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
                </>
            ),
        },
        {
            id: 'hope-fear',
            title: 'Hope & Fear Economy',
            icon: Flame,
            keywords: ['hope', 'fear', 'pool', 'economy', 'spend', 'gain', 'gm', 'help', 'experience', 'tag team', 'maximum'],
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
