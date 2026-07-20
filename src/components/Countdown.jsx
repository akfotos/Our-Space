import { useEffect, useState } from 'react';
import { Hourglass } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

function Countdown() {
  const { settings } = useSettings();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(settings.reunionDate);
  const diff = target - now;
  const absDiff = Math.max(0, diff);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  const allUnits = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Minutes', value: minutes },
    { label: 'Seconds', value: seconds },
  ];
  const units = settings.showSeconds ? allUnits : allUnits.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl text-center">
      <Hourglass
        size={80}
        className="absolute -top-4 -right-4 text-rose-200/30 rotate-12"
      />
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700/70 mb-2">
        Next Reunion
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        {diff > 0
          ? 'Counting down to the day we meet again'
          : 'The reunion date has passed. Update it in src/config.js.'}
      </p>
      <div className="flex justify-center gap-3 sm:gap-5 flex-wrap">
        {units.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center min-w-[4.5rem] sm:min-w-[6rem] bg-white/40 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/30 shadow-sm"
          >
            <span className="text-4xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-rose-600 to-rose-800 tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Countdown;
