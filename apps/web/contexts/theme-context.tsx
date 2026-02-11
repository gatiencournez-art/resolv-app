'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ThemeMode = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';

export interface ColorTheme {
  id: string;
  name: string;
  accent: string;
  accentHover: string;
  secondary: string;
  secondaryHover: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarTextActive: string;
  sidebarBorder: string;
  sidebarHover: string;
  sidebarActive: string;
}

// ============================================================================
// PRESET THEMES
// ============================================================================

export const PRESET_THEMES: ColorTheme[] = [
  {
    id: 'default',
    name: 'Indigo & Teal',
    accent: '#6366f1',
    accentHover: '#4f46e5',
    secondary: '#2dd4bf',
    secondaryHover: '#14b8a6',
    sidebarBg: '#0d0d14',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    sidebarHover: 'rgba(255,255,255,0.04)',
    sidebarActive: '#6366f1',
  },
  {
    id: 'ocean',
    name: 'Bleu & Cyan',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    secondary: '#22d3ee',
    secondaryHover: '#06b6d4',
    sidebarBg: '#0c1929',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(59,130,246,0.1)',
    sidebarHover: 'rgba(59,130,246,0.08)',
    sidebarActive: '#3b82f6',
  },
  {
    id: 'emerald',
    name: 'Émeraude & Lime',
    accent: '#10b981',
    accentHover: '#059669',
    secondary: '#a3e635',
    secondaryHover: '#84cc16',
    sidebarBg: '#0a1a14',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(16,185,129,0.1)',
    sidebarHover: 'rgba(16,185,129,0.08)',
    sidebarActive: '#10b981',
  },
  {
    id: 'violet',
    name: 'Violet & Rose',
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
    secondary: '#f472b6',
    secondaryHover: '#ec4899',
    sidebarBg: '#110d1a',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(139,92,246,0.1)',
    sidebarHover: 'rgba(139,92,246,0.08)',
    sidebarActive: '#8b5cf6',
  },
  {
    id: 'rose',
    name: 'Rose & Ambre',
    accent: '#f43f5e',
    accentHover: '#e11d48',
    secondary: '#fbbf24',
    secondaryHover: '#f59e0b',
    sidebarBg: '#140a0d',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(244,63,94,0.1)',
    sidebarHover: 'rgba(244,63,94,0.08)',
    sidebarActive: '#f43f5e',
  },
  {
    id: 'sunset',
    name: 'Orange & Fuchsia',
    accent: '#f97316',
    accentHover: '#ea580c',
    secondary: '#d946ef',
    secondaryHover: '#c026d3',
    sidebarBg: '#141008',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(249,115,22,0.1)',
    sidebarHover: 'rgba(249,115,22,0.08)',
    sidebarActive: '#f97316',
  },
  {
    id: 'slate',
    name: 'Ardoise & Bleu',
    accent: '#64748b',
    accentHover: '#475569',
    secondary: '#60a5fa',
    secondaryHover: '#3b82f6',
    sidebarBg: '#0f1114',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(100,116,139,0.12)',
    sidebarHover: 'rgba(100,116,139,0.1)',
    sidebarActive: '#64748b',
  },
  {
    id: 'cyan',
    name: 'Cyan & Indigo',
    accent: '#06b6d4',
    accentHover: '#0891b2',
    secondary: '#818cf8',
    secondaryHover: '#6366f1',
    sidebarBg: '#0a1517',
    sidebarText: 'rgba(255,255,255,0.5)',
    sidebarTextActive: 'rgba(255,255,255,0.95)',
    sidebarBorder: 'rgba(6,182,212,0.1)',
    sidebarHover: 'rgba(6,182,212,0.08)',
    sidebarActive: '#06b6d4',
  },
];

// ============================================================================
// CONTEXT
// ============================================================================

interface ThemeContextType {
  // Theme mode (light/dark)
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Color palette
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  customColors: Partial<ColorTheme>;
  setCustomColors: (colors: Partial<ColorTheme>) => void;
  setAccentColor: (color: string, hover: string) => void;

  // UI preferences
  density: Density;
  setDensity: (density: Density) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// APPLY CSS VARIABLES
// ============================================================================

function applyColorTheme(theme: ColorTheme, customColors: Partial<ColorTheme>) {
  const root = document.documentElement;
  const merged = { ...theme, ...customColors };

  root.style.setProperty('--accent', merged.accent);
  root.style.setProperty('--accent-hover', merged.accentHover);
  root.style.setProperty('--secondary', merged.secondary);
  root.style.setProperty('--secondary-hover', merged.secondaryHover);
  root.style.setProperty('--sidebar-bg', merged.sidebarBg);
  root.style.setProperty('--sidebar-text', merged.sidebarText);
  root.style.setProperty('--sidebar-text-active', merged.sidebarTextActive);
  root.style.setProperty('--sidebar-border', merged.sidebarBorder);
  root.style.setProperty('--sidebar-hover', merged.sidebarHover);
  root.style.setProperty('--sidebar-active', merged.sidebarActive);
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(PRESET_THEMES[0]);
  const [customColors, setCustomColorsState] = useState<Partial<ColorTheme>>({});
  const [density, setDensityState] = useState<Density>('comfortable');
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedThemeMode = localStorage.getItem('resolv-theme-mode');
    if (storedThemeMode === 'light' || storedThemeMode === 'dark') {
      setThemeModeState(storedThemeMode);
      setResolvedTheme(storedThemeMode);
    } else {
      // Backwards compat: migrate 'system' to 'dark'
      const oldTheme = localStorage.getItem('resolv-theme') as 'light' | 'dark' | null;
      if (oldTheme === 'light' || oldTheme === 'dark') {
        setThemeModeState(oldTheme);
        setResolvedTheme(oldTheme);
      }
    }

    const storedColorThemeId = localStorage.getItem('resolv-color-theme');
    if (storedColorThemeId) {
      const found = PRESET_THEMES.find((t) => t.id === storedColorThemeId);
      if (found) {
        setColorThemeState(found);
      }
    }

    const storedCustomColors = localStorage.getItem('resolv-custom-colors');
    if (storedCustomColors) {
      try {
        const parsed = JSON.parse(storedCustomColors);
        setCustomColorsState(parsed);
      } catch { /* ignore */ }
    }

    const storedDensity = localStorage.getItem('resolv-density') as Density | null;
    if (storedDensity === 'comfortable' || storedDensity === 'compact') {
      setDensityState(storedDensity);
    }

    const storedAnimations = localStorage.getItem('resolv-animations');
    if (storedAnimations !== null) {
      setAnimationsEnabledState(storedAnimations === 'true');
    }

    setMounted(true);
  }, []);

  // Apply dark/light class
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme, mounted]);

  // Apply density class
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('density-comfortable', 'density-compact');
    root.classList.add(`density-${density}`);
    localStorage.setItem('resolv-density', density);
  }, [density, mounted]);

  // Apply animations class
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (animationsEnabled) {
      root.classList.remove('reduce-motion');
    } else {
      root.classList.add('reduce-motion');
    }
    localStorage.setItem('resolv-animations', String(animationsEnabled));
  }, [animationsEnabled, mounted]);

  // Apply color theme CSS variables
  useEffect(() => {
    if (!mounted) return;
    applyColorTheme(colorTheme, customColors);
    localStorage.setItem('resolv-color-theme', colorTheme.id);
    localStorage.setItem('resolv-custom-colors', JSON.stringify(customColors));
  }, [colorTheme, customColors, mounted]);

  // Save theme mode
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('resolv-theme-mode', themeMode);
    localStorage.setItem('resolv-theme', resolvedTheme); // backwards compat
  }, [themeMode, resolvedTheme, mounted]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setResolvedTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeModeState(newMode);
    setResolvedTheme(newMode);
  }, [resolvedTheme]);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    setCustomColorsState({}); // Reset custom colors when switching preset
  }, []);

  const setCustomColors = useCallback((colors: Partial<ColorTheme>) => {
    setCustomColorsState((prev) => ({ ...prev, ...colors }));
  }, []);

  const setAccentColor = useCallback((color: string, hover: string) => {
    const matchingPreset = PRESET_THEMES.find((t) => t.accent === color);
    if (matchingPreset) {
      setColorThemeState(matchingPreset);
      setCustomColorsState({});
    } else {
      setCustomColorsState((prev) => ({ ...prev, accent: color, accentHover: hover, sidebarActive: color }));
    }
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
  }, []);

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    setAnimationsEnabledState(enabled);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{
      themeMode,
      setThemeMode,
      resolvedTheme,
      theme: resolvedTheme,
      toggleTheme,
      colorTheme,
      setColorTheme,
      customColors,
      setCustomColors,
      setAccentColor,
      density,
      setDensity,
      animationsEnabled,
      setAnimationsEnabled,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
