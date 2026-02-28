import React, { createContext, useContext, useState, useMemo } from 'react';
import { LIGHT_AC, DARK_AC, ACPalette } from './adminTheme';

interface DemoTheme {
  isDark: boolean;
  AC: ACPalette;
  toggleTheme: () => void;
}

const DemoThemeContext = createContext<DemoTheme>({
  isDark: false,
  AC: LIGHT_AC,
  toggleTheme: () => {},
});

export function DemoThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const AC = isDark ? DARK_AC : LIGHT_AC;
  const value = useMemo<DemoTheme>(
    () => ({ isDark, AC, toggleTheme: () => setIsDark(d => !d) }),
    [isDark, AC],
  );
  return (
    <DemoThemeContext.Provider value={value}>
      {children}
    </DemoThemeContext.Provider>
  );
}

export function useDemoTheme(): DemoTheme {
  return useContext(DemoThemeContext);
}

export function useDemoAC(): ACPalette {
  return useContext(DemoThemeContext).AC;
}
