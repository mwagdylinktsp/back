import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, collection, addDoc, updateDoc, doc,
  getDoc, getDocs, deleteDoc, where, query
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

// تهيئة Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD1_MuUCT4U3YaI0-yRGaKO0sVnXFGfxCU",
  authDomain: "norween-invoices.firebaseapp.com",
  projectId: "norween-invoices",
  storageBucket: "norween-invoices.appspot.com",
  messagingSenderId: "1001073857267",
  appId: "1:1001073857267:web:a0d632f13f6316baac1d86"
};
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const auth    = getAuth(app);
const storage = getStorage();

// تأكد من تسجيل الدخول
(function(){
  if (!localStorage.getItem("idToken")) {
    window.location.href = "login.html";
  }
})();

// لتتبع ما إذا كنا في وضع تعديل
let currentEditId = null;

// تحميل العملاء للقائمة
async function loadCustomers() {
  const snapshot = await getDocs(collection(db, 'customers'));
  const select   = document.getElementById('customerId');
  select.innerHTML = '<option value="">اختر العميل</option>';
  snapshot.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.data().name;
    select.appendChild(opt);
  });
}

// تحميل العقود وعرضها في الجدول
async function loadContracts(companyId = '', role = '') {
    const snapshot = await getDocs(collection(db, 'contracts'));
    const body = document.getElementById('contractsTableBody');
    body.innerHTML = ''; // Clear the table content before loading new rows
    
    if (snapshot.empty) {
        body.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-12">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fas fa-file-contract text-[#ff3c00] text-6xl mb-4"></i>
                        <p class="text-gray-500 text-lg">لا توجد عقود مسجلة</p>
                        <button onclick="openAddContractModal()" 
                                class="mt-4 bg-[#ff3c00] text-white px-6 py-2 rounded-lg hover:bg-[#cc3200] transition duration-200">
                            <i class="fas fa-plus ml-2"></i>إضافة عقد جديد
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Loop through the contracts and only show those for the manager's company
    for (const d of snapshot.docs) {
        const c = d.data();

        // Check if the user is a manager or an admin and apply filtering logic
        if (role === 'manager' && (customerId && c.customerId !== companyId)) {
          // console.log(`Contract ${c.contractNumber} skipped. Customer ID ${c.customerId} does not match Company ID ${companyId}`);
          continue; // Skip contracts not belonging to the manager's company
        }
        if (role === 'admin') {
          
        }

        const custDoc = await getDoc(doc(db, 'customers', c.customerId));
        if (!custDoc.exists()) continue; // Skip if customer document does not exist
        const cust = custDoc.data();

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-all duration-200 border-b border-gray-100';
        row.innerHTML = `
            <td class="p-4 text-right">${c.contractNumber || 'غير محدد'}</td>
            <td class="p-4 text-right font-medium text-gray-900">${cust.name || 'غير محدد'}</td>
            <td class="p-4 text-right text-gray-600">${formatDate(c.startDate)}</td>
            <td class="p-4 text-right text-gray-600">${formatDate(c.endDate)}</td>
            <td class="p-4 text-right font-medium">${formatCurrency(c.contractValue)}</td>
            <td class="p-4 text-right">${getContractStatusBadge(c.endDate)}</td>
            <td class="p-4">
                <div class="flex justify-end gap-2">
                    <button onclick="viewContract('${d.id}')" 
                            class="text-blue-600 hover:text-blue-800 transition-colors duration-150"
                            title="عرض العقد">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editContract('${d.id}')" 
                            class="text-yellow-600 hover:text-yellow-800 transition-colors duration-150"
                            title="تعديل العقد">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteContract('${d.id}')" 
                            class="text-red-600 hover:text-red-800 transition-colors duration-150"
                            title="حذف العقد">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        body.appendChild(row);
    }
}




// دوال مساعدة للتنسيق
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG');
}

function formatCurrency(amount) {
    if (!amount) return 'غير محدد';
    return amount.toLocaleString('ar-EG') + ' جنيه';
}

function getContractStatusBadge(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    
    if (end < today) {
        return '<span class="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">منتهي</span>';
    }
    
    const days = Math.ceil((end - today)/(1000*60*60*24));
    if (days <= 30) {
        return `<span class="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">يقترب من الانتهاء (${days} يوم)</span>`;
    }
    
    return '<span class="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">ساري</span>';
}

// تحديد حالة العقد بناءً على تاريخ النهاية
function getContractStatus(endDate) {
  const today = new Date(), end = new Date(endDate);
  if (end < today) return '<span class="text-red-500">منتهي</span>';
  const days = Math.ceil((end - today)/(1000*60*60*24));
  return days <= 30
    ? `<span class="text-yellow-500">يقترب من الانتهاء (${days} يوم)</span>`
    : '<span class="text-green-500">ساري</span>';
}

// مسك الفورم وزر الإرسال
const form      = document.getElementById('addContractForm');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async e => {
  e.preventDefault();

  // Disable the submit button to avoid multiple submissions
  submitBtn.disabled = true;

  // جلب البيانات من الحقول
  const data = {
    contractNumber: document.getElementById('contractNumber').value,
    customerId: document.getElementById('customerId').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    contractValue: Number(document.getElementById('contractValue').value),
    contractType: document.getElementById('contractType').value,
    details: document.getElementById('contractDetails').value,
    createdAt: new Date().toISOString(),
    createdBy: auth.currentUser.uid
  };

  try {
    // إذا فيه ملف PDF مرفوع
    const file = document.getElementById('contractFile').files[0];
    if (file) {
      const storageRef = ref(storage, `contracts/${data.contractNumber}.pdf`);
      await uploadBytes(storageRef, file);
      data.fileUrl = await getDownloadURL(storageRef);
    }

    if (currentEditId) {
      // في وضع التعديل
      await updateDoc(doc(db, 'contracts', currentEditId), data);
      Swal.fire({ icon: 'success', title: 'تم تحديث العقد بنجاح', timer: 1500, showConfirmButton: false });
    } else {
      // في وضع الإضافة
      await addDoc(collection(db, 'contracts'), data);
      Swal.fire({ icon: 'success', title: 'تم إضافة العقد بنجاح', timer: 1500, showConfirmButton: false });
    }

    // إعادة الحالة إلى "إضافة" وتنظيف
    currentEditId = null;
    submitBtn.textContent = 'حفظ';
    form.reset();
    closeAddContractModal();
    loadContracts();

  } catch (err) {
    console.error(err);
    Swal.fire({ icon: 'error', title: 'خطأ', text: err.message });
  } finally {
    // Re-enable the submit button after the operation is done
    submitBtn.disabled = false;
  }
});


// بحث حي في الجدول
document.getElementById('searchInput').addEventListener('input', e => {
  const txt = e.target.value.toLowerCase();
  document.querySelectorAll('#contractsTableBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(txt) ? '' : 'none';
  });
});

// عند تحميل الصفحة
window.addEventListener('load', () => {
  loadCustomers();
});

// فتح/إغلاق المودالات
window.openAddContractModal  = () => document.getElementById('addContractModal').classList.remove('hidden');
window.closeAddContractModal = () => {
  document.getElementById('addContractModal').classList.add('hidden');
  form.reset();
  currentEditId = null;
  submitBtn.textContent = 'حفظ';
};
window.closeViewContractModal = () => document.getElementById('viewContractModal').classList.add('hidden');

// دالة التحويل لوضع التعديل
window.editContract = async contractId => {
  try {
    const snap = await getDoc(doc(db,'contracts',contractId));
    if (!snap.exists()) throw new Error('العقد غير موجود');
    const c = snap.data();

    // ملأ الحقول
    document.getElementById('contractNumber').value  = c.contractNumber || '';
    document.getElementById('customerId').value      = c.customerId     || '';
    document.getElementById('startDate').value       = c.startDate      ? c.startDate.split('T')[0] : '';
    document.getElementById('endDate').value         = c.endDate        ? c.endDate.split('T')[0]   : '';
    document.getElementById('contractValue').value   = c.contractValue  || '';
    document.getElementById('contractType').value    = c.contractType   || '';
    document.getElementById('contractDetails').value = c.details        || '';

    currentEditId = contractId;
    submitBtn.textContent = 'تحديث';
    openAddContractModal();

  } catch (err) {
    console.error(err);
    Swal.fire({ icon:'error', title:'خطأ', text: err.message });
  }
};

// عرض تفاصيل العقد (كما كان)
window.viewContract = async contractId => {
  try {
    const cDoc = await getDoc(doc(db,'contracts',contractId));
    if (!cDoc.exists()) throw new Error('العقد غير موجود');
    const c = cDoc.data();
    const custDoc = await getDoc(doc(db,'customers',c.customerId));
    if (!custDoc.exists()) throw new Error('العميل غير موجود');
    const cust = custDoc.data();

    const types = {
      maintenance:'عقد صيانة',
      service:'عقد خدمات',
      support:'عقد دعم فني',
      emails:'ايملات شركات',
      website:'موقع اليكتروني'
    };

    document.getElementById('viewContractContent').innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-lg">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">تفاصيل العقد</h2>
          <div class="flex gap-4">
            <button onclick="downloadContract('${contractId}')" 
                    class="bg-[#ff3c00] text-white px-4 py-2 rounded-lg hover:bg-[#cc3200] transition duration-200">
              <i class="fas fa-download ml-2"></i> تحميل العقد
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-6 mb-8">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-bold text-gray-700 mb-4">معلومات العقد</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">رقم العقد:</span>
                <span class="font-semibold">${c.contractNumber || 'غير محدد'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">نوع العقد:</span>
                <span class="font-semibold">${types[c.contractType] || 'غير محدد'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">قيمة العقد:</span>
                <span class="font-semibold">${c.contractValue ? c.contractValue.toLocaleString('ar-EG') + ' جنيه' : 'غير محدد'}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-bold text-gray-700 mb-4">معلومات العميل</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">اسم العميل:</span>
                <span class="font-semibold">${cust.name || 'غير محدد'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">تاريخ البداية:</span>
                <span class="font-semibold">${c.startDate ? new Date(c.startDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">تاريخ النهاية:</span>
                <span class="font-semibold">${c.endDate ? new Date(c.endDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-bold text-gray-700 mb-4">تفاصيل العقد</h3>
          <p class="text-gray-600 whitespace-pre-wrap">${c.details || 'لا توجد تفاصيل'}</p>
        </div>

        <div class="mt-6 flex justify-between items-center">
          <div class="text-gray-600">
            <span>تاريخ الإنشاء: </span>
            <span class="font-semibold">${c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
          </div>
          <div class="text-lg">
            <span>حالة العقد: </span>
            ${getContractStatusBadge(c.endDate)}
          </div>
        </div>
      </div>
    `;

    document.getElementById('viewContractModal').classList.remove('hidden');
  } catch (err) {
    console.error(err);
    Swal.fire({ icon:'error', title:'خطأ', text: err.message });
  }
};

// تنزيل ملف العقد
window.downloadContract = async contractId => {
  const docSnap = await getDoc(doc(db,'contracts',contractId));
  const c = docSnap.data();
  if (c.fileUrl) window.open(c.fileUrl, '_blank');
  else Swal.fire({ icon:'info', title:'لا يوجد ملف', text:'لم يتم رفع ملف للعقد' });
};

// حذف العقد
window.deleteContract = async contractId => {
  const res = await Swal.fire({
    title: 'هل أنت متأكد؟',
    text: 'سيتم حذف العقد نهائياً',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء'
  });
  if (res.isConfirmed) {
    try {
      await deleteDoc(doc(db,'contracts',contractId));
      Swal.fire({ icon:'success', title:'تم حذف العقد بنجاح', timer:1500, showConfirmButton:false });
      loadContracts();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon:'error', title:'خطأ', text:'حدث خطأ أثناء الحذف' });
    }
  }
};


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

    const { role, companyId } = me;

    // Admins should see all contracts
    if (role === 'admin') {
        loadContracts();  // Load all contracts for admins
    }

    // Managers should see only their company's contracts
    else if (role === 'manager') {
        if (companyId) {
            loadContracts(companyId , role);  // Filter contracts by the manager's company
        }
    }

    // Users should be redirected to the dashboard
    else if (role === 'user') {
        window.location.href = 'dashboard.html';
    }
});


