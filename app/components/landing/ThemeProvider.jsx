'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lp-theme') || 'dark';
    setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const landing = document.querySelector('[data-landing="true"]');
      if (landing) landing.setAttribute('data-theme', theme);
      localStorage.setItem('lp-theme', theme);
    }
  }, [theme, mounted]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--lp-surface)]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--lp-text-muted)' }} /> : <Moon size={18} style={{ color: 'var(--lp-text-muted)' }} />}
    </button>
  );
}
