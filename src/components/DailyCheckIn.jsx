import { useEffect, useState } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { Smile, Frown, Meh, Heart } from 'lucide-react';

const MOODS = [
  { key: 'great', label: 'Great', icon: Heart, color: 'text-rose-600' },
  { key: 'good', label: 'Good', icon: Smile, color: 'text-amber-500' },
  { key: 'okay', label: 'Okay', icon: Meh, color: 'text-slate-500' },
  { key: 'missing', label: 'Missing you', icon: Frown, color: 'text-blue-500' },
];

function getTodayId() {
  return new Date().toISOString().slice(0, 10);
}

function DailyCheckIn() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

  const docRef = coupleId ? doc(db, 'couples', coupleId, 'dailyCheckIn', getTodayId()) : null;

  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(docRef, (snap) => {
      setToday(snap.exists() ? snap.data() : {});
      setLoading(false);
    });
    return unsub;
  }, [docRef]);

  const handleMood = async (mood) => {
    if (!docRef) return;
    const current = today || {};
    const updates = {
      ...current,
      [user.uid]: {
        mood,
        name: user.displayName,
        email: user.email,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, updates, { merge: true });
  };

  if (loading) return (
    <section className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl">
      <p className="text-sm text-slate-500">Loading check-in…</p>
    </section>
  );

  const myMood = today?.[user.uid]?.mood;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl transition hover:scale-[1.02]">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700/70 mb-4">
        Daily Check-in
      </h2>
      <div className="flex flex-wrap gap-2">
        {MOODS.map(({ key, label, icon: Icon, color }) => {
          const active = myMood === key;
          return (
            <button
              key={key}
              onClick={() => handleMood(key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105 ${
                active
                  ? 'bg-rose-600/90 backdrop-blur-sm text-white shadow-md'
                  : 'bg-white/40 border border-white/30 hover:bg-white/60 text-slate-600'
              }`}
            >
              <Icon size={18} className={active ? color : 'opacity-70'} />
              {label}
            </button>
          );
        })}
      </div>
      {today && Object.keys(today).some((k) => k !== 'updatedAt') && (
        <div className="mt-5 pt-4 border-t border-white/30 space-y-2">
          {Object.entries(today)
            .filter(([key]) => key !== 'updatedAt')
            .map(([uid, data]) => (
              <p key={uid} className="text-sm text-slate-700">
                <span className="font-semibold text-rose-700">{data.name}</span> is feeling{' '}
                <span className="capitalize font-medium">{data.mood}</span>
              </p>
            ))}
        </div>
      )}
    </section>
  );
}

export default DailyCheckIn;
