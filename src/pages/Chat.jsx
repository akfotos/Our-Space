import { useEffect, useRef, useState } from 'react';
import {
  Send,
  Paperclip,
  Camera,
  Monitor,
  FileText,
  Link as LinkIcon,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import TypingIndicator from '../components/TypingIndicator';

function Chat() {
  const { user } = useAuth();
  const {
    messages,
    typing,
    missYou,
    sendMessage,
    sendFile,
    sendScreen,
    sendLink,
    updateTyping,
    sendMissYou,
  } = useChat();
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const bottomRef = useRef(null);
  const cameraInputRef = useRef(null);
  const docInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || uploading) return;
    await sendMessage(text);
    setText('');
    updateTyping(false);
  };

  const onChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) updateTyping(true);
  };

  const onBlur = () => updateTyping(false);

  const startUpload = () => {
    setUploading(true);
    setProgress(0);
    setMenuOpen(false);
    updateTyping(false);
  };

  const finishUpload = () => {
    setUploading(false);
    setProgress(0);
  };

  const handleFile = async (type, e) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    e.target.value = '';
    startUpload();
    try {
      await sendFile(file, type, text, setProgress);
      setText('');
    } finally {
      finishUpload();
    }
  };

  const handleScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia || uploading) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch {
      return;
    }

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
      video.play();
    });

    // wait a short moment so the shared frame is visible
    await new Promise((r) => setTimeout(r, 400));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    stream.getTracks().forEach((track) => track.stop());

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        startUpload();
        try {
          await sendScreen(blob, text, setProgress);
          setText('');
        } finally {
          finishUpload();
        }
      },
      'image/png',
      0.92
    );
  };

  const handleLink = async () => {
    const raw = window.prompt('Paste a link to share:');
    if (!raw) return;
    const url = raw.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) return;
    await sendLink(url, text);
    setText('');
  };

  const renderContent = (msg) => {
    if (msg.type === 'image' || msg.type === 'screenshot') {
      return (
        <>
          {msg.text && <p className="mb-1">{msg.text}</p>}
          <img
            src={msg.url}
            alt="attachment"
            className="max-w-full max-h-64 rounded-lg object-contain bg-black/5"
            loading="lazy"
          />
        </>
      );
    }
    if (msg.type === 'file') {
      return (
        <>
          {msg.text && <p className="mb-1">{msg.text}</p>}
          <a
            href={msg.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 underline break-all"
          >
            <FileText size={16} />
            {msg.fileName || 'Document'}
          </a>
        </>
      );
    }
    if (msg.type === 'link') {
      return (
        <>
          {msg.text !== msg.url && msg.text && <p className="mb-1">{msg.text}</p>}
          <a
            href={msg.url}
            target="_blank"
            rel="noreferrer"
            className="underline break-all"
          >
            {msg.url}
          </a>
        </>
      );
    }
    return <p>{msg.text}</p>;
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
      <div className="p-4 border-b border-rose-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Our Chat</h2>
        <button
          onClick={sendMissYou}
          className="text-sm px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition"
        >
          Miss you ❤️
        </button>
      </div>

      {missYou && (
        <div className="bg-rose-50 text-rose-700 text-center py-2 text-sm animate-pulse">
          {missYou.from} sent a {'miss you'} ping!
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.map((msg) => {
          const isMe = msg.uid === user.uid;
          const time = msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-rose-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}
              >
                {!isMe && (
                  <p className="text-xs font-medium opacity-75 mb-1">{msg.name}</p>
                )}
                {renderContent(msg)}
                <p className={`text-[10px] mt-1 ${isMe ? 'text-rose-100' : 'text-slate-400'}`}>
                  {time}
                </p>
              </div>
            </div>
          );
        })}
        <TypingIndicator typing={typing} />
        <div ref={bottomRef} />
      </div>

      {uploading && (
        <div className="px-4 py-2 bg-white border-t border-rose-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Loader2 size={14} className="animate-spin" />
            Uploading… {progress}%
          </div>
          <div className="mt-1 h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="p-3 border-t border-rose-100 bg-white flex gap-2 relative">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={(e) => handleFile('image', e)}
          className="hidden"
        />
        <input
          type="file"
          ref={docInputRef}
          onChange={(e) => handleFile('file', e)}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={uploading}
          className="p-2.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition disabled:opacity-50"
        >
          {menuOpen ? <X size={20} /> : <Paperclip size={20} />}
        </button>

        {menuOpen && !uploading && (
          <div className="absolute bottom-full left-3 mb-2 bg-white rounded-xl shadow-lg border border-rose-100 p-2 flex gap-2 z-10">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-rose-50 text-xs text-slate-600 min-w-[4rem]"
            >
              <Camera size={20} className="text-rose-600" />
              Camera
            </button>
            <button
              type="button"
              onClick={handleScreenShare}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-rose-50 text-xs text-slate-600 min-w-[4rem]"
            >
              <Monitor size={20} className="text-rose-600" />
              Screen
            </button>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-rose-50 text-xs text-slate-600 min-w-[4rem]"
            >
              <FileText size={20} className="text-rose-600" />
              File
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-rose-50 text-xs text-slate-600 min-w-[4rem]"
            >
              <LinkIcon size={20} className="text-rose-600" />
              Link
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={onChange}
            onBlur={onBlur}
            disabled={uploading}
            placeholder="Type a message or add a caption…"
            className="flex-1 px-4 py-2 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!text.trim() || uploading}
            className="p-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
