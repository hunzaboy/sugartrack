import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { colors as baseColors } from './theme';

interface AccessibilityValue {
  largeText: boolean;
  scale: number;
  colors: typeof baseColors;
  setLargeText: (value: boolean) => void;
}

const highContrastColors: typeof baseColors = {
  ...baseColors,
  text: '#000000',
  textMuted: '#2B3138',
  border: '#33383D',
};

const AccessibilityContext = createContext<AccessibilityValue>({
  largeText: false,
  scale: 1,
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

  const value: AccessibilityValue = {
    largeText,
    scale: largeText ? 1.25 : 1,
    colors: largeText ? highContrastColors : baseColors,
    setLargeText,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityValue {
  return useContext(AccessibilityContext);
}
