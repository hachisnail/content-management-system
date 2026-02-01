import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';

const ThemeContext = createContext();

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
  // (Assuming user object might have a 'theme' property in the future, 
  // or we just rely on local persistence per user session if needed)
  useEffect(() => {
    if (user?.theme) {
      setThemeState(user.theme);
    }
  }, [user]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);