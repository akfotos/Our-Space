import { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from './AuthContext';
import { USERS } from '../config';

const PresenceContext = createContext(null);

function getUserKey(email) {
  return email?.toLowerCase() === USERS.A.email.toLowerCase() ? 'A' : 'B';
}

export function PresenceProvider({ children }) {
  const { user } = useAuth();
  const [presence, setPresence] = useState({});

  useEffect(() => {
    if (!user) return;

    const key = getUserKey(user.email);
    const presenceRef = ref(rtdb, `presence/${key}`);
    const dc = onDisconnect(presenceRef);

    dc.set({
      online: false,
      lastSeen: serverTimestamp(),
      name: user.displayName,
    }).catch(() => {});

    set(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      name: user.displayName,
    }).catch(() => {});

    const handleOnline = () => {
      set(presenceRef, {
        online: true,
        lastSeen: serverTimestamp(),
        name: user.displayName,
      }).catch(() => {});
    };

    const handleOffline = () => {
      set(presenceRef, {
        online: false,
        lastSeen: serverTimestamp(),
        name: user.displayName,
      }).catch(() => {});
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsub = onValue(ref(rtdb, 'presence'), (snap) => {
      setPresence(snap.val() || {});
    });

    return () => {
      dc.cancel().catch(() => {});
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, [user]);

  return <PresenceContext.Provider value={presence}>{children}</PresenceContext.Provider>;
}

export const usePresence = () => useContext(PresenceContext);
