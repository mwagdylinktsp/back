import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, getDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD1_MuUCT4U3YaI0-yRGaKO0sVnXFGfxCU",
    authDomain: "norween-invoices.firebaseapp.com",
    projectId: "norween-invoices",
    storageBucket: "norween-invoices.appspot.com",
    messagingSenderId: "1001073857267",
    appId: "1:1001073857267:web:a0d632f13f6316baac1d86"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// التحقق من تسجيل الدخول
(function(){
  if (!localStorage.getItem("idToken")) {
    window.location.href = "login.html";
  }
})();


// حذف عميل
window.deleteCustomer = async function(customerId) {
    try {
        const result = await Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذا العميل؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff3c00',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            background: '#fff',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            }
        });

        if (result.isConfirmed) {
            await deleteDoc(doc(db, 'customers', customerId));
            // لا نحتاج لاستدعاء loadCustomers لأن onSnapshot سيقوم بتحديث القائمة تلقائياً
            
            Swal.fire({
                title: 'تم الحذف!',
                text: 'تم حذف العميل بنجاح',
                icon: 'success',
                confirmButtonColor: '#ff3c00'
            });
        }
    } catch (error) {
        console.error('خطأ في حذف العميل:', error);
        Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء حذف العميل',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
}

// تحديث معالج نموذج العميل
// document.getElementById('customerForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
    
//     try {
//         const customerId = document.getElementById('customerId').value;
//         const customerData = {
//             name: document.getElementById('customerName').value.trim(),
//             phone: document.getElementById('customerPhone').value.trim(),
//             address: document.getElementById('customerAddress').value.trim(),
//             email: document.getElementById('customerEmail').value.trim()
//         };

//         if (!customerData.name || !customerData.phone || !customerData.address) {
//             Swal.fire({
//                 title: 'خطأ!',
//                 text: 'يرجى ملء جميع الحقول المطلوبة',
//                 icon: 'error',
//                 confirmButtonColor: '#ff3c00'
//             });
//             return;
//         }

//         if (customerId) {
//             await updateDoc(doc(db, 'customers', customerId), customerData);
//         } else {
//             await addDoc(collection(db, 'customers'), customerData);
//         }

//         // لا نحتاج لاستدعاء loadCustomers لأن onSnapshot سيقوم بتحديث القائمة تلقائياً
//         closeCustomerModal();
        
//         Swal.fire({
//             title: 'تم بنجاح!',
//             text: customerId ? 'تم تحديث بيانات العميل بنجاح' : 'تم إضافة العميل بنجاح',
//             icon: 'success',
//             confirmButtonColor: '#ff3c00'
//         });
//     } catch (error) {
//         console.error('خطأ في حفظ العميل:', error);
//         Swal.fire({
//             title: 'خطأ!',
//             text: 'حدث خطأ أثناء حفظ بيانات العميل',
//             icon: 'error',
//             confirmButtonColor: '#ff3c00'
//         });
//     }
// });

// تحرير عميل
window.editCustomer = async (customerId) => {
    try {
        const docRef = doc(db, 'customers', customerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const customer = docSnap.data();
            document.getElementById('modalTitle').textContent = 'تعديل العميل';
            document.getElementById('customerName').value = customer.name || '';
            document.getElementById('customerPhone').value = customer.phone || '';
            document.getElementById('customerAddress').value = customer.address || '';
            document.getElementById('customerEmail').value = customer.email || '';
            document.getElementById('customerId').value = customerId;
            document.getElementById('customerModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات العميل:', error);
        alert('حدث خطأ أثناء تحميل بيانات العميل');
    }
};

// فتح نافذة إضافة عميل جديد
window.openAddCustomerModal = () => {
    document.getElementById('modalTitle').textContent = 'إضافة عميل جديد';
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';
    document.getElementById('customerModal').classList.remove('hidden');
};

// إغلاق النافذة المنبثقة
window.closeCustomerModal = () => {
    document.getElementById('customerModal').classList.add('hidden');
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';
};

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const qs = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
        const meSnap = qs.docs[0];

        if (!meSnap.exists()) {
            throw new Error('لم يتم العثور على المستخدم.');
        }

        const me = meSnap.data();

        if (me.role !== 'admin') {
            window.location.href = 'dashboard.html'; // المستخدم ليس Admin
            return;
        }
        startAdminPage();

        // ✅ المستخدم Admin — نفذ الكود بعد التحقق
        // document.addEventListener('DOMContentLoaded', () => {
        //     startAdminPage(); // شغّل من هنا بقية وظائف الصفحة
        // });

    } catch (error) {
        console.error('فشل التحقق من صلاحية المستخدم:', error);
        window.location.href = 'login.html';
    }
});

function startAdminPage() {
    // هذا هو كل كود الصفحة الذي كان داخل DOMContentLoaded

    const customersRef = collection(db, 'customers');
    onSnapshot(customersRef, (snapshot) => {
        const tableBody = document.getElementById('customersTableBody');
        const customerCount = snapshot.size;
        const customerCountElement = document.getElementById('customerCount');
        if (customerCountElement) {
            customerCountElement.textContent = customerCount;
        }

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">لا يوجد عملاء</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        snapshot.forEach((doc) => {
            const customer = doc.data();
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="p-4 text-right">${customer.name || '-'}</td>
                <td class="p-4 text-right">${customer.phone || '-'}</td>
                <td class="p-4 text-right">${customer.address || '-'}</td>
                <td class="p-4 text-right">${customer.email || '-'}</td>
                <td class="p-4 text-center">
                    <div class="flex justify-center gap-3">
                        <button onclick="window.editCustomer('${doc.id}')" class="text-blue-600 hover:text-blue-800 transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.deleteCustomer('${doc.id}')" class="text-red-600 hover:text-red-800 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#customersTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const customerData = {
                name: document.getElementById('customerName').value,
                phone: document.getElementById('customerPhone').value,
                address: document.getElementById('customerAddress').value,
                email: document.getElementById('customerEmail').value,
                updatedAt: new Date()
            };

            try {
                const customerId = document.getElementById('customerId').value;
                if (customerId) {
                    await updateDoc(doc(db, 'customers', customerId), customerData);
                } else {
                    await addDoc(collection(db, 'customers'), customerData);
                }
                closeCustomerModal();
            } catch (error) {
                console.error('خطأ في حفظ العميل:', error);
                alert('حدث خطأ أثناء حفظ العميل');
            }
        });
    }
}