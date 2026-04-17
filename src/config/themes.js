/**
 * Game System Theme Configuration
 * Maps game systems to their visual themes.
 *
 * Tokens follow the Lorelich design system: each theme declares its full
 * surface + text + accent + rarity palette so scenes and primitives can
 * read from a single, consistent set of CSS variables.
 *
 * Legacy vars (--accent-primary, --bg-primary, --text-primary, etc.) are
 * still written for backwards compatibility with existing components.
 */

export const gameThemes = {
    daggerheart: {
        id: 'daggerheart',
        name: 'Daggerheart',
        description: 'Hope & Fear - Dark fantasy',
        colors: {
            // Legacy (kept for existing components)
            accentPrimary: '#eab308',
            accentSecondary: '#f59e0b',
            accentTertiary: '#8b5cf6',
            bgPrimary: '#0E0B1F',
            bgSecondary: '#17132E',
            bgTertiary: '#1E1940',
            glowColor: 'rgba(139, 92, 246, 0.3)',
            borderColor: 'rgba(139, 92, 246, 0.4)',

            // Lorelich tokens
            bg: '#0E0B1F',
            surface: '#17132E',
            surfaceHi: '#1E1940',
            line: 'rgba(255,255,255,0.08)',
            lineStrong: 'rgba(255,255,255,0.14)',
            primary: '#8B5CF6',
            primarySoft: 'rgba(139,92,246,0.18)',
            accent: '#FBBF24',
            accentSoft: 'rgba(251,191,36,0.14)',
            fear: '#C084FC',
            text: '#F3EEFF',
            textMuted: '#B9B0D6',
            textDim: '#8278A4',
            danger: '#F87171',
            success: '#34D399',
            info: '#60A5FA',
            rarityCommon: '#6B7280',
            rarityUncommon: '#34D399',
            rarityRare: '#60A5FA',
            rarityEpic: '#C084FC',
            rarityLegendary: '#FBBF24',
        }
    },
    dnd5e: {
        id: 'dnd5e',
        name: 'D&D 5th Edition',
        description: 'Classic fantasy adventure',
        colors: {
            accentPrimary: '#dc2626',
            accentSecondary: '#ef4444',
            accentTertiary: '#fbbf24',
            bgPrimary: '#1C1614',
            bgSecondary: '#26201D',
            bgTertiary: '#322B27',
            glowColor: 'rgba(220, 38, 38, 0.3)',
            borderColor: 'rgba(220, 38, 38, 0.4)',

            bg: '#1C1614',
            surface: '#26201D',
            surfaceHi: '#322B27',
            line: 'rgba(255,255,255,0.07)',
            lineStrong: 'rgba(255,255,255,0.14)',
            primary: '#DC2626',
            primarySoft: 'rgba(220,38,38,0.18)',
            accent: '#E8D9A8',
            accentSoft: 'rgba(232,217,168,0.14)',
            fear: '#EF4444',
            text: '#F7F3EE',
            textMuted: '#C7BCB0',
            textDim: '#8C8278',
            danger: '#F87171',
            success: '#34D399',
            info: '#60A5FA',
            rarityCommon: '#78716C',
            rarityUncommon: '#84CC16',
            rarityRare: '#60A5FA',
            rarityEpic: '#C084FC',
            rarityLegendary: '#F59E0B',
        }
    },
    starwarsd6: {
        id: 'starwarsd6',
        name: 'Star Wars D6',
        description: 'A galaxy far, far away',
        colors: {
            accentPrimary: '#facc15',
            accentSecondary: '#fbbf24',
            accentTertiary: '#93c5fd',
            bgPrimary: '#0A0E15',
            bgSecondary: '#111927',
            bgTertiary: '#18223A',
            glowColor: 'rgba(250, 204, 21, 0.3)',
            borderColor: 'rgba(250, 204, 21, 0.4)',

            bg: '#0A0E15',
            surface: '#111927',
            surfaceHi: '#18223A',
            line: 'rgba(255,255,255,0.08)',
            lineStrong: 'rgba(255,255,255,0.16)',
            primary: '#FACC15',
            primarySoft: 'rgba(250,204,21,0.16)',
            accent: '#93C5FD',
            accentSoft: 'rgba(147,197,253,0.14)',
            fear: '#EF4444',
            text: '#FAFAFA',
            textMuted: '#B8BEC9',
            textDim: '#7E8597',
            danger: '#F87171',
            success: '#34D399',
            info: '#60A5FA',
            rarityCommon: '#6B7280',
            rarityUncommon: '#4ADE80',
            rarityRare: '#60A5FA',
            rarityEpic: '#A78BFA',
            rarityLegendary: '#FACC15',
        }
    },
    pathfinder: {
        id: 'pathfinder',
        name: 'Pathfinder',
        description: 'Epic fantasy adventures',
        colors: {
            accentPrimary: '#22c55e',
            accentSecondary: '#4ade80',
            accentTertiary: '#f59e0b',
            bgPrimary: '#0B1A12',
            bgSecondary: '#102419',
            bgTertiary: '#173024',
            glowColor: 'rgba(34, 197, 94, 0.3)',
            borderColor: 'rgba(34, 197, 94, 0.4)',

            bg: '#0B1A12',
            surface: '#102419',
            surfaceHi: '#173024',
            line: 'rgba(255,255,255,0.08)',
            lineStrong: 'rgba(255,255,255,0.14)',
            primary: '#22C55E',
            primarySoft: 'rgba(34,197,94,0.18)',
            accent: '#F59E0B',
            accentSoft: 'rgba(245,158,11,0.14)',
            fear: '#F87171',
            text: '#F1F5EF',
            textMuted: '#BFD1C2',
            textDim: '#7E9483',
            danger: '#F87171',
            success: '#34D399',
            info: '#60A5FA',
            rarityCommon: '#6B7280',
            rarityUncommon: '#10B981',
            rarityRare: '#3B82F6',
            rarityEpic: '#8B5CF6',
            rarityLegendary: '#F59E0B',
        }
    },
    callofcthulhu: {
        id: 'callofcthulhu',
        name: 'Call of Cthulhu',
        description: 'Cosmic horror investigation',
        colors: {
            accentPrimary: '#6366f1',
            accentSecondary: '#818cf8',
            accentTertiary: '#22d3d1',
            bgPrimary: '#0F0A1A',
            bgSecondary: '#1A1429',
            bgTertiary: '#241C38',
            glowColor: 'rgba(99, 102, 241, 0.3)',
            borderColor: 'rgba(99, 102, 241, 0.4)',

            bg: '#0F0A1A',
            surface: '#1A1429',
            surfaceHi: '#241C38',
            line: 'rgba(255,255,255,0.07)',
            lineStrong: 'rgba(255,255,255,0.14)',
            primary: '#6366F1',
            primarySoft: 'rgba(99,102,241,0.18)',
            accent: '#22D3D1',
            accentSoft: 'rgba(34,211,209,0.14)',
            fear: '#A78BFA',
            text: '#EDE9F5',
            textMuted: '#B5ACC7',
            textDim: '#7C7490',
            danger: '#F87171',
            success: '#34D399',
            info: '#60A5FA',
            rarityCommon: '#6B7280',
            rarityUncommon: '#22D3D1',
            rarityRare: '#6366F1',
            rarityEpic: '#A78BFA',
            rarityLegendary: '#F59E0B',
        }
    },
    parchment: {
        id: 'parchment',
        name: 'Parchment (light)',
        description: 'Warm, daylight reading',
        colors: {
            accentPrimary: '#7c2d12',
            accentSecondary: '#b45309',
            accentTertiary: '#7c2d12',
            bgPrimary: '#F5EFE0',
            bgSecondary: '#FBF7EC',
            bgTertiary: '#FFFCF3',
            glowColor: 'rgba(124, 45, 18, 0.18)',
            borderColor: 'rgba(124, 45, 18, 0.25)',

            bg: '#F5EFE0',
            surface: '#FBF7EC',
            surfaceHi: '#FFFCF3',
            line: 'rgba(76,51,27,0.12)',
            lineStrong: 'rgba(76,51,27,0.22)',
            primary: '#7C2D12',
            primarySoft: 'rgba(124,45,18,0.10)',
            accent: '#B45309',
            accentSoft: 'rgba(180,83,9,0.10)',
            fear: '#7C2D12',
            text: '#1C1612',
            textMuted: '#5A4A3A',
            textDim: '#8A7A68',
            danger: '#B91C1C',
            success: '#166534',
            info: '#1D4ED8',
            rarityCommon: '#78716C',
            rarityUncommon: '#15803D',
            rarityRare: '#1D4ED8',
            rarityEpic: '#7C3AED',
            rarityLegendary: '#B45309',
        }
    }
};

// Default theme when no campaign is selected
export const defaultTheme = 'daggerheart';

/**
 * Get theme for a game system
 * @param {string} gameSystem - The game system ID
 * @returns {object} Theme configuration
 */
export function getTheme(gameSystem) {
    return gameThemes[gameSystem] || gameThemes[defaultTheme];
}

/**
 * Apply theme to document root as CSS variables.
 * Writes both Lorelich tokens and legacy --accent/--bg vars so existing
 * components keep rendering while new components migrate to the new set.
 * @param {string} gameSystem - The game system ID
 */
export function applyTheme(gameSystem) {
    const theme = getTheme(gameSystem);
    const root = document.documentElement;
    const c = theme.colors;

    root.setAttribute('data-theme', theme.id);

    // Legacy vars (existing components)
    root.style.setProperty('--accent-primary', c.accentPrimary);
    root.style.setProperty('--accent-secondary', c.accentSecondary);
    root.style.setProperty('--accent-tertiary', c.accentTertiary);
    root.style.setProperty('--bg-primary', c.bgPrimary);
    root.style.setProperty('--bg-secondary', c.bgSecondary);
    root.style.setProperty('--bg-tertiary', c.bgTertiary);
    root.style.setProperty('--glow-color', c.glowColor);
    root.style.setProperty('--border-accent', c.borderColor);

    // Lorelich tokens
    root.style.setProperty('--bg', c.bg);
    root.style.setProperty('--surface', c.surface);
    root.style.setProperty('--surface-hi', c.surfaceHi);
    root.style.setProperty('--line', c.line);
    root.style.setProperty('--line-strong', c.lineStrong);
    root.style.setProperty('--primary', c.primary);
    root.style.setProperty('--primary-soft', c.primarySoft);
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--accent-soft', c.accentSoft);
    root.style.setProperty('--fear', c.fear);
    root.style.setProperty('--text', c.text);
    root.style.setProperty('--text-muted', c.textMuted);
    root.style.setProperty('--text-dim', c.textDim);
    root.style.setProperty('--danger', c.danger);
    root.style.setProperty('--success', c.success);
    root.style.setProperty('--info', c.info);
    root.style.setProperty('--r-common', c.rarityCommon);
    root.style.setProperty('--r-uncommon', c.rarityUncommon);
    root.style.setProperty('--r-rare', c.rarityRare);
    root.style.setProperty('--r-epic', c.rarityEpic);
    root.style.setProperty('--r-legendary', c.rarityLegendary);
}

/**
 * Get list of available game systems for campaign creation
 */
export function getAvailableGameSystems() {
    return Object.values(gameThemes).map(theme => ({
        id: theme.id,
        name: theme.name,
        description: theme.description
    }));
}
