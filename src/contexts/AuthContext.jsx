import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, provider } from '../firebaseConfig';
import { ALLOWED_EMAILS, USERS } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && ALLOWED_EMAILS.includes(u.email)) {
        const label = u.email === USERS.A.email ? USERS.A.name : USERS.B.name;
        setUser({ ...u, displayName: label });
      } else if (u) {
        fbSignOut(auth);
        setUser(null);
        setError('This email is not allowed. Only Emmanuel and Sarah can use this app.');
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      if (!ALLOWED_EMAILS.includes(result.user.email)) {
        await fbSignOut(auth);
        setError('This email is not allowed. Only Emmanuel and Sarah can use this app.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const signInWithEmail = async (email, password) => {
    setError(null);
    if (!ALLOWED_EMAILS.includes(email)) {
      setError('This email is not allowed. Only Emmanuel and Sarah can use this app.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const signOutUser = async () => {
    await fbSignOut(auth);
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signInWithEmail,
    signOut: signOutUser,
    allowedEmails: ALLOWED_EMAILS,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
