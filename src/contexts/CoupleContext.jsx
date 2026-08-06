import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const CoupleContext = createContext(null);
const ONBOARDING_KEY = 'our-space-onboarding';

function loadOnboarding() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearOnboarding() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function CoupleProvider({ children }) {
  const { user } = useAuth();
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setCouple(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      async (snap) => {
        try {
          if (!snap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'Partner',
              createdAt: serverTimestamp(),
            }).catch(() => {});
            return;
          }

          const userData = snap.data() || {};
          if (!userData.coupleId) {
            const onboarding = loadOnboarding();
            if (onboarding && !creatingRef.current) {
              creatingRef.current = true;
              await createFromOnboarding(user, onboarding).finally(() => {
                creatingRef.current = false;
              });
            }
            setCouple(null);
            setLoading(false);
            return;
          }

          const coupleRef = doc(db, 'couples', userData.coupleId);
          const coupleSnap = await getDoc(coupleRef);
          if (coupleSnap.exists()) {
            setCouple({ id: coupleSnap.id, ...coupleSnap.data() });
          } else {
            setCouple(null);
          }
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to load couple data.');
          setCouple(null);
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message || 'Permission denied loading user data.');
        setCouple(null);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const createFromOnboarding = async (currentUser, onboarding) => {
    const code = generateCode();
    const coupleRef = doc(db, 'couples', code);
    const myName = currentUser.displayName || onboarding.myName || currentUser.email?.split('@')[0] || 'Partner';

    try {
      await setDoc(doc(db, 'users', currentUser.uid), { coupleId: code }, { merge: true });
      await setDoc(coupleRef, {
        code,
        members: [
          { uid: currentUser.uid, email: currentUser.email, name: myName },
          { name: onboarding.partnerName || 'Partner' },
        ],
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'couples', code, 'settings', 'shared'), { reunionDate: onboarding.reunionDate }, { merge: true });

      if (onboarding.location) {
        await setDoc(doc(db, 'userLocations', currentUser.uid), {
          ...onboarding.location,
          name: myName,
          email: currentUser.email,
          coupleId: code,
          timestamp: serverTimestamp(),
        }, { merge: true });
      }

      clearOnboarding();
      return code;
    } catch (err) {
      setError(err.message || 'Could not create couple from onboarding.');
      return null;
    }
  };

  const createCouple = async () => {
    if (!user) return;
    setError('');
    const onboarding = loadOnboarding();
    if (onboarding) return createFromOnboarding(user, onboarding);

    const code = generateCode();
    const coupleRef = doc(db, 'couples', code);
    const name = user.displayName || user.email?.split('@')[0] || 'Partner';

    try {
      await setDoc(doc(db, 'users', user.uid), { coupleId: code }, { merge: true });
      await setDoc(coupleRef, {
        code,
        members: [
          { uid: user.uid, email: user.email, name },
        ],
        createdAt: serverTimestamp(),
      });
      return code;
    } catch (err) {
      setError(err.message || 'Could not create couple.');
      return null;
    }
  };

  const joinCouple = async (code) => {
    if (!user || !code?.trim()) return;
    setError('');
    const clean = code.trim().toUpperCase();
    const coupleRef = doc(db, 'couples', clean);

    try {
      const snap = await getDoc(coupleRef);
      if (!snap.exists()) {
        setError('Couple code not found. Check the code and try again.');
        return false;
      }

      const data = snap.data();
      if (data.members?.some((m) => m.uid === user.uid)) {
        await setDoc(doc(db, 'users', user.uid), { coupleId: clean }, { merge: true });
        return true;
      }

      if (data.members && data.members.length >= 2 && data.members.every((m) => m.uid)) {
        setError('This couple already has two members.');
        return false;
      }

      const name = user.displayName || user.email?.split('@')[0] || 'Partner';
      const pendingIndex = data.members?.findIndex((m) => !m.uid);
      let members;
      if (pendingIndex >= 0) {
        members = data.members.map((m, i) => (i === pendingIndex ? { ...m, uid: user.uid, email: user.email, name } : m));
      } else {
        members = [...(data.members || []), { uid: user.uid, email: user.email, name }];
      }

      await setDoc(doc(db, 'users', user.uid), { coupleId: clean }, { merge: true });
      await updateDoc(coupleRef, { members });
      return true;
    } catch (err) {
      setError(err.message || 'Could not join couple.');
      return false;
    }
  };

  const updateMemberName = async (name) => {
    if (!user || !couple) return;
    const members = couple.members.map((m) =>
      m.uid === user.uid ? { ...m, name: name.trim() || m.name } : m
    );
    await updateDoc(doc(db, 'couples', couple.id), { members }).catch(() => {});
  };

  const members = couple?.members || [];
  const myProfile = members.find((m) => m.uid === user?.uid);
  const partner = members.find((m) => m.uid !== user?.uid);

  return (
    <CoupleContext.Provider
      value={{
        couple,
        coupleId: couple?.id || null,
        members,
        myProfile,
        partner,
        loading,
        error,
        createCouple,
        joinCouple,
        updateMemberName,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
}

export const useCouple = () => useContext(CoupleContext);
