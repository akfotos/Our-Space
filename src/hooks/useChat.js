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
import { rtdb } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { MAX_TYPING_IDLE_MS } from '../config';

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

  const sendMessage = async (text) => {
    if (!text.trim() || !user) return;
    await push(ref(rtdb, 'messages'), {
      text: text.trim(),
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      timestamp: serverTimestamp(),
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

  return { messages, typing, missYou, sendMessage, updateTyping, sendMissYou };
}
