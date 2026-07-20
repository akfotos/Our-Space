import { Heart, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import Countdown from '../components/Countdown';
import TimeWeather from '../components/TimeWeather';
import DailyCheckIn from '../components/DailyCheckIn';
import MissYouButton from '../components/MissYouButton';
import DailyQuote from '../components/DailyQuote';
import DistanceCard from '../components/DistanceCard';
import Affirmations from '../components/Affirmations';
import { USERS } from '../config';

function Dashboard() {
  const { settings } = useSettings();

  return (
    <div className="relative max-w-6xl mx-auto space-y-8 pb-10 overflow-hidden">
      {/* decorative glass blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-rose-300/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-40 -right-20 w-80 h-80 rounded-full bg-rose-400/20 blur-3xl animate-float [animation-delay:1.5s]" />

      <header className="relative text-center pt-4 animate-fade-in-up">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <Heart
            size={40}
            className="fill-rose-600 text-rose-600 animate-float"
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

      <section className="animate-fade-in-up [animation-delay:0.1s]">
        <Countdown />
      </section>

      {settings.showWeather && (
        <section className="grid sm:grid-cols-2 gap-5 animate-fade-in-up [animation-delay:0.2s]">
          <TimeWeather profile={USERS.A} />
          <TimeWeather profile={USERS.B} />
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
          {settings.showDistance && <DistanceCard />}
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
