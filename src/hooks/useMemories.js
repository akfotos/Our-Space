import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

export function useMemories(user) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setMemories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const upload = async (file, caption) => {
    if (!file) return;
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const sRef = storageRef(storage, `memories/${name}`);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    await addDoc(collection(db, 'memories'), {
      url,
      caption: caption || '',
      createdAt: serverTimestamp(),
      createdBy: user?.email || '',
      creatorName: user?.displayName || '',
      storagePath: `memories/${name}`,
    });
  };

  const remove = async (memory) => {
    if (memory.storagePath) {
      try {
        await deleteObject(storageRef(storage, memory.storagePath));
      } catch (e) {}
    }
    await deleteDoc(doc(db, 'memories', memory.id));
  };

  return { memories, loading, upload, remove };
}
