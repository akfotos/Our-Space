import { useEffect, useRef, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebaseConfig';
import { Lock, Fingerprint, LogOut } from 'lucide-react';

const LOCK_MS = 10 * 60 * 1000;
const LOCKED_KEY = 'our-space-locked';
const LAST_KEY = 'our-space-last-activity';
const BIO_KEY = 'our-space-biometric-id';

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function supportsBiometric() {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

function ScreenLock() {
  const { user, signOut } = useAuth();
  const [locked, setLocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LOCKED_KEY) === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hasCredential, setHasCredential] = useState(false);
  const [bioError, setBioError] = useState('');
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = Number(localStorage.getItem(LAST_KEY));
    if (stored && Date.now() - stored > LOCK_MS) {
      setLocked(true);
      localStorage.setItem(LOCKED_KEY, 'true');
    }
    setHasCredential(!!localStorage.getItem(BIO_KEY));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const update = () => {
      lastActivityRef.current = Date.now();
      localStorage.setItem(LAST_KEY, lastActivityRef.current);
    };

    events.forEach((e) => window.addEventListener(e, update));
    update();

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > LOCK_MS) {
        setLocked(true);
        localStorage.setItem(LOCKED_KEY, 'true');
      }
    }, 5000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, update));
      clearInterval(interval);
    };
  }, [user]);

  const unlock = () => {
    setLocked(false);
    setPassword('');
    setError('');
    setBioError('');
    lastActivityRef.current = Date.now();
    localStorage.setItem(LOCKED_KEY, 'false');
    localStorage.setItem(LAST_KEY, lastActivityRef.current);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await signInWithEmailAndPassword(auth, user.email, password);
      unlock();
    } catch {
      setError('Incorrect password. Try again.');
    }
  };

  const handleBiometric = async () => {
    if (!supportsBiometric()) {
      setBioError('Your device/browser does not support face or fingerprint unlock.');
      return;
    }

    const storedId = localStorage.getItem(BIO_KEY);
    if (storedId) {
      try {
        const rawId = base64urlToBuffer(storedId);
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const publicKey = {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [{ id: rawId, type: 'public-key', transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60000,
        };
        const cred = await navigator.credentials.get({ publicKey });
        if (cred) unlock();
      } catch {
        setBioError('Biometric unlock failed. Use your password.');
      }
      return;
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(user.uid);
      const publicKey = {
        challenge,
        rp: { name: 'Our Space', id: window.location.hostname },
        user: { id: userId, name: user.email || user.uid, displayName: user.displayName || 'Our Space user' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };
      const cred = await navigator.credentials.create({ publicKey });
      if (cred) {
        localStorage.setItem(BIO_KEY, bufferToBase64url(cred.rawId));
        setHasCredential(true);
        unlock();
      }
    } catch {
      setBioError('Could not set up biometric unlock. Use your password.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem(LOCKED_KEY);
    localStorage.removeItem(LAST_KEY);
    localStorage.removeItem(BIO_KEY);
  };

  if (!locked || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-rose-50/95 backdrop-blur-xl p-6">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl text-center animate-pop-in">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
          <Lock size={32} className="text-rose-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-700 mb-1">App Locked</h2>
        <p className="text-sm text-slate-500 mb-6">
          Enter your password to unlock, or use your device&apos;s face/fingerprint.
        </p>

        <form onSubmit={handlePassword} className="space-y-3 mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your account password"
            className="w-full rounded-xl border border-white/30 bg-white/40 px-4 py-2.5 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          {error && <p className="text-sm text-red-600 text-left">{error}</p>}
          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold transition"
          >
            Unlock with Password
          </button>
        </form>

        {supportsBiometric() && (
          <button
            type="button"
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/40 hover:bg-white/60 text-slate-700 rounded-xl font-semibold transition mb-3"
          >
            <Fingerprint size={18} className="text-rose-600" />
            {hasCredential ? 'Unlock with Face/Fingerprint' : 'Set up Face/Fingerprint'}
          </button>
        )}
        {bioError && <p className="text-sm text-red-600 mb-3">{bioError}</p>}

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-1.5 mx-auto text-sm text-slate-500 hover:text-rose-600 transition"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default ScreenLock;
