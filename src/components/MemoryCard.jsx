import { Trash2 } from 'lucide-react';

function MemoryCard({ memory, onDelete, canDelete }) {
  return (
    <div className={'bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden flex flex-col'}>
      <div className={'aspect-square bg-slate-100'}>
        <img
          src={memory.url}
          alt={memory.caption || 'Memory'}
          className={'w-full h-full object-cover'}
          loading={'lazy'}
        />
      </div>
      <div className={'p-4 flex-1 flex flex-col justify-between'}>
        <p className={'text-sm text-slate-700'}>
          {memory.caption || <span className={'italic text-slate-400'}>No caption</span>}
        </p>
        <div className={'mt-3 flex items-center justify-between'}>
          <span className={'text-xs text-slate-400'}>{memory.creatorName}</span>
          {canDelete && (
            <button
              onClick={() => onDelete(memory)}
              className={'text-slate-400 hover:text-red-500 transition'}
              aria-label={'Delete memory'}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemoryCard;
