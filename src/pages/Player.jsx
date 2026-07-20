import { useState } from 'react';
import { usePlayerSync } from '../hooks/usePlayerSync';

function Player() {
  const { ready, loadVideo } = usePlayerSync('youtube-player');
  const [input, setInput] = useState('');

  const handleLoad = (e) => {
    e.preventDefault();
    loadVideo(input);
    setInput('');
  };

  return (
    <div className={'max-w-4xl mx-auto space-y-4'}>
      <h2 className={'text-2xl font-bold text-slate-700'}>Watch Together</h2>
      <form onSubmit={handleLoad} className={'flex gap-2'}>
        <input
          type={'text'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'Paste YouTube video ID or URL'}
          className={'flex-1 px-4 py-2 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50'}
        />
        <button
          type={'submit'}
          disabled={!input.trim() || !ready}
          className={'px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition'}
        >
          Load
        </button>
      </form>

      <div
        className={'relative w-full bg-black rounded-2xl overflow-hidden shadow-lg'}
        style={{ aspectRatio: '16/9' }}
      >
        <div id={'youtube-player'} className={'absolute inset-0'} />
      </div>

      {!ready && (
        <p className={'text-sm text-slate-500 text-center'}>Loading YouTube player...</p>
      )}
    </div>
  );
}

export default Player;
