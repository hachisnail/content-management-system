import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';

const ThemeContext = createContext();

// [FIX] Aligned exactly with web/src/index.css configuration
export const ACTIVE_THEMES = [
  "light", 
  "dark", 
  "black", 
  "luxury", 
  "business", 
  "dim", 
  "coffee", 
  "night", 
  "cmyk", 
  "nord", 
  "pastel", 
  "halloween", 
  "dracula"
];

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Default to 'light' or whatever is in localStorage
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });

  // Apply theme to HTML tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Sync with User Preference upon Login
  useEffect(() => {
    if (user?.theme) {
      // Ensure the user's saved theme is actually supported, else fallback
      if (ACTIVE_THEMES.includes(user.theme)) {
        setThemeState(user.theme);
      }
    }
  }, [user]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: ACTIVE_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);