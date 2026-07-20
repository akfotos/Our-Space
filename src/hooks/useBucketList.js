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

export function useBucketList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bucketList'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const add = async (title, user) => {
    await addDoc(collection(db, 'bucketList'), {
      title,
      done: false,
      createdAt: serverTimestamp(),
      createdBy: user?.email || '',
      creatorName: user?.displayName || '',
    });
  };

  const toggle = async (item) => {
    await updateDoc(doc(db, 'bucketList', item.id), { done: !item.done });
  };

  const remove = async (item) => {
    await deleteDoc(doc(db, 'bucketList', item.id));
  };

  return { items, loading, add, toggle, remove };
}
