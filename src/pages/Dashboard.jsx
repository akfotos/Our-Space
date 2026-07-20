import { Heart } from 'lucide-react';
import Countdown from '../components/Countdown';
import TimeWeather from '../components/TimeWeather';
import DailyCheckIn from '../components/DailyCheckIn';
import MissYouButton from '../components/MissYouButton';
import { USERS } from '../config';

function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-rose-600 flex items-center justify-center gap-2">
          <Heart className="fill-rose-600 text-rose-600" size={32} />
          Our Space
        </h1>
        <p className="text-slate-600 mt-1">Distance makes the heart grow fonder.</p>
      </header>

      <Countdown />

      <section className="grid sm:grid-cols-2 gap-4">
        <TimeWeather profile={USERS.A} />
        <TimeWeather profile={USERS.B} />
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <DailyCheckIn />
        <MissYouButton />
      </section>
    </div>
  );
}

export default Dashboard;
