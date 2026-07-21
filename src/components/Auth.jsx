import { useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPosition, getLocationLabel } from '../utils/geo';

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

function saveOnboarding(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
}

function clearOnboarding() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
}

function defaultReunionDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function Auth() {
  const { user, loading, error, signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [step, setStep] = useState(() => (loadOnboarding() ? 'auth' : 'setup'));
  const [onboarding, setOnboarding] = useState(() => loadOnboarding() || {
    myName: '',
    partnerName: '',
    reunionDate: defaultReunionDate(),
    location: null,
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState(onboarding.myName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [locating, setLocating] = useState(false);

  const handleSetup = (e) => {
    e.preventDefault();
    saveOnboarding(onboarding);
    setName(onboarding.myName);
    setStep('auth');
  };

  const handleDetectLocation = async () => {
    setLocating(true);
    try {
      const pos = await getPosition();
      const { latitude, longitude } = pos.coords;
      const [location, timezone] = await Promise.all([
        getLocationLabel(latitude, longitude),
        Promise.resolve(Intl.DateTimeFormat().resolvedOptions().timeZone),
      ]);
      setOnboarding((prev) => ({
        ...prev,
        location: { lat: latitude, lon: longitude, location, timezone },
      }));
    } catch {
      setOnboarding((prev) => ({ ...prev, location: null }));
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      await signUpWithEmail(name, email, password);
    } else {
      await signInWithEmail(email, password);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-rose-600">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-rose-600">Welcome, {user.displayName}</h1>
          <p className="mt-2 text-slate-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-8 text-center border border-rose-100">
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="Our Space"
            className="h-20 w-auto mx-auto mb-4 rounded-2xl"
          />
          <h1 className="text-3xl font-bold text-rose-600 mb-2">Set up your space</h1>
          <p className="text-slate-600 mb-6">Personalize things for you and your partner.</p>
          <form onSubmit={handleSetup} className="space-y-4 text-left">
            <div>
              <label htmlFor="myName" className="block text-sm font-medium text-slate-700">Your name</label>
              <input
                id="myName"
                type="text"
                value={onboarding.myName}
                onChange={(e) => setOnboarding((p) => ({ ...p, myName: e.target.value }))}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label htmlFor="partnerName" className="block text-sm font-medium text-slate-700">Partner&apos;s name</label>
              <input
                id="partnerName"
                type="text"
                value={onboarding.partnerName}
                onChange={(e) => setOnboarding((p) => ({ ...p, partnerName: e.target.value }))}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label htmlFor="reunionDate" className="block text-sm font-medium text-slate-700">
                <Calendar size={14} className="inline mr-1" /> Next reunion
              </label>
              <input
                id="reunionDate"
                type="datetime-local"
                value={onboarding.reunionDate}
                onChange={(e) => setOnboarding((p) => ({ ...p, reunionDate: e.target.value }))}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <MapPin size={16} />
                {locating ? 'Detecting…' : onboarding.location ? 'Update my location' : 'Use my current location'}
              </button>
              {onboarding.location && (
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={12} /> {onboarding.location.location}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!onboarding.myName || !onboarding.partnerName || !onboarding.reunionDate}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl font-medium transition"
            >
              Continue to account
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              clearOnboarding();
              setStep('auth');
            }}
            className="mt-4 text-sm text-rose-600 hover:underline"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center border border-rose-100">
        <img
          src={`${import.meta.env.BASE_URL}Logo.png`}
          alt="Our Space"
          className="h-20 w-auto mx-auto mb-4 rounded-2xl"
        />
        <h1 className="text-3xl font-bold text-rose-600 mb-2">Our Space</h1>
        <p className="text-slate-600 mb-6">A private place for you and your partner.</p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email || !password || (isSignUp && !name)}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl font-medium transition"
          >
            {isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
          className="mt-4 text-sm text-rose-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">or</span>
          </div>
        </div>

        <button
          onClick={signIn}
          className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition"
        >
          Sign in with Google
        </button>

        <button
          type="button"
          onClick={() => setStep('setup')}
          className="mt-4 text-sm text-slate-500 hover:text-rose-600"
        >
          Back to setup
        </button>
      </div>
    </div>
  );
}

export default Auth;
