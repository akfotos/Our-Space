import { useEffect, useRef, useState } from 'react';
import {
  Send,
  Paperclip,
  Monitor,
  FileText,
  Link as LinkIcon,
  X,
  Loader2,
  Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import TypingIndicator from '../components/TypingIndicator';

function avatarInitial(name) {
  return (name || '?').trim()[0].toUpperCase();
}

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
  const fileInputRef = useRef(null);
  const screenInputRef = useRef(null);

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

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    e.target.value = '';
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    startUpload();
    try {
      await sendFile(file, type, text, setProgress);
      setText('');
    } finally {
      finishUpload();
    }
  };

  const handleScreenShare = async () => {
    if (uploading) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMenuOpen(false);
      screenInputRef.current?.click();
      return;
    }
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
          {msg.text && <p className="mb-1 leading-relaxed">{msg.text}</p>}
          <img
            src={msg.url}
            alt="attachment"
            className="max-w-full max-h-64 rounded-xl object-contain bg-black/5 shadow-sm"
            loading="lazy"
          />
        </>
      );
    }
    if (msg.type === 'video') {
      return (
        <>
          {msg.text && <p className="mb-1 leading-relaxed">{msg.text}</p>}
          <video
            src={msg.url}
            controls
            className="max-w-full max-h-64 rounded-xl object-contain bg-black/5 shadow-sm"
          />
        </>
      );
    }
    if (msg.type === 'file') {
      return (
        <>
          {msg.text && <p className="mb-1 leading-relaxed">{msg.text}</p>}
          <a
            href={msg.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 underline underline-offset-2 break-all"
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
          {msg.text !== msg.url && msg.text && (
            <p className="mb-1 leading-relaxed">{msg.text}</p>
          )}
          <a
            href={msg.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 break-all opacity-90 hover:opacity-100"
          >
            {msg.url}
          </a>
        </>
      );
    }
    return <p className="leading-relaxed">{msg.text}</p>;
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col rounded-[2rem] overflow-hidden bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl animate-fade-in-up relative">
      <div className="p-4 bg-white/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-rose-100/80 flex items-center justify-center text-rose-700">
              <Heart size={20} className="fill-rose-600 text-rose-600" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Our Chat</h2>
            <p className="text-xs text-slate-500 font-medium">Always connected</p>
          </div>
        </div>
        <button
          onClick={sendMissYou}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-rose-100/60 text-rose-700 hover:bg-rose-200/80 hover:scale-105 transition shadow-sm backdrop-blur-sm"
        >
          <Heart size={16} className="fill-rose-600" /> Miss you
        </button>
      </div>

      {missYou && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-rose-100/80 backdrop-blur-md border border-white/30 px-5 py-2 rounded-full shadow-lg text-sm text-rose-700 font-medium animate-pop-in">
          {missYou.from} sent a {'miss you'} ping!
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin relative">
        {messages.map((msg, idx) => {
          const isMe = msg.uid === user.uid;
          const time = msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].uid !== msg.uid);
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                isMe ? 'justify-end' : 'justify-start'
              } ${isMe ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
            >
              {!isMe && (
                <div
                  className={`w-8 h-8 rounded-full bg-rose-100/80 text-rose-700 flex items-center justify-center text-xs font-bold shadow-sm shrink-0 transition ${
                    showAvatar ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {avatarInitial(msg.name)}
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-[1.25rem] text-sm shadow-md transition-all duration-200 hover:scale-[1.02] ${
                  isMe
                    ? 'bg-rose-600/85 backdrop-blur-sm text-white rounded-br-md'
                    : 'bg-white/70 backdrop-blur-sm text-slate-800 rounded-bl-md'
                }`}
              >
                {!isMe && (
                  <p className="text-xs font-semibold text-rose-700 mb-1">{msg.name}</p>
                )}
                {renderContent(msg)}
                <p
                  className={`text-[10px] mt-1.5 ${
                    isMe ? 'text-rose-100' : 'text-slate-400'
                  }`}
                >
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
        <div className="px-5 py-2 bg-white/70 backdrop-blur-md border-t border-white/20">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <Loader2 size={14} className="animate-spin" />
            Uploading… {progress}%
          </div>
          <div className="mt-2 h-1.5 w-full bg-rose-100/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="p-3 bg-white/50 backdrop-blur-md border-t border-white/20 flex gap-2 items-end relative z-10">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFile}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*,video/*"
          ref={screenInputRef}
          onChange={handleFile}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={uploading}
          className="p-3 text-slate-500 hover:text-rose-700 hover:bg-white/50 rounded-2xl transition disabled:opacity-50"
        >
          {menuOpen ? <X size={22} /> : <Paperclip size={22} />}
        </button>

        {menuOpen && !uploading && (
          <div className="absolute bottom-full left-4 mb-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-2 flex gap-2 animate-pop-in">
            <button
              type="button"
              onClick={handleScreenShare}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-rose-50/70 hover:scale-105 transition text-xs text-slate-600 min-w-[4rem]"
            >
              <Monitor size={20} className="text-rose-600" />
              Screen
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-rose-50/70 hover:scale-105 transition text-xs text-slate-600 min-w-[4rem]"
            >
              <FileText size={20} className="text-rose-600" />
              File
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-rose-50/70 hover:scale-105 transition text-xs text-slate-600 min-w-[4rem]"
            >
              <LinkIcon size={20} className="text-rose-600" />
              Link
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-end">
          <input
            type="text"
            value={text}
            onChange={onChange}
            onBlur={onBlur}
            disabled={uploading}
            placeholder="Type a message or add a caption…"
            className="flex-1 px-5 py-3 rounded-2xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/40 placeholder-slate-500 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!text.trim() || uploading}
            className="p-3.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 disabled:opacity-50 transition-all hover:scale-105 shadow-lg hover:shadow-rose-500/30"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
