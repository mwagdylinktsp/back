import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js';

// --- 1. تهيئة Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyD1_MuUCT4U3YaI0-yRGaKO0sVnXFGfxCU",
  authDomain: "norween-invoices.firebaseapp.com",
  projectId: "norween-invoices",
  storageBucket: "norween-invoices.appspot.com",
  messagingSenderId: "1001073857267",
  appId: "1:1001073857267:web:a0d632f13f6316baac1d86"
};
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);
(function(){
  if (!localStorage.getItem("idToken")) {
    window.location.href = "login.html";
  }
})();
// --- 2. تحميل إعدادات الشركة إلى النموذج ---
async function loadCompanySettings() {
  try {
    const ref  = doc(db, 'settings', 'company');
    const snap = await getDoc(ref);
    // console.log('settings document exists?', snap.exists(), snap.data());
    if (!snap.exists()) {
      throw new Error('No companyInfo doc in settings/');
    }

    const data = snap.data();
    document.getElementById('companyName').value    = data.name    || '';
    document.getElementById('companyEmail').value   = data.email   || '';
    document.getElementById('companyPhone').value   = data.phone   || '';
    document.getElementById('companyAddress').value = data.address || '';
    if (data.logoUrl) {
      const img = document.getElementById('logoPreview');
      img.src = data.logoUrl;
      img.classList.remove('hidden');
    }
  } catch (err) {
    console.error('خطأ في تحميل الإعدادات:', err);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'تعذّر تحميل إعدادات الشركة.'
    });
  }
}

// --- 3. حفظ الإعدادات عند الإرسال ---
document.getElementById('settingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const settings = {
      name:      document.getElementById('companyName').value,
      email:     document.getElementById('companyEmail').value,
      phone:     document.getElementById('companyPhone').value,
      address:   document.getElementById('companyAddress').value,
      updatedAt: new Date().toISOString()
    };

    // إذا تم اختيار شعار جديد
    const fileInput = document.getElementById('companyLogo');
    if (fileInput.files[0]) {
      // ارفعه إلى storage وأحصل على URL ثم ضمه إلى settings.logoUrl
      // (ضع هنا كود الرفع عبر Firebase Storage إذا هو مطلوب)
    }

    await setDoc(doc(db, 'settings', 'company'), settings, { merge: true });
    await Swal.fire({
      icon: 'success',
      title: 'تم بنجاح!',
      text: 'تم حفظ إعدادات الشركة بنجاح',
      confirmButtonColor: '#ff3c00'
    });
  } catch (error) {
    console.error('خطأ في حفظ الإعدادات:', error);
    await Swal.fire({
      icon: 'error',
      title: 'خطأ!',
      text: 'حدث خطأ أثناء حفظ الإعدادات',
      confirmButtonColor: '#ff3c00'
    });
  }
});

// --- 4. التحقق من صلاحية الإدمن قبل التحميل ---
window.addEventListener('DOMContentLoaded', () => {
onAuthStateChanged(auth, async user => {
    if (!user) {
        // Redirect to login if the user is not authenticated
        window.location.href = 'login.html';
        return;
    }

    const { uid } = user;

    // Fetch current user document from 'users' collection
    const qs = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
    const meSnap = qs.docs[0];
    const me = meSnap.data();
    const { role } = me;
    // Admins should see all contracts
    if (role === 'admin') {
        loadCompanySettings();
    } else {
        // Users should be redirected to the dashboard
        window.location.href = 'dashboard.html';
    }
  });
});

