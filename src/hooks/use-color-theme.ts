"use client";

import { useCallback, useEffect, useState } from 'react';

export interface ColorHue {
  name: string;
  hue: number;
  label: string;
}

export const COLOR_HUES: ColorHue[] = [
  { name: 'blue', hue: 240, label: 'Bleu' },
  { name: 'emerald', hue: 162.68, label: 'Émeraude' },
  { name: 'orange', hue: 70, label: 'Orange' },
  { name: 'purple', hue: 270, label: 'Violet' },
  { name: 'red', hue: 25, label: 'Rouge' },
  { name: 'green', hue: 120, label: 'Vert' },
];

export interface UseColorThemeReturn {
  currentTheme: ColorHue;
  setColorTheme: (theme: ColorHue) => void;
}

export function useColorTheme(): UseColorThemeReturn {
  const [currentTheme, setCurrentTheme] = useState<ColorHue>(COLOR_HUES[0]);

  // Fonction pour appliquer une couleur
  const applyColorTheme = useCallback((theme: ColorHue) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    // Seul --primary-hue est défini ici. --secondary-hue est calculé
    // automatiquement par le CSS (mod(calc(var(--primary-hue) + X), 360))
    // selon l'option décommentée dans globals.css.
    root.style.setProperty('--primary-hue', theme.hue.toString());
    
    setCurrentTheme(theme);
  }, []);

  // Fonction pour changer de thème
  const setColorTheme = useCallback((theme: ColorHue) => {
    applyColorTheme(theme);
    // Sauvegarder immédiatement quand l'utilisateur change le thème
    if (typeof window !== 'undefined') {
      localStorage.setItem('color-theme', theme.name);
    }
  }, [applyColorTheme]);

  // Initialisation au montage - UNE SEULE FOIS
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('color-theme');
      if (savedTheme) {
        const theme = COLOR_HUES.find(t => t.name === savedTheme);
        applyColorTheme(theme ?? COLOR_HUES[0]);
      } else {
        applyColorTheme(COLOR_HUES[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du thème:', error);
      applyColorTheme(COLOR_HUES[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    currentTheme,
    setColorTheme,
  };
}
