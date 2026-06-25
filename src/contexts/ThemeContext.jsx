import { createContext, useContext, useEffect } from 'react';
import { getGameSystem } from '../data/systems/index.js';

const DAGGERHEART_DEFAULTS = {
  '--fear-color':    '#8b5cf6',
  '--fear-secondary':'#a78bfa',
  '--hope-color':    '#eab308',
  '--hope-secondary':'#f59e0b',
  '--bg-primary':   '#0f0f1a',
  '--bg-secondary': '#1a1a2e',
  '--bg-tertiary':  '#16213e',
};

function applyVars(vars) {
  Object.entries(vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
}

const ThemeContext = createContext(null);

export function ThemeProvider({ gameSystem, children }) {
  useEffect(() => {
    const system = getGameSystem(gameSystem);

    if (!system?.theme) {
      applyVars(DAGGERHEART_DEFAULTS);
      return;
    }

    const vars = {
      '--fear-color':     system.theme.primary,
      '--fear-secondary': system.theme.primary,
    };

    if (system.theme.secondary) {
      vars['--hope-color']     = system.theme.secondary;
      vars['--hope-secondary'] = system.theme.secondary;
    }

    if (system.id !== 'daggerheart') {
      vars['--bg-primary']   = '#1a1a1a';
      vars['--bg-secondary'] = '#2d2d2d';
      vars['--bg-tertiary']  = '#3a3a3a';
    }

    applyVars(vars);

    return () => applyVars(DAGGERHEART_DEFAULTS);
  }, [gameSystem]);

  return (
    <ThemeContext.Provider value={null}>
      {children}
    </ThemeContext.Provider>
  );
}
