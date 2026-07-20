import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

function MemoryUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    await onUpload(file, caption);
    setFile(null);
    setCaption('');
    if (inputRef.current) inputRef.current.value = '';
    setUploading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={'bg-white rounded-2xl shadow-sm border border-rose-100 p-5 space-y-3'}
    >
      <div>
        <label className={'block text-sm font-medium text-slate-700 mb-1'}>Photo</label>
        <input
          ref={inputRef}
          type={'file'}
          accept={'image/*'}
          onChange={(e) => setFile(e.target.files?.[0])}
          className={'block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200'}
        />
      </div>
      <div>
        <label className={'block text-sm font-medium text-slate-700 mb-1'}>Caption</label>
        <input
          type={'text'}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={'Add a caption...'}
          className={'w-full px-4 py-2 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50'}
        />
      </div>
      <button
        type={'submit'}
        disabled={!file || uploading}
        className={'flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition'}
      >
        <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload Memory'}
      </button>
    </form>
  );
}

export default MemoryUpload;
