import { useEffect, useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import Countdown from '../components/Countdown';
import TimeWeather from '../components/TimeWeather';
import OnlineStatus from '../components/OnlineStatus';
import { usePresence } from '../contexts/PresenceContext';
import DailyCheckIn from '../components/DailyCheckIn';
import MissYouButton from '../components/MissYouButton';
import DailyQuote from '../components/DailyQuote';
import DistanceCard from '../components/DistanceCard';
import Affirmations from '../components/Affirmations';
import BibleQuote from '../components/BibleQuote';
import { getPosition, getLocationLabel } from '../utils/geo';

function Dashboard() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const { couple, members, coupleId } = useCouple();
  const presence = usePresence();
  const [locations, setLocations] = useState({});

  const profiles = useMemo(() => {
    return members.map((m) => ({ ...m, ...(locations[m.uid] || {}) }));
  }, [members, locations]);

  const status = (uid) => presence[uid] || { online: false };

  useEffect(() => {
    const validMembers = members.filter((m) => m.uid);
    if (!validMembers.length) return;
    const unsubs = validMembers.map((m) =>
      onSnapshot(doc(db, 'userLocations', m.uid), (snap) => {
        if (snap.exists()) {
          setLocations((prev) => ({ ...prev, [m.uid]: snap.data() }));
        }
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [members]);

  useEffect(() => {
    if (!user || !coupleId) return;
    let cancelled = false;
    getPosition()
      .then(async (pos) => {
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;
        const [location, timezone] = await Promise.all([
          getLocationLabel(latitude, longitude),
          Promise.resolve(Intl.DateTimeFormat().resolvedOptions().timeZone),
        ]);
        await setDoc(
          doc(db, 'userLocations', user.uid),
          {
            lat: latitude,
            lon: longitude,
            location,
            timezone,
            name: user.displayName,
            email: user.email,
            coupleId,
            timestamp: serverTimestamp(),
          },
          { merge: true }
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, coupleId]);

  const profileA = profiles[0] || {};
  const profileB = profiles[1] || {};

  return (
    <div className="relative max-w-6xl mx-auto space-y-8 pb-10 overflow-hidden">
      {/* decorative glass blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-rose-300/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-40 -right-20 w-80 h-80 rounded-full bg-rose-400/20 blur-3xl animate-float [animation-delay:1.5s]" />

      <header className="relative text-center pt-4 animate-fade-in-up">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="Our Space"
            className="h-14 w-auto animate-float rounded-2xl"
          />
          <h1 className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-700 via-rose-500 to-rose-700 drop-shadow-sm">
            Our Space
          </h1>
          <Sparkles
            size={32}
            className="text-rose-400 animate-float [animation-delay:0.75s]"
          />
        </div>
        <p className="text-lg sm:text-xl text-slate-600 font-medium italic">
          Distance makes the heart grow fonder.
        </p>
        {members.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            {members.filter((m) => m.uid).map((m) => (
              <OnlineStatus
                key={m.uid}
                online={status(m.uid).online}
                lastSeen={status(m.uid).lastSeen}
                name={m.name}
              />
            ))}
          </div>
        )}
        {members.filter((m) => m.uid).length === 1 && couple?.code && (
          <div className="mt-4 mx-auto max-w-sm bg-rose-100/70 backdrop-blur-sm text-rose-800 rounded-2xl px-4 py-3 text-sm font-medium border border-rose-200/50 animate-pop-in">
            Share this code with {members.find((m) => !m.uid)?.name || 'your partner'}:{' '}
            <span className="font-black tracking-widest select-all">{couple.code}</span>
          </div>
        )}
      </header>

      <section className="animate-fade-in-up [animation-delay:0.05s]">
        <BibleQuote />
      </section>

      <section className="animate-fade-in-up [animation-delay:0.1s]">
        <Countdown />
      </section>

      {settings.showWeather && members.length > 0 && (
        <section className="grid sm:grid-cols-2 gap-5 animate-fade-in-up [animation-delay:0.2s]">
          {profileA.name && <TimeWeather profile={profileA} />}
          {profileB.name && <TimeWeather profile={profileB} />}
        </section>
      )}

      {(settings.showCheckIn || settings.showMissYou) && (
        <section className="grid sm:grid-cols-2 gap-5 animate-fade-in-up [animation-delay:0.3s]">
          {settings.showCheckIn && <DailyCheckIn />}
          {settings.showMissYou && <MissYouButton />}
        </section>
      )}

      {(settings.showQuote || settings.showDistance) && (
        <section className="grid sm:grid-cols-2 gap-5 animate-fade-in-up [animation-delay:0.4s]">
          {settings.showQuote && <DailyQuote />}
          {settings.showDistance && members.length > 1 && <DistanceCard profileA={profileA} profileB={profileB} />}
        </section>
      )}

      {settings.showAffirmations && (
        <section className="animate-fade-in-up [animation-delay:0.5s]">
          <Affirmations />
        </section>
      )}
    </div>
  );
}

export default Dashboard;
