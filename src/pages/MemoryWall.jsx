import { useAuth } from '../contexts/AuthContext';
import { useMemories } from '../hooks/useMemories';
import MemoryUpload from '../components/MemoryUpload';
import MemoryCard from '../components/MemoryCard';

function MemoryWall() {
  const { user } = useAuth();
  const { memories, loading, upload, remove } = useMemories(user);

  return (
    <div className={'max-w-5xl mx-auto space-y-6'}>
      <h2 className={'text-2xl font-bold text-slate-700'}>Memory Wall</h2>
      <MemoryUpload onUpload={upload} />
      {loading ? (
        <p className={'text-slate-500'}>Loading memories...</p>
      ) : (
        <div className={'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}>
          {memories.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onDelete={remove}
              canDelete={m.createdBy === user.email}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MemoryWall;
