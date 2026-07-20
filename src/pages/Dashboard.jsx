import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import Countdown from '../components/Countdown';
import TimeWeather from '../components/TimeWeather';
import DailyCheckIn from '../components/DailyCheckIn';
import MissYouButton from '../components/MissYouButton';
import DailyQuote from '../components/DailyQuote';
import DistanceCard from '../components/DistanceCard';
import Affirmations from '../components/Affirmations';
import BibleQuote from '../components/BibleQuote';
import { USERS } from '../config';

function getUserKey(email) {
  return email?.toLowerCase() === USERS.A.email.toLowerCase() ? 'A' : 'B';
}

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
  const [profiles, setProfiles] = useState(USERS);

  useEffect(() => {
    const unsubA = onSnapshot(doc(db, 'userLocations', 'A'), (snap) => {
      if (snap.exists()) {
        setProfiles((prev) => ({ ...prev, A: { ...prev.A, ...snap.data() } }));
      }
    });
    const unsubB = onSnapshot(doc(db, 'userLocations', 'B'), (snap) => {
      if (snap.exists()) {
        setProfiles((prev) => ({ ...prev, B: { ...prev.B, ...snap.data() } }));
      }
    });
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const key = getUserKey(user.email);
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
          doc(db, 'userLocations', key),
          {
            lat: latitude,
            lon: longitude,
            location,
            timezone,
            name: user.displayName,
            email: user.email,
            timestamp: serverTimestamp(),
          },
          { merge: true }
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="relative max-w-6xl mx-auto space-y-8 pb-10 overflow-hidden">
      {/* decorative glass blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-rose-300/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-40 -right-20 w-80 h-80 rounded-full bg-rose-400/20 blur-3xl animate-float [animation-delay:1.5s]" />

      <header className="relative text-center pt-4 animate-fade-in-up">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <img
            src="/Logo.png"
            alt="Our Space"
            className="h-14 w-auto animate-float"
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
      </header>

      <section className="animate-fade-in-up [animation-delay:0.05s]">
        <BibleQuote />
      </section>

      <section className="animate-fade-in-up [animation-delay:0.1s]">
        <Countdown />
      </section>

      {settings.showWeather && (
        <section className="grid sm:grid-cols-2 gap-5 animate-fade-in-up [animation-delay:0.2s]">
          <TimeWeather profile={profiles.A} />
          <TimeWeather profile={profiles.B} />
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
          {settings.showDistance && <DistanceCard profileA={profiles.A} profileB={profiles.B} />}
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
