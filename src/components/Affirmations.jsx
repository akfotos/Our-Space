import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Send } from 'lucide-react';

function formatTime(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Affirmations() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'affirmations'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, 'affirmations'), {
      uid: user.uid,
      name: user.displayName,
      text: text.trim(),
      timestamp: serverTimestamp(),
    });
    setText('');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl transition hover:scale-[1.01] animate-fade-in-up [animation-delay:0.5s]">
      <Heart
        size={56}
        className="absolute -top-3 -right-3 text-rose-200/30 rotate-12"
      />
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700/70 mb-4 flex items-center gap-2">
        <Heart size={18} className="fill-rose-600 text-rose-600" />
        Love Affirmations
      </h2>

      <form onSubmit={handleSubmit} className="mb-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Write a longer message about how much you love each other…"
          className="w-full rounded-2xl border border-white/30 bg-white/40 p-4 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-medium transition hover:scale-105 shadow-lg"
        >
          <Send size={16} />
          Send Affirmation
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading affirmations…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          No affirmations yet. Write the first one!
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-sm"
            >
              <p className="text-slate-700 leading-relaxed italic">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-700">{item.name}</span>
                <span className="text-slate-500">{formatTime(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Affirmations;
