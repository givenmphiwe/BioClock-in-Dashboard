import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAXvIv1rqpDZ8T6CulcUgV04pHTR4TMPZ0",
  authDomain: "bioclockin-7aa2e.firebaseapp.com",
  projectId: "bioclockin-7aa2e",
  storageBucket: "bioclockin-7aa2e.firebasestorage.app",
  messagingSenderId: "259325969839",
  appId: "1:259325969839:web:3246c443cb2e2998dbdb5a",
  measurementId: "G-6VYG37SEDQ"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
