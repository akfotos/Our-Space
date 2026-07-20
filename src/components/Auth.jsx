import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Auth() {
  const { user, loading, error, signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      </div>
    </div>
  );
}

export default Auth;
