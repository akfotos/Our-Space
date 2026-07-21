import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { REUNION_DATE } from '../config';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCouple } from './CoupleContext';

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
  showBibleVerse: true,
  faceLock: false,
};

const SYNCED_KEYS = [
  'reunionDate',
  'showSeconds',
  'showWeather',
  'showQuote',
  'showDistance',
  'showAffirmations',
  'showCheckIn',
  'showMissYou',
  'showBibleVerse',
];

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
  const remoteRef = useRef({});
  const { coupleId } = useCouple();

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser || !coupleId) return;
    const settingsDoc = doc(db, 'couples', coupleId, 'settings', 'shared');
    const unsub = onSnapshot(settingsDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        remoteRef.current = data;
        setSettingsState((prev) => {
          const next = { ...prev };
          for (const key of SYNCED_KEYS) {
            if (data[key] !== undefined && data[key] !== prev[key]) {
              next[key] = data[key];
            }
          }
          return next;
        });
      } else {
        remoteRef.current = {};
      }
      setLoaded(true);
    });
    return unsub;
  }, [currentUser, coupleId]);

  useEffect(() => {
    if (!loaded || !currentUser || !coupleId) return;
    const diff = {};
    for (const key of SYNCED_KEYS) {
      if (settings[key] !== undefined && settings[key] !== remoteRef.current[key]) {
        diff[key] = settings[key];
      }
    }
    if (Object.keys(diff).length > 0) {
      setDoc(doc(db, 'couples', coupleId, 'settings', 'shared'), diff, { merge: true }).catch(
        () => {}
      );
    }
  }, [settings, loaded, currentUser, coupleId]);

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
