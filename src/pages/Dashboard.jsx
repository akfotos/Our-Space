import { useEffect, useState, useMemo, useRef } from 'react';
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

  const locationUnsubsRef = useRef([]);

  useEffect(() => {
    locationUnsubsRef.current.forEach((u) => u());
    locationUnsubsRef.current = [];
    const validMembers = members.filter((m) => m.uid);
    if (!validMembers.length) return;
    locationUnsubsRef.current = validMembers.map((m) =>
      onSnapshot(doc(db, 'userLocations', m.uid), (snap) => {
        if (snap.exists()) {
          setLocations((prev) => ({ ...prev, [m.uid]: snap.data() }));
        }
      })
    );
    return () => locationUnsubsRef.current.forEach((u) => u());
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
    <div className="relative max-w-6xl mx-auto space-y-8 pb-10">
      <header className="glass-panel relative text-center px-6 py-10 sm:py-12 animate-fade-in-up">
        <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-rose-300/25 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-amber-200/20 blur-3xl animate-float [animation-delay:1.5s]" />

        <div className="relative inline-flex items-center justify-center gap-3 mb-2">
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="Our Space"
            className="h-14 w-auto animate-float rounded-2xl shadow-lg shadow-rose-500/20"
          />
          <h1 className="text-5xl sm:text-6xl font-black text-shimmer animate-shimmer drop-shadow-sm">
            Our Space
          </h1>
          <Sparkles
            size={32}
            className="text-rose-400 animate-float [animation-delay:0.75s]"
          />
        </div>
        <p className="relative text-lg sm:text-xl text-slate-600 font-medium italic">
          Distance makes the heart grow fonder.
        </p>
        {members.length > 0 && (
          <div className="relative mt-5 flex flex-wrap items-center justify-center gap-3">
            {members.filter((m) => m.uid).map((m) => (
              <div
                key={m.uid}
                className="px-3.5 py-1.5 rounded-full bg-white/50 border border-white/40 backdrop-blur-sm shadow-sm"
              >
                <OnlineStatus
                  online={status(m.uid).online}
                  lastSeen={status(m.uid).lastSeen}
                  name={m.name}
                />
              </div>
            ))}
          </div>
        )}
        {members.filter((m) => m.uid).length === 1 && couple?.code && (
          <div className="relative mt-5 mx-auto max-w-sm bg-rose-100/70 backdrop-blur-sm text-rose-800 rounded-2xl px-4 py-3 text-sm font-medium border border-rose-200/50 animate-pop-in">
            Share this code with {members.find((m) => !m.uid)?.name || 'your partner'}:{' '}
            <span className="font-black tracking-widest select-all">{couple.code}</span>
          </div>
        )}
      </header>

      {settings.showBibleVerse && (
        <section className="animate-fade-in-up [animation-delay:0.05s]">
          <BibleQuote />
        </section>
      )}

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
