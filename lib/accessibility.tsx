import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { colors as baseColors } from './theme';

interface AccessibilityValue {
  largeText: boolean;
  /** In-app multiplier applied to token font sizes. */
  scale: number;
  /**
   * Cap for the *OS* font-size multiplier, passed to every Text via the
   * Typography components. Chosen so `scale * maxFontSizeMultiplier` lands at
   * roughly 1.6x whether or not the in-app toggle is on — the app setting and
   * the system setting no longer compound without bound.
   */
  maxFontSizeMultiplier: number;
  colors: typeof baseColors;
  setLargeText: (value: boolean) => void;
}

/** Total growth ceiling, in-app toggle and OS setting combined. */
const MAX_TOTAL_SCALE = 1.6;
const LARGE_TEXT_SCALE = 1.25;

/**
 * High contrast darkens body text *and* the status colours. The previous version
 * only touched text/textMuted/border, so the app's weakest pairings (status chips
 * on their tinted backgrounds) stayed weakest in the mode meant to fix them.
 */
const highContrastColors: typeof baseColors = {
  ...baseColors,
  text: '#000000',
  textMuted: '#242B29',
  border: '#8AA39D',
  borderStrong: '#3F5B54',
  primary: '#12564A',
  primaryDark: '#0C3F36',
  low: '#6B3A00',
  inRange: '#11512B',
  high: '#7E1F18',
  danger: '#8A241E',
};

const AccessibilityContext = createContext<AccessibilityValue>({
  largeText: false,
  scale: 1,
  maxFontSizeMultiplier: MAX_TOTAL_SCALE,
  colors: baseColors,
  setLargeText: () => {},
});

export function AccessibilityProvider({
  initialLargeText,
  children,
}: {
  initialLargeText: boolean;
  children: ReactNode;
}) {
  const [largeText, setLargeText] = useState(initialLargeText);

  const value = useMemo<AccessibilityValue>(() => {
    const scale = largeText ? LARGE_TEXT_SCALE : 1;
    return {
      largeText,
      scale,
      maxFontSizeMultiplier: MAX_TOTAL_SCALE / scale,
      colors: largeText ? highContrastColors : baseColors,
      setLargeText,
    };
  }, [largeText]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityValue {
  return useContext(AccessibilityContext);
}
