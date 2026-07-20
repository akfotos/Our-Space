import { Moon, Sun, Settings as SettingsIcon, Calendar, Clock, Layout } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          checked ? 'bg-rose-600' : 'bg-slate-300'
        }`}
        aria-label={label}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Icon size={22} className="text-rose-600" />
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Settings() {
  const { settings, setSetting } = useSettings();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-slate-700 flex items-center gap-2">
        <SettingsIcon size={28} className="text-rose-600" />
        Settings
      </h2>

      <Card icon={Sun} title="Appearance">
        <Toggle
          label="Dark mode"
          description="Switch between light and dark theme"
          checked={settings.darkMode}
          onChange={(v) => setSetting('darkMode', v)}
        />
      </Card>

      <Card icon={Calendar} title="Reunion">
        <div>
          <label htmlFor="reunionDate" className="block font-semibold text-slate-700">
            Reunion date
          </label>
          <p className="text-sm text-slate-500 mb-2">Change the countdown target date</p>
          <input
            id="reunionDate"
            type="datetime-local"
            value={settings.reunionDate.slice(0, 16)}
            onChange={(e) => setSetting('reunionDate', new Date(e.target.value).toISOString())}
            className="w-full rounded-xl border border-white/30 bg-white/40 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
        <Toggle
          label="Show seconds"
          description="Show seconds in the countdown timer"
          checked={settings.showSeconds}
          onChange={(v) => setSetting('showSeconds', v)}
        />
      </Card>

      <Card icon={Layout} title="Dashboard">
        <Toggle
          label="Weather cards"
          description="Show the time and weather for both locations"
          checked={settings.showWeather}
          onChange={(v) => setSetting('showWeather', v)}
        />
        <Toggle
          label="Daily quote"
          description="Show the rotating love quote card"
          checked={settings.showQuote}
          onChange={(v) => setSetting('showQuote', v)}
        />
        <Toggle
          label="Distance card"
          description="Show the distance between you two"
          checked={settings.showDistance}
          onChange={(v) => setSetting('showDistance', v)}
        />
        <Toggle
          label="Affirmations"
          description="Show the love affirmations column"
          checked={settings.showAffirmations}
          onChange={(v) => setSetting('showAffirmations', v)}
        />
        <Toggle
          label="Daily check-in"
          description="Show the mood check-in card"
          checked={settings.showCheckIn}
          onChange={(v) => setSetting('showCheckIn', v)}
        />
        <Toggle
          label="Miss you button"
          description="Show the miss you ping card"
          checked={settings.showMissYou}
          onChange={(v) => setSetting('showMissYou', v)}
        />
      </Card>
    </div>
  );
}

export default Settings;
