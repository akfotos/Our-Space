import { createContext, useContext, useEffect, useState } from 'react';
import { REUNION_DATE } from '../config';

const defaults = {
  darkMode: false,
  reunionDate: REUNION_DATE.toISOString(),
  showSeconds: true,
  showWeather: true,
  showQuote: true,
  showDistance: true,
  showAffirmations: true,
  showCheckIn: true,
  showMissYou: true,
};

function loadSettings() {
  if (typeof window === 'undefined') return defaults;
  try {
    const stored = localStorage.getItem('our-space-settings');
    const parsed = stored ? JSON.parse(stored) : {};
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadSettings());

  useEffect(() => {
    localStorage.setItem('our-space-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const setSetting = (key, value) =>
    setSettingsState((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsContext.Provider value={{ settings, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
