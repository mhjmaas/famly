import { useEffect, useState } from "react";

/**
 * Hook to check if a media query matches.
 * Returns `undefined` during SSR/hydration to prevent hydration mismatches,
 * then returns the actual value after the component mounts.
 */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value after mount
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    media.addEventListener("change", listener);

    // Cleanup
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
