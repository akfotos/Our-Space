import { useEffect, useState } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
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
    <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{profile.location}</p>
        <p className="text-xs text-slate-400">{profile.name}</p>
        <p className="mt-2 text-2xl font-bold text-rose-600 tabular-nums">{time}</p>
      </div>
      {weather && (
        <div className="flex flex-col items-end gap-1">
          {weatherIcon(weather.weathercode)}
          <span className="text-lg font-semibold text-slate-700">
            {Math.round(weather.temperature)}°C
          </span>
        </div>
      )}
    </div>
  );
}

export default TimeWeather;
