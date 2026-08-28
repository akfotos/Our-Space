import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AuthContext = createContext(null);

function getAuthErrorMessage(err) {
  if (err?.code === 'auth/operation-not-allowed') {
    return 'Automatic access is not enabled yet. Enable Anonymous sign-in in Firebase Authentication.';
  }
  if (err?.code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and refresh the page.';
  }
  return err?.message || 'Could not open your space. Please refresh and try again.';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let signingIn = false;
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setError(null);
        setLoading(false);
        return;
      }
      if (signingIn) return;
      signingIn = true;
      setLoading(true);
      try {
        await signInAnonymously(auth);
      } catch (err) {
        setError(getAuthErrorMessage(err));
        setLoading(false);
      } finally {
        signingIn = false;
      }
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
