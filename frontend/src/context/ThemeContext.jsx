import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const themes = {
  blue: {
    name: 'blue',
    primary: '#FFD700', // gold
    secondary: '#FFA500', // gold2
    dark: '#0A1628',
    darker: '#050A14',
    accent: '#00FFFF', // cyan
    text: '#E8F4FF',
    textSecondary: '#7A9BBF',
    glow: 'rgba(255, 215, 0, 0.4)',
  },
  gold: {
    name: 'gold',
    primary: '#00FF88', // green
    secondary: '#00FFFF', // cyan
    dark: '#0A1628',
    darker: '#050A14',
    accent: '#FFD700',
    text: '#E8F4FF',
    textSecondary: '#7A9BBF',
    glow: 'rgba(0, 255, 136, 0.4)',
  },
  green: {
    name: 'green',
    primary: '#00FF88',
    secondary: '#00FFFF',
    dark: '#0A1628',
    darker: '#050A14',
    accent: '#FFD700',
    text: '#E8F4FF',
    textSecondary: '#7A9BBF',
    glow: 'rgba(0, 255, 136, 0.4)',
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('blue');

  const currentTheme = themes[theme];

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setTheme(themeName);
      localStorage.setItem('theme', themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeName: theme, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
