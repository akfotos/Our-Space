import { useMemo } from 'react';
import { MapPin, Plane } from 'lucide-react';
import { USERS } from '../config';

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function DistanceCard() {
  const km = useMemo(
    () => haversine(USERS.A.lat, USERS.A.lon, USERS.B.lat, USERS.B.lon),
    []
  );
  const mi = km * 0.621371;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl transition hover:scale-[1.02]">
      <Plane
        size={56}
        className="absolute -top-2 -right-2 text-rose-200/40 rotate-12"
      />
      <h2 className="text-sm font-bold uppercase tracking-widest text-rose-700/70 mb-2">
        Distance Between Us
      </h2>
      <div className="flex items-center gap-2 text-slate-600 mb-4">
        <MapPin size={16} className="text-rose-600" />
        <span className="text-sm font-medium">{USERS.A.location}</span>
        <span className="text-slate-400">⟷</span>
        <MapPin size={16} className="text-rose-600" />
        <span className="text-sm font-medium">{USERS.B.location}</span>
      </div>
      <p className="text-4xl sm:text-5xl font-black text-slate-800 tabular-nums">
        {Math.round(km).toLocaleString()}
        <span className="text-lg font-semibold text-slate-500 ml-1">km</span>
      </p>
      <p className="text-sm text-slate-500 mt-1">
        That&apos;s about {Math.round(mi).toLocaleString()} miles apart
      </p>
    </section>
  );
}

export default DistanceCard;
