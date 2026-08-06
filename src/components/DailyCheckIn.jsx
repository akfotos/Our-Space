import { useEffect, useMemo, useState } from 'react';
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
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function DailyCheckIn() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const [todayId, setTodayId] = useState(getTodayId);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingMood, setSavingMood] = useState('');
  const [error, setError] = useState('');

  const docRef = useMemo(
    () => (coupleId ? doc(db, 'couples', coupleId, 'dailyCheckIn', todayId) : null),
    [coupleId, todayId]
  );

  useEffect(() => {
    const updateDate = () => setTodayId(getTodayId());
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(updateDate, nextMidnight.getTime() - now.getTime() + 1000);
    window.addEventListener('focus', updateDate);
    document.addEventListener('visibilitychange', updateDate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', updateDate);
      document.removeEventListener('visibilitychange', updateDate);
    };
  }, [todayId]);

  useEffect(() => {
    if (!docRef) {
      setToday({});
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setToday(null);
    setError('');
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        setToday(snap.exists() ? snap.data() : {});
        setLoading(false);
      },
      () => {
        setError('Could not load today’s check-in. Please try again.');
        setLoading(false);
      }
    );
    return unsub;
  }, [docRef]);

  const handleMood = async (mood) => {
    if (!docRef || !user || savingMood) return;
    setSavingMood(mood);
    setError('');
    try {
      await setDoc(docRef, {
        [user.uid]: {
          mood,
          name: user.displayName || user.email?.split('@')[0] || 'Partner',
          email: user.email,
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch {
      setError('Could not save your check-in. Please try again.');
    } finally {
      setSavingMood('');
    }
  };

  if (loading) return (
    <section className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl">
      <p className="text-sm text-slate-500">Loading check-in…</p>
    </section>
  );

  const myMood = user ? today?.[user.uid]?.mood : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl transition hover:scale-[1.02]">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700/70 mb-1">
        Daily Check-in
      </h2>
      <p className="mb-4 text-sm text-slate-500">How are you feeling today?</p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map(({ key, label, icon: Icon, color }) => {
          const active = myMood === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleMood(key)}
              disabled={Boolean(savingMood)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105 disabled:cursor-wait disabled:opacity-60 ${
                active
                  ? 'bg-rose-600/90 backdrop-blur-sm text-white shadow-md'
                  : 'bg-white/40 border border-white/30 hover:bg-white/60 text-slate-600'
              }`}
            >
              <Icon size={18} className={active ? color : 'opacity-70'} />
              {savingMood === key ? 'Saving…' : label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
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
