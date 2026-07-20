import { useEffect, useState } from 'react';
import { REUNION_DATE } from '../config';

function Countdown() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = REUNION_DATE - now;
  const absDiff = Math.max(0, diff);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-700 mb-2">Next Reunion</h2>
      <div className="flex justify-center gap-3 sm:gap-6">
        {[
          { label: 'Days', value: days },
          { label: 'Hours', value: hours },
          { label: 'Minutes', value: minutes },
          { label: 'Seconds', value: seconds },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-bold text-rose-600 tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-400">
        {diff > 0
          ? 'Counting down to the day!'
          : 'The reunion date has passed. Update it in src/config.js.'}
      </p>
    </section>
  );
}

export default Countdown;
