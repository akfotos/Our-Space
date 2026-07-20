import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD8TrsszR965erMXRdGQC3VRODrfOFijEQ',
  authDomain: 'our-space-6f569.firebaseapp.com',
  projectId: 'our-space-6f569',
  storageBucket: 'our-space-6f569.firebasestorage.app',
  messagingSenderId: '861711076502',
  appId: '1:861711076502:web:88dfabd4411e7e8f4906b7',
  databaseURL: 'https://our-space-6f569-default-rtdb.firebaseio.com/',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;
