import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { REUNION_DATE } from '../config';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
  faceLock: false,
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const settingsRef = useRef(settings);
  const remoteDateRef = useRef(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'settings', 'shared'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        remoteDateRef.current = data.reunionDate || null;
        if (data.reunionDate && data.reunionDate !== settingsRef.current.reunionDate) {
          setSettingsState((prev) => ({ ...prev, reunionDate: data.reunionDate }));
        }
      } else {
        remoteDateRef.current = null;
      }
      setLoaded(true);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!loaded || !currentUser) return;
    if (settings.reunionDate && settings.reunionDate !== remoteDateRef.current) {
      setDoc(doc(db, 'settings', 'shared'), { reunionDate: settings.reunionDate }, { merge: true }).catch(
        () => {}
      );
    }
  }, [settings.reunionDate, loaded, currentUser]);

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
