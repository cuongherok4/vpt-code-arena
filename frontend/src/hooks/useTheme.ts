import { useCallback, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'vpt-theme';

function getInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
