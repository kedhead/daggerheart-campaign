/**
 * Game System Theme Configuration
 * Maps game systems to their visual themes
 */

export const gameThemes = {
    daggerheart: {
        id: 'daggerheart',
        name: 'Daggerheart',
        description: 'Hope & Fear - Dark fantasy',
        colors: {
            accentPrimary: '#eab308',    // Gold
            accentSecondary: '#f59e0b',
            accentTertiary: '#8b5cf6',   // Purple for Fear
            bgPrimary: '#0d1126',
            bgSecondary: '#141b33',
            bgTertiary: '#1a2340',
            glowColor: 'rgba(234, 179, 8, 0.3)',
            borderColor: 'rgba(234, 179, 8, 0.4)',
        }
    },
    dnd5e: {
        id: 'dnd5e',
        name: 'D&D 5th Edition',
        description: 'Classic fantasy adventure',
        colors: {
            accentPrimary: '#dc2626',    // Red
            accentSecondary: '#ef4444',
            accentTertiary: '#fbbf24',   // Gold secondary
            bgPrimary: '#1a0a0a',
            bgSecondary: '#2d1414',
            bgTertiary: '#3d1c1c',
            glowColor: 'rgba(220, 38, 38, 0.3)',
            borderColor: 'rgba(220, 38, 38, 0.4)',
        }
    },
    starwarsd6: {
        id: 'starwarsd6',
        name: 'Star Wars D6',
        description: 'A galaxy far, far away',
        colors: {
            accentPrimary: '#3b82f6',    // Blue
            accentSecondary: '#60a5fa',
            accentTertiary: '#fbbf24',   // Yellow secondary
            bgPrimary: '#0a0a1a',
            bgSecondary: '#0f1629',
            bgTertiary: '#162033',
            glowColor: 'rgba(59, 130, 246, 0.3)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
        }
    },
    pathfinder: {
        id: 'pathfinder',
        name: 'Pathfinder',
        description: 'Epic fantasy adventures',
        colors: {
            accentPrimary: '#22c55e',    // Green
            accentSecondary: '#4ade80',
            accentTertiary: '#f59e0b',   // Orange secondary
            bgPrimary: '#0a1a0f',
            bgSecondary: '#122417',
            bgTertiary: '#1a3020',
            glowColor: 'rgba(34, 197, 94, 0.3)',
            borderColor: 'rgba(34, 197, 94, 0.4)',
        }
    },
    callofcthulhu: {
        id: 'callofcthulhu',
        name: 'Call of Cthulhu',
        description: 'Cosmic horror investigation',
        colors: {
            accentPrimary: '#6366f1',    // Indigo
            accentSecondary: '#818cf8',
            accentTertiary: '#22d3d1',   // Teal secondary
            bgPrimary: '#0f0a1a',
            bgSecondary: '#1a1429',
            bgTertiary: '#241c38',
            glowColor: 'rgba(99, 102, 241, 0.3)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
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
 * Apply theme to document root as CSS variables
 * @param {string} gameSystem - The game system ID
 */
export function applyTheme(gameSystem) {
    const theme = getTheme(gameSystem);
    const root = document.documentElement;

    root.setAttribute('data-theme', theme.id);

    // Set CSS custom properties
    root.style.setProperty('--accent-primary', theme.colors.accentPrimary);
    root.style.setProperty('--accent-secondary', theme.colors.accentSecondary);
    root.style.setProperty('--accent-tertiary', theme.colors.accentTertiary);
    root.style.setProperty('--bg-primary', theme.colors.bgPrimary);
    root.style.setProperty('--bg-secondary', theme.colors.bgSecondary);
    root.style.setProperty('--bg-tertiary', theme.colors.bgTertiary);
    root.style.setProperty('--glow-color', theme.colors.glowColor);
    root.style.setProperty('--border-accent', theme.colors.borderColor);
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
