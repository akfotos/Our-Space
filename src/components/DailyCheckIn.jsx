import { useEffect, useState } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
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
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

  const docRef = doc(db, 'dailyCheckIn', getTodayId());

  useEffect(() => {
    const unsub = onSnapshot(docRef, (snap) => {
      setToday(snap.exists() ? snap.data() : {});
      setLoading(false);
    });
    return unsub;
  }, [docRef]);

  const handleMood = async (mood) => {
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

  if (loading) return <div className="p-5 text-sm text-slate-500">Loading check-in...</div>;

  const myMood = today?.[user.uid]?.mood;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5">
      <h2 className="text-lg font-semibold text-slate-700 mb-3">Daily Check-in</h2>
      <div className="flex flex-wrap gap-2">
        {MOODS.map(({ key, label, icon: Icon, color }) => {
          const active = myMood === key;
          return (
            <button
              key={key}
              onClick={() => handleMood(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition ${
                active
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600'
              }`}
            >
              <Icon size={18} className={active ? color : ''} />
              {label}
            </button>
          );
        })}
      </div>
      {today && (
        <div className="mt-4 space-y-1">
          {Object.entries(today)
            .filter(([key]) => key !== 'updatedAt')
            .map(([uid, data]) => (
              <p key={uid} className="text-sm text-slate-600">
                <span className="font-medium">{data.name}</span> is feeling{' '}
                <span className="capitalize">{data.mood}</span>
              </p>
            ))}
        </div>
      )}
    </section>
  );
}

export default DailyCheckIn;
