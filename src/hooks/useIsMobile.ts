/**
 * useIsMobile — matchMedia hook for responsive layouts.
 * Returns true when viewport width ≤ breakpoint (default 768px).
 */
import { useEffect, useState } from 'react';

export function isMobileViewport(breakpoint = 768): boolean {
  return typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
}

export function useIsMobile(breakpoint = 768): boolean {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(() => isMobileViewport(breakpoint));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return isMobile;
}
