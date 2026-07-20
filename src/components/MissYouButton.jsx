import { Heart, Send } from 'lucide-react';
import { useChat } from '../hooks/useChat';

function MissYouButton() {
  const { sendMissYou, missYou } = useChat();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl transition hover:scale-[1.02] flex flex-col items-center justify-center text-center">
      <Heart
        size={64}
        className="absolute -top-4 -right-4 text-rose-200/30 rotate-12"
      />
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700/70 mb-3">
        Send a Little Love
      </h2>
      <p className="text-sm text-slate-600 mb-5 max-w-xs">
        Tap to send a heartbeat ping and let them know you&apos;re thinking of them.
      </p>
      <button
        onClick={sendMissYou}
        className="group relative px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-rose-500/40 transition-all hover:scale-105 active:scale-95"
      >
        <span className="flex items-center gap-2">
          <Heart
            size={22}
            className="fill-white group-hover:animate-pulse"
          />
          Miss You
          <Send size={18} className="opacity-70" />
        </span>
      </button>
      {missYou && (
        <div className="mt-4 px-4 py-2 rounded-full bg-rose-100/70 backdrop-blur-sm border border-white/30 text-sm text-rose-700 font-medium animate-pop-in">
          {missYou.from} sent a {'miss you'} ping!
        </div>
      )}
    </section>
  );
}

export default MissYouButton;
