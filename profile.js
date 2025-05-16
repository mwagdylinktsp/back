import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  updatePassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyD1_MuUCT4U3YaI0-yRGaKO0sVnXFGfxCU",
  authDomain: "norween-invoices.firebaseapp.com",
  projectId: "norween-invoices",
  storageBucket: "norween-invoices.appspot.com",
  messagingSenderId: "1001073857267",
  appId: "1:1001073857267:web:a0d632f13f6316baac1d86"
};

// تهيئة Firebase
initializeApp(firebaseConfig);
const auth = getAuth();
const db   = getFirestore();

// عناصر الـ DOM
const displayName    = document.getElementById('displayName');
const displayEmail   = document.getElementById('displayEmail');
const displayRole    = document.getElementById('displayRole');
const displayCompany = document.getElementById('displayCompany');
const passwordForm   = document.getElementById('passwordForm');
const newPassword    = document.getElementById('newPassword');
const confirmPassword= document.getElementById('confirmPassword');
const signOutBtn     = document.getElementById('signOutBtn');

let currentUserUid = null;

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUserUid = user.uid;
  displayEmail.textContent = user.email;

  // جلب بيانات المستخدم من Firestore
  const usersQ = query(collection(db, 'users'), where('uid', '==', user.uid));
  const usersSnap = await getDocs(usersQ);
  if (usersSnap.empty) return;

  const me = usersSnap.docs[0].data();
  console.log(me);
  displayName.textContent = me.name || 'غير محدد';
  displayRole.textContent = me.role === 'admin'
    ? 'مدير'
    : me.role === 'manager'
    ? 'مدير فرعي'
    : 'مستخدم';

  // جلب اسم الشركة
  if (me.companyId) {
    const compDoc = await getDoc(doc(db, 'customers', me.companyId));
    displayCompany.textContent = compDoc.exists() ? compDoc.data().name : 'غير محدد';
  } else {
    displayCompany.textContent = 'غير محدد';
  }
});

// معالجة تغيير كلمة المرور
passwordForm.addEventListener('submit', async e => {
  e.preventDefault();
  const pwd = newPassword.value;
  const cpw = confirmPassword.value;
  if (pwd !== cpw) {
    return Swal.fire({ icon: 'error', title: 'كلمتا المرور غير متطابقتين' });
  }
  try {
    await updatePassword(auth.currentUser, pwd);
    Swal.fire({ icon: 'success', title: 'تم تغيير كلمة المرور' });
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    console.error(err);
    const msg = err.code === 'auth/requires-recent-login'
      ? 'يجب عليك تسجيل الدخول مجددًا لإتمام العملية'
      : err.message;
    Swal.fire({ icon: 'error', title: 'خطأ', text: msg });
  }
});

// زر تسجيل الخروج
signOutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});
