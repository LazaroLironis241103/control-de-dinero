import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdC4zjzPKu0d8LZLCDkOe8hxgtuceVDYI",
  authDomain: "control-dinero-69857.web.app",
  projectId: "control-dinero-69857",
  storageBucket: "control-dinero-69857.firebasestorage.app",
  messagingSenderId: "419210162700",
  appId: "1:419210162700:web:d25ed19c9a7291c76a3429"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
