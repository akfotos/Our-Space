import { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from './AuthContext';
import { useCouple } from './CoupleContext';

const PresenceContext = createContext(null);

export function PresenceProvider({ children }) {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const [presence, setPresence] = useState({});

  useEffect(() => {
    if (!user || !coupleId) return;

    const presenceRef = ref(rtdb, `presence/${coupleId}/${user.uid}`);
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

    const unsub = onValue(ref(rtdb, `presence/${coupleId}`), (snap) => {
      setPresence(snap.val() || {});
    });

    return () => {
      dc.cancel().catch(() => {});
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, [user, coupleId]);

  return <PresenceContext.Provider value={presence}>{children}</PresenceContext.Provider>;
}

export const usePresence = () => useContext(PresenceContext);
