import { createContext, useContext, useEffect, useState } from 'react';
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

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function CoupleProvider({ children }) {
  const { user } = useAuth();
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setCouple(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, async (snap) => {
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Partner',
          createdAt: serverTimestamp(),
        }).catch(() => {});
        setCouple(null);
        setLoading(false);
        return;
      }

      const userData = snap.data();
      if (!userData.coupleId) {
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
    });

    return unsub;
  }, [user]);

  const createCouple = async () => {
    if (!user) return;
    setError('');
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

      if (data.members && data.members.length >= 2) {
        setError('This couple already has two members.');
        return false;
      }

      const name = user.displayName || user.email?.split('@')[0] || 'Partner';
      await setDoc(doc(db, 'users', user.uid), { coupleId: clean }, { merge: true });
      await updateDoc(coupleRef, {
        members: [...(data.members || []), { uid: user.uid, email: user.email, name }],
      });
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
