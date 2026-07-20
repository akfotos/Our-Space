import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCouple } from '../contexts/CoupleContext';

export function useBucketList() {
  const { coupleId } = useCouple();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, 'bucketList'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [coupleId]);

  const add = async (title, user) => {
    if (!coupleId) return;
    await addDoc(collection(db, 'couples', coupleId, 'bucketList'), {
      title,
      done: false,
      createdAt: serverTimestamp(),
      createdBy: user?.email || '',
      creatorName: user?.displayName || '',
    });
  };

  const toggle = async (item) => {
    if (!coupleId) return;
    await updateDoc(doc(db, 'couples', coupleId, 'bucketList', item.id), { done: !item.done });
  };

  const remove = async (item) => {
    if (!coupleId) return;
    await deleteDoc(doc(db, 'couples', coupleId, 'bucketList', item.id));
  };

  return { items, loading, add, toggle, remove };
}
