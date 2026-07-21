import { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

function WelcomeScreen({ user, onComplete }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setLeaving(true), 1800);
    const completeTimer = window.setTimeout(onComplete, 2400);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const firstName = (user?.displayName || 'Love').trim().split(/\s+/)[0];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-rose-100 transition-all duration-700 ${
        leaving ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-rose-300/40 blur-3xl animate-pulse-soft" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-rose-400/30 blur-3xl animate-pulse-soft [animation-delay:0.5s]" />
      <Sparkles className="absolute left-[18%] top-[22%] text-rose-400 animate-float" size={28} />
      <Sparkles className="absolute bottom-[24%] right-[18%] text-rose-300 animate-float [animation-delay:0.8s]" size={22} />
      <div className="relative px-6 text-center animate-welcome-in">
        <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-[2rem] bg-white/70 shadow-2xl shadow-rose-300/30 backdrop-blur-xl border border-white/60">
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="Our Space"
            className="h-24 w-auto rounded-2xl animate-logo-reveal"
          />
          <Heart
            size={28}
            className="absolute -bottom-3 -right-3 fill-rose-500 text-rose-500 drop-shadow-md animate-heart-beat"
          />
        </div>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.35em] text-rose-500">Welcome home</p>
        <h1 className="text-4xl font-black text-slate-800 sm:text-5xl">
          Hi, <span className="text-rose-600">{firstName}</span>
        </h1>
        <p className="mt-3 text-lg text-slate-600">Your space is ready.</p>
        <div className="mx-auto mt-7 h-1 w-36 overflow-hidden rounded-full bg-rose-100">
          <div className="h-full rounded-full bg-rose-500 animate-welcome-progress" />
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
