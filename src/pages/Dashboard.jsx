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

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}

async function getLocationLabel(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) throw new Error('Failed to geocode');
    const data = await res.json();
    return (
      data.city || data.locality || data.principalSubdivision || 'Current location'
    );
  } catch {
    return 'Current location';
  }
}

function Dashboard() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const { members, coupleId } = useCouple();
  const presence = usePresence();
  const [locations, setLocations] = useState({});

  const profiles = useMemo(() => {
    return members.map((m) => ({ ...m, ...(locations[m.uid] || {}) }));
  }, [members, locations]);

  const status = (uid) => presence[uid] || { online: false };

  useEffect(() => {
    if (!members.length) return;
    const unsubs = members.map((m) =>
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
            {members.map((m, i) => (
              <OnlineStatus
                key={m.uid}
                online={status(m.uid).online}
                lastSeen={status(m.uid).lastSeen}
                name={m.name}
              />
            ))}
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
