import { useEffect, useMemo, useState } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { usePresence } from '../contexts/PresenceContext';
import { usePlayerSync } from '../hooks/usePlayerSync';
import { parseVideoSource } from '../utils/videoSource';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  MonitorPlay,
  Link2,
  ExternalLink,
  AlertCircle,
  History,
  Trash2,
  Clock,
  Megaphone,
  Clapperboard,
  Sparkles,
} from 'lucide-react';

const SEEK_SECONDS = 10;

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

function UnsupportedCard({ title, url, note }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-rose-50/95 to-white/95 p-6 text-center animate-fade-in-up">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
        <MonitorPlay size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-4">{note}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition hover:scale-105 shadow-lg shadow-rose-500/20"
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
  const { ready, playerError, adLikely, play, pause, seekBy } = usePlayerSync('youtube-player');
  const [input, setInput] = useState('');
  const [playerState, setPlayerState] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(() => loadHistory(coupleId));
  const [isLoading, setIsLoading] = useState(false);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const unsub = onValue(stateRef, (snap) => {
      setPlayerState(snap.exists() ? snap.val() : null);
    });
    return unsub;
  }, [stateRef]);

  useEffect(() => {
    const source = parseVideoSource(input.trim());
    setDetected(source?.type === 'youtube');
  }, [input]);

  const addToHistory = (url) => {
    setHistory((prev) => {
      const next = [{ url, at: Date.now() }, ...prev.filter((h) => h.url !== url)];
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

    if (!source || source.type !== 'youtube') {
      setError('Only YouTube links are supported. Paste a youtube.com or youtu.be link.');
      setIsLoading(false);
      return;
    }

    try {
      await set(stateRef, {
        type: 'youtube',
        videoId: source.id,
        status: 'playing',
        currentTime: 0,
        updatedBy: user?.uid || '',
        updatedAt: serverTimestamp(),
      });
      addToHistory(url);
      setInput('');
      setDetected(false);
    } catch (err) {
      setError('Failed to load video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasVideo = playerState?.type === 'youtube';
  const partnerOnline = partner?.uid ? !!presence[partner.uid]?.online : false;
  const isPlaying = playerState?.status === 'playing';
  const controlsDisabled = !hasVideo || !ready || !!playerError;

  const togglePlay = () => {
    if (controlsDisabled) return;
    if (isPlaying) pause();
    else play();
  };

  const handleSeek = (delta) => {
    if (controlsDisabled || adLikely) return;
    seekBy(delta);
  };

  const loaderName = useMemo(() => {
    if (!playerState?.updatedBy) return '';
    if (playerState.updatedBy === user?.uid) return 'You';
    return partner?.name || 'Partner';
  }, [playerState?.updatedBy, user?.uid, partner?.name]);

  const renderPlayer = () => {
    if (!hasVideo) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white/70 backdrop-blur-sm">
            <Clapperboard size={32} />
          </div>
          <p className="text-sm text-white/60 max-w-xs">
            Paste a YouTube link above and hit Load to start a movie night together.
          </p>
        </div>
      );
    }

    if (playerError && playerState?.videoId) {
      return (
        <UnsupportedCard
          title="YouTube"
          url={`https://www.youtube.com/watch?v=${playerState.videoId}`}
          note={playerError}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative max-w-5xl mx-auto space-y-6 pb-10">
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-rose-300/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-32 -right-16 w-72 h-72 rounded-full bg-rose-400/20 blur-3xl animate-float [animation-delay:1.5s]" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in-up">
        <div>
          <div className="inline-flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Watch Together</h2>
            <Sparkles size={20} className="text-rose-400 animate-float [animation-delay:0.5s]" />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Share a YouTube link and enjoy a movie night in perfect sync.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold w-fit backdrop-blur-sm border transition ${
            partnerOnline
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
              : 'bg-white/50 text-slate-500 border-white/40'
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

      <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-5 shadow-xl space-y-3 animate-fade-in-up [animation-delay:0.05s]">
        <form onSubmit={handleLoad} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400">
              {detected ? <MonitorPlay size={18} /> : <Link2 size={18} />}
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a YouTube link (youtube.com or youtu.be)"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/40 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/50 placeholder-slate-400 text-sm transition"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-3 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 disabled:opacity-50 transition hover:scale-105 shadow-lg shadow-rose-500/25 text-sm font-semibold"
          >
            <Play size={16} className="fill-white" />
            {isLoading ? 'Loading…' : 'Load'}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-500/10 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-red-500/20 animate-pop-in">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400/80 flex items-center gap-1">
              <History size={13} /> Recent
            </span>
            {history.map((h) => (
              <button
                key={h.url}
                type="button"
                onClick={() => handleLoad({ preventDefault: () => {} }, h.url)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 border border-white/40 text-rose-700 text-xs font-medium hover:bg-white/90 hover:scale-105 transition shadow-sm"
                title={h.url}
              >
                <MonitorPlay size={14} />
                <span className="max-w-[10rem] truncate">{h.url}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearHistory}
              className="p-1.5 rounded-full text-slate-400 hover:bg-white/60 hover:text-rose-600 transition"
              title="Clear history"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="relative rounded-[2rem] p-[3px] bg-gradient-to-br from-rose-300 via-rose-400 to-rose-300 shadow-2xl shadow-rose-500/10 animate-fade-in-up [animation-delay:0.1s]">
        <div
          className="relative w-full bg-slate-950 rounded-[1.75rem] overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          {/*
            The YouTube IFrame API replaces the #youtube-player div below with
            a raw <iframe> and does not carry over any CSS classes from it, so
            positioning/visibility must live on this stable wrapper instead —
            otherwise the iframe can end up unstyled with a collapsed height
            (video invisible, audio still playing).
          */}
          <div className={`absolute inset-0 ${hasVideo && !playerError ? '' : 'invisible'}`}>
            <div id="youtube-player" className="w-full h-full" />
          </div>
          {renderPlayer()}

          <div className="absolute top-3 right-3 flex items-center gap-2">
            {hasVideo && !ready && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur">
                Loading player…
              </span>
            )}
            {hasVideo && ready && adLikely && !playerError && (
              <span
                className="px-2.5 py-1 rounded-full bg-amber-500/85 text-white text-xs backdrop-blur flex items-center gap-1.5 animate-pop-in"
                title="YouTube ads can't be blocked in the embedded player — this should only last a few seconds."
              >
                <Megaphone size={12} />
                Ad playing…
              </span>
            )}
            {hasVideo && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur flex items-center gap-1.5">
                <Clock size={12} />
                {playerState?.status === 'playing' ? 'Playing' : 'Paused'}
              </span>
            )}
          </div>

          {hasVideo && !playerError && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSeek(-SEEK_SECONDS)}
                disabled={controlsDisabled || adLikely}
                title={adLikely ? "Can't seek during an ad" : `Back ${SEEK_SECONDS}s`}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105"
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                disabled={controlsDisabled}
                title={isPlaying ? 'Pause' : 'Play'}
                className="h-12 w-12 flex items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105"
              >
                {isPlaying ? <Pause size={22} className="fill-white" /> : <Play size={22} className="fill-white" />}
              </button>
              <button
                type="button"
                onClick={() => handleSeek(SEEK_SECONDS)}
                disabled={controlsDisabled || adLikely}
                title={adLikely ? "Can't seek during an ad" : `Forward ${SEEK_SECONDS}s`}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105"
              >
                <RotateCw size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {hasVideo && (
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up [animation-delay:0.15s]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
              <MonitorPlay size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">YouTube</p>
              <p className="text-xs text-slate-500">
                {loaderName ? `Loaded by ${loaderName}` : 'Ready to watch'}
                {playerState?.currentTime > 0 && ` · ${Math.floor(playerState.currentTime)}s`}
              </p>
            </div>
          </div>
          {playerState?.videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${playerState.videoId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-slate-700 text-sm font-medium hover:bg-white/90 hover:scale-105 transition shadow-sm"
            >
              <ExternalLink size={14} />
              Open on YouTube
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default Player;
