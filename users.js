// users.js
import {
    initializeApp,
    getApps,
    getApp,
    deleteApp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {
    getAuth,
    initializeAuth,
    inMemoryPersistence,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyD1_MuUCT4U3YaI0-yRGaKO0sVnXFGfxCU",
    authDomain: "norween-invoices.firebaseapp.com",
    projectId: "norween-invoices",
    storageBucket: "norween-invoices.appspot.com",
    messagingSenderId: "1001073857267",
    appId: "1:1001073857267:web:a0d632f13f6316baac1d86"
};

// Initialize main app
const mainApp = initializeApp(firebaseConfig);
const auth = getAuth(mainApp);
const db = getFirestore(mainApp);
// التحقق من تسجيل الدخول
(function(){
  if (!localStorage.getItem("idToken")) {
    window.location.href = "login.html";
  }
})();
// Initialize secondary app for user-creation without kicking out admin
let secondaryApp;
if (getApps().some(a => a.name === 'secondary')) {
    secondaryApp = getApp('secondary');
} else {
    secondaryApp = initializeApp(firebaseConfig, 'secondary');
}
const secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });

// Global state
let currentUserRole = null;
let currentUserCompany = null;
let currentUserUid = null;
let unsubscribeUsers = null;
let currentEditId = null;

// DOM
const usersTableBody = document.getElementById('usersTableBody');
const addUserBtn = document.getElementById('addUserBtn');
const form = document.getElementById('addUserForm');
const submitBtn = document.getElementById('submitBtn');
const modal = document.getElementById('addUserModal');
const inputName = document.getElementById('userName');
const inputEmail = document.getElementById('userEmail');
const inputPassword = document.getElementById('userPassword');
const selectRole = document.getElementById('userRole');
const selectCompany = document.getElementById('userCompany');
const modalTitle = document.getElementById('modalTitle');
const searchInput = document.getElementById('searchInput');

// Show loading spinner
function showLoading() {
    usersTableBody.innerHTML = `
      <tr><td colspan="6" class="text-center p-12">
        <i class="fas fa-spinner fa-spin text-[#ff3c00] text-4xl"></i>
      </td></tr>`;
}

// Load companies into the <select>
async function loadCompanies() {
    const snap = await getDocs(collection(db, 'customers'));

    if (currentUserRole === 'manager') {
        // Manager sees only his own company
        const meCompanyDoc = snap.docs.find(d => d.id === currentUserCompany);
        const name = meCompanyDoc ? meCompanyDoc.data().name : 'غير محدد';
        selectCompany.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = currentUserCompany;
        opt.textContent = name;
        selectCompany.appendChild(opt);
        selectCompany.disabled = true;
    } else {
        // Admin or user sees full list
        selectCompany.disabled = false;
        selectCompany.innerHTML = `<option value="">-- اختر الشركة --</option>`;
        snap.docs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.data().name;
            selectCompany.appendChild(opt);
        });
    }
}

// Open add/edit modal
window.openAddUserModal = () => {
    modal.classList.remove('hidden');
    inputPassword.required = !currentEditId;
    modalTitle.textContent = currentEditId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد';
    submitBtn.textContent = currentEditId ? 'تحديث' : 'حفظ';
    inputName.focus();
    loadCompanies();

    // Hide "manager" role option for managers
    if (currentUserRole === 'manager') {
        for (let i = selectRole.options.length - 1; i >= 0; i--) {
            if (selectRole.options[i].value === 'admin') {
                selectRole.remove(i);
            }
        }
    } else {
        // Ensure all options are present for admins
        selectRole.innerHTML = `
        <option value="admin">مدير</option>
        <option value="manager">مدير فرعي</option>
        <option value="user">مستخدم</option>
      `;
    }
};

// Close modal
window.closeAddUserModal = () => {
    modal.classList.add('hidden');
    form.reset();
    currentEditId = null;
};

// Real-time subscription to users
function subscribeUsers() {
    if (unsubscribeUsers) unsubscribeUsers();
    showLoading();

    let q;
    if (currentUserRole === 'admin') {
        q = collection(db, 'users');
    } else if (currentUserRole === 'manager') {
        q = query(collection(db, 'users'), where('companyId', '==', currentUserCompany));
    } else {
        q = query(collection(db, 'users'), where('uid', '==', currentUserUid));
    }

    unsubscribeUsers = onSnapshot(q, async snap => {
        usersTableBody.innerHTML = '';
        // load companies map
        const compsSnap = await getDocs(collection(db, 'customers'));
        const companies = {};
        compsSnap.docs.forEach(d => companies[d.id] = d.data().name);

        if (snap.empty) {
            usersTableBody.innerHTML = `
          <tr><td colspan="6" class="text-center p-12">
            <div class="flex flex-col items-center">
              <i class="fas fa-users text-[#ff3c00] text-6xl mb-4"></i>
              <p class="text-gray-500 text-lg">لا يوجد مستخدمين مسجلين</p>
              <button onclick="openAddUserModal()"
                class="mt-4 text-white px-6 py-2 rounded-lg bg-[#ff3c00] hover:bg-[#cc3200] transition-colors">
                <i class="fas fa-user-plus ml-2"></i>إضافة مستخدم جديد
              </button>
            </div>
          </td></tr>`;
            return;
        }

        snap.docs.forEach(docSnap => {
            const user = docSnap.data();
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 transition-all duration-200 border-b border-gray-100';

            // name
            const tdName = document.createElement('td');
            tdName.className = 'p-4 text-right font-medium text-gray-900';
            tdName.textContent = user.name || 'غير محدد';
            tr.appendChild(tdName);

            // email
            const tdEmail = document.createElement('td');
            tdEmail.className = 'p-4 text-right text-gray-600';
            tdEmail.textContent = user.email || 'غير محدد';
            tr.appendChild(tdEmail);

            // role
            const tdRole = document.createElement('td');
            tdRole.className = 'p-4 text-right';
            const span = document.createElement('span');
            span.className = `px-3 py-1 rounded-full text-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'manager' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                }`;
            span.textContent = user.role === 'admin'
                ? 'مدير'
                : user.role === 'manager'
                    ? 'مدير فرعي'
                    : 'مستخدم';
            tdRole.appendChild(span);
            tr.appendChild(tdRole);

            // company
            const tdComp = document.createElement('td');
            tdComp.className = 'p-4 text-right text-gray-600';
            tdComp.textContent = companies[user.companyId] || 'غير محدد';
            tr.appendChild(tdComp);

            // createdAt
            const tdDate = document.createElement('td');
            tdDate.className = 'p-4 text-right text-gray-600';
            const raw = user.createdAt;
            const dateObj = raw
                ? (typeof raw.toDate === 'function' ? raw.toDate() : new Date(raw))
                : null;
            tdDate.textContent = (dateObj instanceof Date && !isNaN(dateObj))
                ? dateObj.toLocaleDateString('ar-EG')
                : 'غير محدد';
            tr.appendChild(tdDate);

            // actions
            const tdActions = document.createElement('td');
            tdActions.className = 'p-4 text-center';
            const divA = document.createElement('div');
            divA.className = 'flex justify-center gap-2';

            // edit
            if (
                currentUserRole === 'admin' ||
                (currentUserRole === 'manager' && user.companyId === currentUserCompany) ||
                (currentUserRole === 'user' && user.uid === currentUserUid)
            ) {
                const btnEdit = document.createElement('button');
                btnEdit.className = 'p-2 text-[#ff3c00] hover:bg-orange-50 rounded-lg transition-colors';
                btnEdit.title = 'تعديل المستخدم';
                btnEdit.innerHTML = '<i class="fas fa-edit"></i>';
                btnEdit.onclick = () => editUser(docSnap.id);
                divA.appendChild(btnEdit);
            }

            // delete (admin only)
            if (currentUserRole === 'admin') {
                const btnDelete = document.createElement('button');
                btnDelete.className = 'p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors';
                btnDelete.title = 'حذف المستخدم';
                btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i>';
                btnDelete.onclick = () => deleteUser(docSnap.id);
                divA.appendChild(btnDelete);
            }

            tdActions.appendChild(divA);
            tr.appendChild(tdActions);
            usersTableBody.appendChild(tr);
        });
    });
}

// Add or update user
form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = inputName.value.trim();
    const email = inputEmail.value.trim();
    const role = selectRole.value;
    const companyId = selectCompany.value;

    try {
        if (currentEditId) {
            // update
            await updateDoc(doc(db, 'users', currentEditId), { name, email, role, companyId });
            Swal.fire({ icon: 'success', title: 'تم تحديث المستخدم', timer: 1500, showConfirmButton: false });
            closeAddUserModal();
        } else {
            // create new user (secondaryAuth)
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, inputPassword.value);
            await updateProfile(cred.user, { displayName: name });
            await addDoc(collection(db, 'users'), {
                uid: cred.user.uid,
                name,
                email,
                role,
                companyId,
                createdAt: serverTimestamp()
            });
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);
            Swal.fire({ icon: 'success', title: 'تم إضافة المستخدم', timer: 1500, showConfirmButton: false });
            closeAddUserModal();
        }
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.message });
    }
});

// Populate edit form
async function editUser(userId) {
    try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (!snap.exists()) throw new Error('المستخدم غير موجود');
        const u = snap.data();
        inputName.value = u.name || '';
        inputEmail.value = u.email || '';
        selectRole.value = u.role || 'user';
        selectCompany.value = u.companyId || '';
        inputPassword.required = false;
        currentEditId = userId;
        openAddUserModal();
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.message });
    }
}

// Delete user
async function deleteUser(userId) {
    const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم حذف المستخدم نهائيًا',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    });
    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            Swal.fire({ icon: 'success', title: 'تم الحذف', timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire({ icon: 'error', title: 'خطأ في الحذف' });
        }
    }
}

// Search filter
searchInput.addEventListener('input', e => {
    const txt = e.target.value.toLowerCase();
    document.querySelectorAll('#usersTableBody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(txt) ? '' : 'none';
    });
});

// Auth state listener & initial load
onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUserUid = user.uid;

    // fetch current user doc
    const qs = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
    const meSnap = qs.docs[0];
    const me = meSnap.data();
    currentUserRole = me.role;
    currentUserCompany = me.companyId;
    if (currentUserRole === 'user') {
        window.location.href = 'dashboard.html';
        return;
        // document.body.innerHTML = '';
    }
    // show add button for admin/manager
    if (currentUserRole === 'admin' || currentUserRole === 'manager') {
        addUserBtn.classList.remove('hidden');
    }

    // start real-time listener
    subscribeUsers();
});
