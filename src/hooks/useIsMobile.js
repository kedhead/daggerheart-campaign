import { useState, useEffect } from 'react';

// Kept in sync with the .lr-mobile-only / .lr-desktop-only breakpoint in
// src/styles/globals.css, so JS-driven layout and CSS-driven chrome (the bottom
// nav, the hamburger) agree about what counts as mobile.
const MOBILE_QUERY = '(max-width: 1024px), (max-width: 1366px) and (pointer: coarse)';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export default useIsMobile;
