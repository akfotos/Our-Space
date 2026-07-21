import { useState } from 'react';
import {
  Moon,
  Sun,
  Settings as SettingsIcon,
  Calendar,
  Clock,
  Layout,
  Lock,
  Fingerprint,
  Heart,
  Copy,
  Check,
  UserCog,
  LogOut,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { useNavigate } from 'react-router-dom';
import {
  supportsBiometric,
  registerCredential,
  clearCredential,
  hasCredential,
} from '../utils/biometric';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
  const { user, signOut } = useAuth();
  const { couple, coupleId, members, myProfile, partner, updateMemberName } = useCouple();
  const navigate = useNavigate();
  const [faceError, setFaceError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(myProfile?.name || '');

  const handleFaceLock = async (enabled) => {
    setFaceError('');
    if (enabled) {
      if (!supportsBiometric()) {
        setFaceError('Your device/browser does not support face or fingerprint unlock.');
        return;
      }
      if (!user) {
        setFaceError('You must be signed in to set up face recognition lock.');
        return;
      }
      try {
        await registerCredential(user);
        setSetting('faceLock', true);
      } catch (err) {
        setFaceError(err.message || 'Could not set up face recognition lock.');
      }
    } else {
      clearCredential();
      setSetting('faceLock', false);
    }
  };

  const handleCopyCode = () => {
    if (!couple?.code) return;
    navigator.clipboard.writeText(couple.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await updateMemberName(tempName.trim());
    }
    setEditingName(false);
  };

  const handleLeaveCouple = async () => {
    if (!user || !couple) return;
    const updatedMembers = couple.members
      .filter((m) => m.uid !== user.uid)
      .map((m) => m.uid ? m : { name: m.name });
    try {
      if (updatedMembers.length === 0) {
        await deleteDoc(doc(db, 'couples', couple.id));
      } else {
        await updateDoc(doc(db, 'couples', couple.id), { members: updatedMembers });
      }
      await updateDoc(doc(db, 'users', user.uid), { coupleId: null }, { merge: true });
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to leave couple', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-slate-700 flex items-center gap-2">
        <SettingsIcon size={28} className="text-rose-600" />
        Settings
      </h2>

      <Card icon={Heart} title="Couple">
        {couple ? (
          <>
            <div>
              <label className="block font-semibold text-slate-700">Couple code</label>
              <p className="text-sm text-slate-500 mb-2">
                Share this code with your partner to link accounts
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-widest text-rose-700 bg-rose-50 rounded-xl px-4 py-2">
                  {couple.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-white/60 hover:bg-white text-slate-600 transition"
                  aria-label="Copy code"
                >
                  {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="border-t border-white/30 pt-4">
              <label className="block font-semibold text-slate-700 mb-2">Members</label>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.uid || 'pending'} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="font-medium text-slate-700">{m.name || 'Unknown'}</span>
                    {m.uid === user?.uid && (
                      <span className="text-xs text-slate-400">(you)</span>
                    )}
                    {!m.uid && (
                      <span className="text-xs text-slate-400">(not joined yet)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {editingName ? (
              <div className="border-t border-white/30 pt-4">
                <label className="block font-semibold text-slate-700 mb-2">Your display name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 rounded-xl border border-white/30 bg-white/40 px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingName(false); setTempName(myProfile?.name || ''); }}
                    className="px-4 py-2 bg-white/60 hover:bg-white text-slate-600 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-white/30 pt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">Your name</p>
                  <p className="text-sm text-slate-500">{myProfile?.name || 'Not set'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setTempName(myProfile?.name || ''); setEditingName(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/60 hover:bg-white text-slate-600 text-sm font-medium transition"
                >
                  <UserCog size={16} /> Edit
                </button>
              </div>
            )}

            <div className="border-t border-white/30 pt-4">
              <button
                type="button"
                onClick={handleLeaveCouple}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium transition"
              >
                <LogOut size={16} /> Leave couple
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No couple linked yet. Set up your space from the login page.</p>
        )}
      </Card>

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
        <Toggle
          label="Bible verse"
          description="Show the shared Bible verse section"
          checked={settings.showBibleVerse}
          onChange={(v) => setSetting('showBibleVerse', v)}
        />
      </Card>

      <Card icon={Lock} title="Security">
        <Toggle
          label="Face recognition lock"
          description="Use Face ID, fingerprint or Windows Hello to unlock the app"
          checked={settings.faceLock && hasCredential()}
          onChange={handleFaceLock}
        />
        {faceError && <p className="text-sm text-red-600">{faceError}</p>}
        {!supportsBiometric() && (
          <p className="text-sm text-slate-500">
            Your device or browser does not support biometric authentication.
          </p>
        )}
      </Card>
    </div>
  );
}

export default Settings;
