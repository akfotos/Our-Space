import { useEffect, useState } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerSync } from '../hooks/usePlayerSync';
import { parseVideoSource } from '../utils/videoSource';
import DirectVideoSync from '../components/DirectVideoSync';
import { Play, ExternalLink, AlertCircle, Film } from 'lucide-react';

const stateRef = ref(rtdb, 'playerState');

function UnsupportedCard({ title, url, note }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50/90 p-6 text-center animate-fade-in-up">
      <Film size={48} className="text-rose-600 mb-3" />
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
  const { ready, loadVideo } = usePlayerSync('youtube-player');
  const [input, setInput] = useState('');
  const [playerState, setPlayerState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onValue(stateRef, (snap) => {
      setPlayerState(snap.exists() ? snap.val() : null);
    });
    return unsub;
  }, []);

  const handleLoad = (e) => {
    e.preventDefault();
    setError('');
    const source = parseVideoSource(input);
    if (!source) {
      setError('Could not recognize that video link. Try a YouTube, Vimeo, Dailymotion, Twitch, or direct video URL.');
      return;
    }

    if (source.type === 'youtube') {
      loadVideo(input);
      setInput('');
      return;
    }

    set(stateRef, {
      type: source.type,
      url: source.url,
      status: 'paused',
      currentTime: 0,
      updatedBy: user?.uid || '',
      updatedAt: serverTimestamp(),
    });
    setInput('');
  };

  const renderPlayer = () => {
    if (!playerState) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
          Paste a link above and click Load to watch together.
        </div>
      );
    }

    const type = playerState.type;

    if (type === 'youtube') {
      return (
        <div id="youtube-player" className="absolute inset-0" />
      );
    }

    if (type === 'direct') {
      return <DirectVideoSync url={playerState.url} />;
    }

    if (type === 'embed') {
      return (
        <iframe
          src={playerState.url}
          title="Watch together"
          allow="fullscreen; autoplay"
          className="absolute inset-0 w-full h-full border-0 bg-black"
        />
      );
    }

    if (type === 'netflix') {
      return (
        <UnsupportedCard
          title="Netflix"
          url={playerState.url}
          note="Netflix cannot be embedded inside other websites. Click below to open the title on Netflix, then use the chat to coordinate play/pause."
        />
      );
    }

    if (type === 'prime') {
      return (
        <UnsupportedCard
          title="Prime Video"
          url={playerState.url}
          note="Prime Video cannot be embedded inside other websites. Click below to open it, then use the chat to coordinate."
        />
      );
    }

    if (type === 'disney') {
      return (
        <UnsupportedCard
          title="Disney+"
          url={playerState.url}
          note="Disney+ cannot be embedded inside other websites. Click below to open it, then use the chat to coordinate."
        />
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
        Unsupported player type.
      </div>
    );
  };

  const title = playerState?.type
    ? playerState.type.charAt(0).toUpperCase() + playerState.type.slice(1)
    : 'Watch Together';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-slate-700">{title}</h2>
      <form onSubmit={handleLoad} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste YouTube, Vimeo, Twitch, Netflix, or any video URL"
          className="flex-1 px-4 py-2 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition"
        >
          <Play size={18} />
          Load
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div
        className="relative w-full bg-black rounded-2xl overflow-hidden shadow-lg"
        style={{ aspectRatio: '16/9' }}
      >
        {renderPlayer()}
      </div>

      {!ready && playerState?.type === 'youtube' && (
        <p className="text-sm text-slate-500 text-center">Loading YouTube player…</p>
      )}
    </div>
  );
}

export default Player;
