import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
  push,
  serverTimestamp,
  set,
  update,
  remove,
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { rtdb, storage } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import {
  MAX_TYPING_IDLE_MS,
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
} from '../config';

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
  const { coupleId, partner } = useCouple();
  const [messages, setMessages] = useState([]);
  const [typing, setTypingState] = useState({});
  const [missYou, setMissYou] = useState(null);
  const typingTimeoutRef = useRef(null);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return messages.filter((m) => m.uid !== user.uid && !m.readBy?.[user.uid]).length;
  }, [messages, user]);

  useEffect(() => {
    if (!coupleId) return;
    const messagesRef = query(
      ref(rtdb, `chat/${coupleId}/messages`),
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
  }, [coupleId]);

  useEffect(() => {
    if (!user || !coupleId) return;
    const typingRef = ref(rtdb, `chat/${coupleId}/typing`);
    const unsub = onValue(typingRef, (snap) => {
      const val = snap.val() || {};
      const others = Object.fromEntries(
        Object.entries(val).filter(([uid]) => uid !== user.uid)
      );
      setTypingState(others);
    });
    return unsub;
  }, [user, coupleId]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    const missRef = ref(rtdb, `chat/${coupleId}/missYou`);
    const unsub = onValue(missRef, (snap) => {
      const val = snap.exists() ? snap.val() : null;
      setMissYou(val);
      if (val && user && val.uid !== user.uid && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Miss You ❤️', {
          body: `${val.from} sent you a miss you ping!`,
          icon: '/favicon.ico',
          tag: 'miss-you',
        });
      }
    });
    return unsub;
  }, [user, coupleId]);

  const pushMessage = (data) =>
    push(ref(rtdb, `chat/${coupleId}/messages`), {
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
    if (!user || !coupleId) return;
    const tRef = ref(rtdb, `chat/${coupleId}/typing/${user.uid}`);
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
    if (!user || !coupleId) return;
    await set(ref(rtdb, `chat/${coupleId}/missYou`), {
      from: user.displayName,
      uid: user.uid,
      timestamp: serverTimestamp(),
    });

    try {
      const otherEmail = partner?.email;
      if (!otherEmail) return;

      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: otherEmail,
            from_name: user.displayName,
            message: `${user.displayName} sent you a Miss You ping from Our Space! ❤️`,
          },
        }),
      });
    } catch (err) {
      console.error('EmailJS send failed', err);
    }

    setTimeout(() => {
      remove(ref(rtdb, `chat/${coupleId}/missYou`)).catch(() => {});
    }, 5000);
  };

  const markDelivered = async (messageId) => {
    if (!user || !coupleId) return;
    await set(ref(rtdb, `chat/${coupleId}/messages/${messageId}/deliveredBy/${user.uid}`), serverTimestamp());
  };

  const markRead = async (messageId) => {
    if (!user || !coupleId) return;
    await set(ref(rtdb, `chat/${coupleId}/messages/${messageId}/readBy/${user.uid}`), serverTimestamp());
  };

  const editMessage = async (messageId, newText) => {
    if (!user || !coupleId || !newText.trim()) return;
    await update(ref(rtdb, `chat/${coupleId}/messages/${messageId}`), {
      text: newText.trim(),
      editedAt: serverTimestamp(),
    });
  };

  const deleteMessage = async (messageId) => {
    if (!user || !coupleId) return;
    await remove(ref(rtdb, `chat/${coupleId}/messages/${messageId}`));
  };

  return {
    messages,
    typing,
    missYou,
    unreadCount,
    sendMessage,
    sendFile,
    sendScreen,
    sendLink,
    updateTyping,
    sendMissYou,
    markDelivered,
    markRead,
    editMessage,
    deleteMessage,
  };
}
