import { useEffect, useState } from 'react';

/**
 * useDarkMode hook
 * Manages dark mode theme state with localStorage persistence
 * Applies 'dark' class to HTML element for Tailwind dark mode support
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme-mode');
    if (stored === 'dark' || stored === 'light') {
      return stored === 'dark';
    }

    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply/remove dark class from HTML element
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    // Save preference to localStorage
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  return { isDark, toggleDarkMode };
};

export default useDarkMode;
