import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for managing command palette search and navigation
 */
export function useCommandPalette({ commands, onSelect, maxRecent = 5 }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState(() => {
    try {
      const stored = localStorage.getItem('commandPalette_recent');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fuzzy match function
  const fuzzyMatch = useCallback((str, pattern) => {
    if (!pattern) return true;
    const lowerStr = str.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    // Simple contains match with score
    if (lowerStr.includes(lowerPattern)) {
      return { match: true, score: lowerStr.indexOf(lowerPattern) === 0 ? 2 : 1 };
    }

    // Character-by-character fuzzy match
    let patternIdx = 0;
    let score = 0;
    for (let i = 0; i < lowerStr.length && patternIdx < lowerPattern.length; i++) {
      if (lowerStr[i] === lowerPattern[patternIdx]) {
        patternIdx++;
        score += 1;
      }
    }

    if (patternIdx === lowerPattern.length) {
      return { match: true, score: score / lowerPattern.length };
    }

    return { match: false, score: 0 };
  }, []);

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    const results = commands
      .map((cmd) => {
        const titleMatch = fuzzyMatch(cmd.title, query);
        const keywordsMatch = cmd.keywords
          ? cmd.keywords.some((kw) => fuzzyMatch(kw, query).match)
          : false;

        return {
          ...cmd,
          matchScore: titleMatch.match ? titleMatch.score : keywordsMatch ? 0.5 : 0,
        };
      })
      .filter((cmd) => cmd.matchScore > 0 || !query);

    // Sort: recent first (if no query), then by score, then alphabetically
    return results.sort((a, b) => {
      if (!query) {
        const aRecent = recentCommands.indexOf(a.id);
        const bRecent = recentCommands.indexOf(b.id);
        if (aRecent !== -1 && bRecent === -1) return -1;
        if (aRecent === -1 && bRecent !== -1) return 1;
        if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
      }

      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.title.localeCompare(b.title);
    });
  }, [commands, query, recentCommands, fuzzyMatch]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach((cmd) => {
      const category = cmd.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const handleSelect = useCallback((command) => {
    // Add to recent commands
    const newRecent = [
      command.id,
      ...recentCommands.filter((id) => id !== command.id),
    ].slice(0, maxRecent);

    setRecentCommands(newRecent);
    localStorage.setItem('commandPalette_recent', JSON.stringify(newRecent));

    onSelect(command);
    setQuery('');
    setSelectedIndex(0);
  }, [recentCommands, maxRecent, onSelect]);

  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredCommands.length - 1)
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex]);
        }
        break;
      default:
        break;
    }
  }, [filteredCommands, selectedIndex, handleSelect]);

  const reset = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
  }, []);

  return {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    filteredCommands,
    groupedCommands,
    handleKeyDown,
    handleSelect,
    reset,
  };
}
