import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase config from Step 1.8
const firebaseConfig = {
  apiKey: "AIzaSyDhSymiSwrn6lw146edMEexvZD3a4bu7BI",
  authDomain: "vizora-analytics-dcb37.firebaseapp.com",
  projectId: "vizora-analytics-dcb37",
  storageBucket: "vizora-analytics-dcb37.firebasestorage.app",
  messagingSenderId: "1083052107256",
  appId: "1:1083052107256:web:17d16b7a22c709dacea20d",
  measurementId: "G-43X5Q4EGS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Add additional scopes for Google Analytics access
googleProvider.addScope('https://www.googleapis.com/auth/analytics.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export default app;
