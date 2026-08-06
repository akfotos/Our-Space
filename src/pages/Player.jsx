import { useEffect, useMemo, useState } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { usePresence } from '../contexts/PresenceContext';
import { usePlayerSync } from '../hooks/usePlayerSync';
import { parseVideoSource } from '../utils/videoSource';
import DirectVideoSync from '../components/DirectVideoSync';
import {
  Play,
  MonitorPlay,
  Link2,
  ExternalLink,
  AlertCircle,
  Film,
  History,
  Trash2,
  Clock,
} from 'lucide-react';

const MAX_HISTORY = 8;
const HISTORY_KEY = 'our-space-watch-history';

function loadHistory(coupleId) {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${HISTORY_KEY}-${coupleId || 'solo'}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(coupleId, history) {
  if (typeof window === 'undefined') return;
  try {
    const key = `${HISTORY_KEY}-${coupleId || 'solo'}`;
    localStorage.setItem(key, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {}
}

function platformIcon(type) {
  switch (type) {
    case 'youtube':
      return <MonitorPlay size={18} />;
    case 'direct':
      return <Film size={18} />;
    default:
      return <Link2 size={18} />;
  }
}

function platformLabel(type) {
  switch (type) {
    case 'youtube':
      return 'YouTube';
    case 'direct':
      return 'Direct video';
    case 'embed':
      return 'Embedded video';
    case 'netflix':
      return 'Netflix';
    case 'prime':
      return 'Prime Video';
    case 'disney':
      return 'Disney+';
    default:
      return 'Video';
  }
}

function UnsupportedCard({ title, url, note }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50/90 p-6 text-center animate-fade-in-up">
      <MonitorPlay size={48} className="text-rose-600 mb-3" />
      <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-4">{note}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition"
        >
          <ExternalLink size={16} />
          Open in {title}
        </a>
      )}
    </div>
  );
}

function Player() {
  const { user } = useAuth();
  const { coupleId, partner } = useCouple();
  const presence = usePresence();
  const stateRef = useMemo(
    () => ref(rtdb, coupleId ? `playerState/${coupleId}` : 'playerState'),
    [coupleId]
  );
  const { ready } = usePlayerSync('youtube-player');
  const [input, setInput] = useState('');
  const [playerState, setPlayerState] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(() => loadHistory(coupleId));
  const [isLoading, setIsLoading] = useState(false);
  const [detectedType, setDetectedType] = useState(null);

  useEffect(() => {
    const unsub = onValue(stateRef, (snap) => {
      setPlayerState(snap.exists() ? snap.val() : null);
    });
    return unsub;
  }, [stateRef]);

  useEffect(() => {
    const source = parseVideoSource(input.trim());
    setDetectedType(source?.type || null);
  }, [input]);

  const addToHistory = (url, type) => {
    setHistory((prev) => {
      const next = [{ url, type, at: Date.now() }, ...prev.filter((h) => h.url !== url)];
      saveHistory(coupleId, next);
      return next.slice(0, MAX_HISTORY);
    });
  };

  const clearHistory = () => {
    saveHistory(coupleId, []);
    setHistory([]);
  };

  const handleLoad = async (e, urlOverride) => {
    if (e?.preventDefault) e.preventDefault();
    const url = (typeof urlOverride === 'string' ? urlOverride : input).trim();
    if (!url) return;

    setError('');
    setIsLoading(true);
    const source = parseVideoSource(url);

    if (!source) {
      setError(
        'Could not recognize that video link. Try a YouTube, Vimeo, Dailymotion, Twitch, Netflix, or direct video URL.'
      );
      setIsLoading(false);
      return;
    }

    try {
      if (source.type === 'youtube') {
        await set(stateRef, {
          type: 'youtube',
          videoId: source.id,
          status: 'paused',
          currentTime: 0,
          updatedBy: user?.uid || '',
          updatedAt: serverTimestamp(),
        });
      } else {
        await set(stateRef, {
          type: source.type,
          url: source.url,
          status: 'paused',
          currentTime: 0,
          updatedBy: user?.uid || '',
          updatedAt: serverTimestamp(),
        });
      }
      addToHistory(url, source.type);
      setInput('');
      setDetectedType(null);
    } catch (err) {
      setError('Failed to load video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeType = playerState?.type || null;
  const partnerOnline = partner?.uid ? !!presence[partner.uid]?.online : false;

  const loaderName = useMemo(() => {
    if (!playerState?.updatedBy) return '';
    if (playerState.updatedBy === user?.uid) return 'You';
    return partner?.name || 'Partner';
  }, [playerState?.updatedBy, user?.uid, partner?.name]);

  const renderPlayer = () => {
    if (!playerState) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
          <MonitorPlay size={48} className="mb-3 opacity-50" />
          <p className="text-sm">Paste a link above and click Load to watch together.</p>
        </div>
      );
    }

    if (activeType === 'youtube') return null;

    if (activeType === 'direct') {
      return <DirectVideoSync url={playerState.url} />;
    }

    if (activeType === 'embed') {
      return (
        <iframe
          src={playerState.url}
          title="Watch together"
          allow="fullscreen; autoplay"
          className="absolute inset-0 w-full h-full border-0 bg-black"
        />
      );
    }

    if (activeType === 'netflix') {
      return (
        <UnsupportedCard
          title="Netflix"
          url={playerState.url}
          note="Netflix cannot be embedded inside other websites. Click below to open the title on Netflix, then use the chat to coordinate play/pause."
        />
      );
    }

    if (activeType === 'prime') {
      return (
        <UnsupportedCard
          title="Prime Video"
          url={playerState.url}
          note="Prime Video cannot be embedded inside other websites. Click below to open it, then use the chat to coordinate."
        />
      );
    }

    if (activeType === 'disney') {
      return (
        <UnsupportedCard
          title="Disney+"
          url={playerState.url}
          note="Disney+ cannot be embedded inside other websites. Click below to open it, then use the chat to coordinate."
        />
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
        Unsupported player type.
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-700">Watch Together</h2>
          <p className="text-sm text-slate-500">
            Share a link and enjoy a movie night in perfect sync.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium w-fit ${
            partnerOnline
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          {partnerOnline
            ? 'Partner online'
            : partner?.name
            ? `${partner.name} is offline`
            : 'Partner offline'}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-rose-100 p-4 shadow-sm space-y-3">
        <form onSubmit={handleLoad} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {detectedType ? platformIcon(detectedType) : <Link2 size={18} />}
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste YouTube, Vimeo, Twitch, Netflix, or any video URL"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition text-sm font-medium"
          >
            <Play size={16} />
            {isLoading ? 'Loading…' : 'Load'}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <History size={14} /> Recent
            </span>
            {history.map((h) => (
              <button
                key={h.url}
                onClick={() => handleLoad({ preventDefault: () => {} }, h.url)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition"
                title={h.url}
              >
                {platformIcon(h.type)}
                <span className="max-w-[12rem] truncate">{h.url}</span>
              </button>
            ))}
            <button
              onClick={clearHistory}
              className="p-1 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="Clear history"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative w-full bg-black rounded-2xl overflow-hidden shadow-lg ring-1 ring-rose-100"
        style={{ aspectRatio: '16/9' }}
      >
        <div
          id="youtube-player"
          className={`absolute inset-0 ${activeType === 'youtube' ? '' : 'invisible'}`}
        />
        {renderPlayer()}

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {activeType === 'youtube' && !ready && (
            <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur">
              Loading player…
            </span>
          )}
          {activeType && (
            <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur flex items-center gap-1.5">
              <Clock size={12} />
              {playerState?.status === 'playing' ? 'Playing' : 'Paused'}
            </span>
          )}
        </div>
      </div>

      {activeType && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-rose-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">{platformIcon(activeType)}</div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{platformLabel(activeType)}</p>
              <p className="text-xs text-slate-500">
                {loaderName ? `Loaded by ${loaderName}` : 'Ready to watch'}
                {playerState?.currentTime > 0 && ` · ${Math.floor(playerState.currentTime)}s`}
              </p>
            </div>
          </div>
          {activeType === 'youtube' && playerState?.videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${playerState.videoId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
            >
              <ExternalLink size={14} />
              Open on YouTube
            </a>
          )}
          {activeType !== 'youtube' && activeType !== 'direct' && playerState?.url && (
            <a
              href={playerState.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
            >
              <ExternalLink size={14} />
              Open original
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default Player;
