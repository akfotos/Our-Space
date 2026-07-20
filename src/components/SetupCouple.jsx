import { useState } from 'react';
import { useCouple } from '../contexts/CoupleContext';

function SetupCouple() {
  const { createCouple, joinCouple, error, loading } = useCouple();
  const [code, setCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const handleCreate = async () => {
    const newCode = await createCouple();
    if (newCode) setCreatedCode(newCode);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    await joinCouple(code);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl text-center animate-pop-in">
        <h2 className="text-2xl font-black text-slate-700 mb-2">Set up your space</h2>
        <p className="text-sm text-slate-500 mb-6">
          Create a couple code for your partner to join, or enter their code below.
        </p>

        {createdCode && (
          <div className="mb-5 p-4 bg-green-50 rounded-2xl text-green-700">
            <p className="text-sm font-medium">Share this code with your partner</p>
            <p className="text-2xl font-black tracking-widest">{createdCode}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold transition mb-4"
        >
          {loading ? 'Creating…' : 'Create a couple code'}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white/80 px-2 text-slate-400">or</span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter couple code"
            maxLength={6}
            className="w-full rounded-xl border border-white/30 bg-white/40 px-4 py-2.5 text-center text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-300 font-bold tracking-widest"
          />
          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full py-3 px-4 bg-white/40 hover:bg-white/60 text-slate-700 rounded-xl font-semibold transition"
          >
            {loading ? 'Joining…' : 'Join couple'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default SetupCouple;
