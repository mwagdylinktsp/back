// firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyD1_MuUCT4U3YaI0-yRGaKO0sVnXFGfxCU",
  authDomain: "norween-invoices.firebaseapp.com",
  projectId: "norween-invoices",
  storageBucket: "norween-invoices.appspot.com",
  messagingSenderId: "1001073857267",
  appId: "1:1001073857267:web:a0d632f13f6316baac1d86"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };