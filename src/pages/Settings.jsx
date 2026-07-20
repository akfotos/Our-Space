import { useEffect, useState } from 'react';
import { Moon, Sun, Settings as SettingsIcon } from 'lucide-react';

function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
        <SettingsIcon size={26} />
        Settings
      </h2>

      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {darkMode ? <Moon size={22} className="text-rose-600" /> : <Sun size={22} className="text-rose-600" />}
          <div>
            <p className="font-semibold text-slate-700">Dark mode</p>
            <p className="text-sm text-slate-500">Switch between light and dark theme</p>
          </div>
        </div>
        <button
          onClick={() => setDarkMode((v) => !v)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
            darkMode ? 'bg-rose-600' : 'bg-slate-300'
          }`}
          aria-label="Toggle dark mode"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default Settings;
