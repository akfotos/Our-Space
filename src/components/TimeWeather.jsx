import { useEffect, useState } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
  MapPin,
} from 'lucide-react';

function weatherIcon(code) {
  if (code === 0) return <Sun size={24} className="text-amber-500" />;
  if ([1, 2, 3].includes(code)) return <Cloud size={24} className="text-slate-400" />;
  if ([45, 48].includes(code)) return <CloudFog size={24} className="text-slate-400" />;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return <CloudRain size={24} className="text-blue-500" />;
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <Snowflake size={24} className="text-sky-400" />;
  if ([95, 96, 99].includes(code)) return <CloudLightning size={24} className="text-purple-500" />;
  return <Cloud size={24} className="text-slate-400" />;
}

function TimeWeather({ profile }) {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: profile.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    const update = () => setTime(fmt.format(new Date()));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [profile.timezone]);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${profile.lat}&longitude=${profile.lon}&current_weather=true`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setWeather(data.current_weather);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [profile.lat, profile.lon]);

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl transition hover:scale-[1.02] hover:shadow-2xl flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-rose-700/80 flex items-center gap-1.5">
          <MapPin size={14} className="text-rose-600" />
          {profile.location}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{profile.name}&apos;s time</p>
        <p className="mt-3 text-3xl sm:text-4xl font-black text-slate-800 tabular-nums">
          {time}
        </p>
      </div>
      {weather && (
        <div className="flex flex-col items-end gap-2">
          <div className="transform group-hover:scale-110 transition">{weatherIcon(weather.weathercode)}</div>
          <span className="text-2xl font-black text-slate-700">
            {Math.round(weather.temperature)}°C
          </span>
        </div>
      )}
    </div>
  );
}

export default TimeWeather;
