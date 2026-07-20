import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import TypingIndicator from '../components/TypingIndicator';

function Chat() {
  const { user } = useAuth();
  const { messages, typing, missYou, sendMessage, updateTyping, sendMissYou } = useChat();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
    updateTyping(false);
  };

  const onChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) updateTyping(true);
  };

  const onBlur = () => updateTyping(false);

  return (
    <div className={'max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden'}>
      <div className={'p-4 border-b border-rose-100 flex items-center justify-between'}>
        <h2 className={'text-lg font-semibold text-slate-700'}>Our Chat</h2>
        <button
          onClick={sendMissYou}
          className={'text-sm px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition'}
        >
          Miss you ❤️
        </button>
      </div>

      {missYou && (
        <div className={'bg-rose-50 text-rose-700 text-center py-2 text-sm animate-pulse'}>
          {missYou.from} sent a {'miss you'} ping!
        </div>
      )}

      <div className={'flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin'}>
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
                  <p className={'text-xs font-medium opacity-75 mb-1'}>{msg.name}</p>
                )}
                <p>{msg.text}</p>
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

      <form onSubmit={handleSubmit} className={'p-3 border-t border-rose-100 bg-white flex gap-2'}>
        <input
          type={'text'}
          value={text}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={'Type a message...'}
          className={'flex-1 px-4 py-2 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50'}
        />
        <button
          type={'submit'}
          disabled={!text.trim()}
          className={'p-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition'}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default Chat;
