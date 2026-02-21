import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDWZJCzoINP6kPe4jK7fQd1_Jnlv51_z-M",
  authDomain: "moticoach-907ff.firebaseapp.com",
  projectId: "moticoach-907ff",
  storageBucket: "moticoach-907ff.firebasestorage.app",
  messagingSenderId: "99729605619",
  appId: "1:99729605619:web:c50e64b3b6e01277ee4886",
  measurementId: "G-WJT68QDNS3"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
