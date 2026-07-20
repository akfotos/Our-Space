import { useEffect, useRef, useState } from 'react';
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
  push,
  serverTimestamp,
  set,
  remove,
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { rtdb, storage } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { MAX_TYPING_IDLE_MS } from '../config';

function chatFileName(file) {
  const ext = file.name ? file.name.split('.').pop() : '';
  const prefix = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'attachment';
  const safe = prefix.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return ext ? `chat/${ts}_${rand}_${safe}.${ext}` : `chat/${ts}_${rand}_${safe}`;
}

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [typing, setTypingState] = useState({});
  const [missYou, setMissYou] = useState(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const messagesRef = query(
      ref(rtdb, 'messages'),
      orderByChild('timestamp'),
      limitToLast(100)
    );
    const unsub = onValue(messagesRef, (snap) => {
      const raw = snap.val() || {};
      const arr = Object.entries(raw)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(arr);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const typingRef = ref(rtdb, 'typing');
    const unsub = onValue(typingRef, (snap) => {
      const val = snap.val() || {};
      const others = Object.fromEntries(
        Object.entries(val).filter(([uid]) => uid !== user.uid)
      );
      setTypingState(others);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const missRef = ref(rtdb, 'missYou');
    const unsub = onValue(missRef, (snap) => {
      setMissYou(snap.exists() ? snap.val() : null);
    });
    return unsub;
  }, []);

  const pushMessage = (data) =>
    push(ref(rtdb, 'messages'), {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      timestamp: serverTimestamp(),
      ...data,
    });

  const uploadChatFile = (file, onProgress) =>
    new Promise((resolve, reject) => {
      const sRef = storageRef(storage, chatFileName(file));
      const task = uploadBytesResumable(sRef, file);
      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress?.(pct);
        },
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, fullPath: task.snapshot.ref.fullPath });
        }
      );
    });

  const sendMessage = async (text) => {
    if (!text.trim() || !user) return;
    await pushMessage({ type: 'text', text: text.trim() });
  };

  const sendFile = async (file, type, caption = '', onProgress) => {
    if (!file || !user) return;
    const { url, fullPath } = await uploadChatFile(file, onProgress);
    await pushMessage({
      type,
      text: caption.trim(),
      url,
      storagePath: fullPath,
      fileName: file.name,
      mimeType: file.type,
    });
  };

  const sendScreen = async (blob, caption = '', onProgress) => {
    if (!blob || !user) return;
    const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
    await sendFile(file, 'screenshot', caption, onProgress);
  };

  const sendLink = async (url, caption = '') => {
    if (!url || !user) return;
    await pushMessage({
      type: 'link',
      text: caption.trim() || url,
      url: url.trim(),
    });
  };

  const updateTyping = async (isTyping) => {
    if (!user) return;
    const tRef = ref(rtdb, `typing/${user.uid}`);
    if (isTyping) {
      await set(tRef, {
        name: user.displayName,
        timestamp: serverTimestamp(),
      });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        remove(tRef).catch(() => {});
      }, MAX_TYPING_IDLE_MS);
    } else {
      await remove(tRef);
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const sendMissYou = async () => {
    if (!user) return;
    await set(ref(rtdb, 'missYou'), {
      from: user.displayName,
      uid: user.uid,
      timestamp: serverTimestamp(),
    });
    setTimeout(() => {
      remove(ref(rtdb, 'missYou')).catch(() => {});
    }, 5000);
  };

  return {
    messages,
    typing,
    missYou,
    sendMessage,
    sendFile,
    sendScreen,
    sendLink,
    updateTyping,
    sendMissYou,
  };
}
