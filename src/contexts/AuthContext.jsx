import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, provider } from '../firebaseConfig';

function getAuthErrorMessage(err) {
  const code = err?.code;
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase sign-in. Add akfotos.github.io to Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Enable Google or Email/Password in Firebase Console > Authentication > Sign-in method.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return err?.message || 'An unexpected sign-in error occurred.';
  }
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const signInWithEmail = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const signUpWithEmail = async (name, email, password) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
    } catch (err) {
      setError(getAuthErrorMessage(err));
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
    signUpWithEmail,
    signOut: signOutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
