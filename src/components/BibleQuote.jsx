import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Send, Search, RefreshCw } from 'lucide-react';

const VERSIONS = [
  { slug: 'niv', name: 'NIV' },
  { slug: 'nlt', name: 'NLT' },
  { slug: 'nkjv', name: 'NKJV' },
];

function formatTime(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseReference(input) {
  const match = input.trim().match(/^(.*?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!match) return null;
  const book = match[1].trim().toLowerCase().replace(/\s+/g, '-');
  return {
    book,
    chapter: match[2],
    verse: match[3],
    endVerse: match[4],
  };
}

function BibleQuote() {
  const { user } = useAuth();
  const [version, setVersion] = useState('niv');
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookup, setLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState([]);

  const fetchVOTD = async (ver) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.midvash.com/v1/votd?version=${ver}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVerse({
        reference: data.reference,
        text: data.text,
        version: data.version,
      });
    } catch {
      setVerse({ reference: '', text: 'Unable to load a verse right now.', version: ver });
    } finally {
      setLoading(false);
    }
  };

  const fetchByReference = async (e) => {
    e.preventDefault();
    setLookupError('');
    const parsed = parseReference(lookup);
    if (!parsed) {
      setLookupError('Use format like "John 3", "John 3:16", or "John 3:16-18"');
      return;
    }
    setLoading(true);
    try {
      let url;
      if (!parsed.verse) {
        url = `https://api.midvash.com/v1/${version}/${parsed.book}/${parsed.chapter}`;
      } else if (parsed.endVerse) {
        url = `https://api.midvash.com/v1/${version}/${parsed.book}/${parsed.chapter}/${parsed.verse}-${parsed.endVerse}`;
      } else {
        url = `https://api.midvash.com/v1/${version}/${parsed.book}/${parsed.chapter}/${parsed.verse}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const text = data.data.text || data.data.verses?.join(' ') || '';
      setVerse({
        reference: data.meta.reference,
        text,
        version: data.data.version,
      });
      setLookup('');
    } catch {
      setLookupError('Could not find that passage. Check the reference and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVOTD(version);
  }, [version]);

  useEffect(() => {
    const q = query(
      collection(db, 'bibleVerses'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const sendVerse = async () => {
    if (!verse || !verse.text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'bibleVerses'), {
        uid: user.uid,
        name: user.displayName,
        reference: verse.reference,
        text: verse.text,
        version: verse.version,
        timestamp: serverTimestamp(),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl animate-fade-in-up [animation-delay:0.05s]">
      <BookOpen
        size={56}
        className="absolute -top-3 -right-3 text-rose-200/30 rotate-12"
      />
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700/70 mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-rose-600" />
        Bible Verse
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {VERSIONS.map((v) => (
          <button
            key={v.slug}
            onClick={() => setVersion(v.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              version === v.slug
                ? 'bg-rose-600 text-white shadow'
                : 'bg-white/40 text-slate-700 hover:bg-white/60'
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-5 border border-white/30 mb-4">
        {loading ? (
          <p className="text-slate-500 italic">Loading passage…</p>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin">
              <p className="text-slate-700 leading-relaxed italic text-lg">
                &ldquo;{verse?.text}&rdquo;
              </p>
            </div>
            <p className="mt-2 text-sm font-bold text-rose-700">
              {verse?.reference} ({verse?.version?.toUpperCase()})
            </p>
          </>
        )}
        <button
          onClick={sendVerse}
          disabled={loading || sending || !verse?.text.trim()}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-medium transition"
        >
          <Send size={16} />
          {sending ? 'Sending…' : 'Send to us'}
        </button>
      </div>

      <form onSubmit={fetchByReference} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={lookup}
          onChange={(e) => setLookup(e.target.value)}
          placeholder="John 3, John 3:16, or John 3:16-18"
          className="flex-1 rounded-xl border border-white/30 bg-white/40 px-4 py-2.5 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <button
          type="submit"
          disabled={!lookup.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-medium transition"
        >
          <Search size={16} />
          Lookup
        </button>
        <button
          type="button"
          onClick={() => fetchVOTD(version)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/40 hover:bg-white/60 text-slate-700 rounded-xl font-medium transition"
        >
          <RefreshCw size={16} />
          Daily
        </button>
      </form>
      {lookupError && (
        <p className="mt-2 text-sm text-red-600">{lookupError}</p>
      )}

      {items.length > 0 && (
        <div className="mt-5 space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
            >
              <p className="text-slate-700 italic">&ldquo;{item.text}&rdquo;</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-700">
                  {item.reference} ({item.version?.toUpperCase()}) · {item.name}
                </span>
                <span className="text-slate-500">{formatTime(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BibleQuote;
