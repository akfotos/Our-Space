import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBucketList } from '../hooks/useBucketList';

function BucketList() {
  const { user } = useAuth();
  const { items, loading, add, toggle, remove } = useBucketList();
  const [text, setText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await add(text.trim(), user);
    setText('');
  };

  return (
    <div className={'max-w-3xl mx-auto space-y-6'}>
      <h2 className={'text-2xl font-bold text-slate-700'}>Our Bucket List</h2>
      <form onSubmit={handleSubmit} className={'flex gap-2'}>
        <input
          type={'text'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Something we want to do together...'}
          className={'flex-1 px-4 py-2 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50'}
        />
        <button
          type={'submit'}
          disabled={!text.trim()}
          className={'px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition flex items-center gap-2'}
        >
          <Plus size={18} /> Add
        </button>
      </form>

      {loading ? (
        <p className={'text-slate-500'}>Loading...</p>
      ) : (
        <ul className={'space-y-2'}>
          {items.map((item) => (
            <li
              key={item.id}
              className={'flex items-center gap-3 bg-white rounded-xl border border-rose-100 p-3'}
            >
              <button
                onClick={() => toggle(item)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  item.done ? 'bg-rose-600 border-rose-600' : 'border-slate-300 hover:border-rose-400'
                }`}
              >
                {item.done && <Check size={14} className={'text-white'} />}
              </button>
              <span
                className={`flex-1 ${
                  item.done ? 'line-through text-slate-400' : 'text-slate-700'
                }`}
              >
                {item.title}
              </span>
              <button
                onClick={() => remove(item)}
                className={'text-slate-400 hover:text-red-500 transition'}
                aria-label={'Delete item'}
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
          {!items.length && (
            <p className={'text-center text-slate-400 py-8'}>No items yet. Add one above!</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default BucketList;
