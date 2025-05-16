import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAllInvoices, deleteInvoice } from './src/services/firebaseService.js';
import {
  getFirestore, collection, getDocs, query, where
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

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
// المتغيرات العامة
(function(){
  if (!localStorage.getItem("idToken")) {
    window.location.href = "login.html";
  }
})();

let allInvoices = [];
// تحميل الفواتير عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // await loadInvoices();
    setupEventListeners();
});

// إعداد أحداث المستمعين
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterInvoices);
    document.getElementById('statusFilter').addEventListener('change', filterInvoices);
    document.getElementById('dateFilter').addEventListener('input', filterInvoices);
}

// تحميل جميع الفواتير
async function loadInvoices(companyId = '', role = '') {
    const invoicesList = document.getElementById('invoicesList');
    invoicesList.innerHTML = `
        <tr>
            <td colspan="6" class="text-center p-4">
                <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-[#ff3c00] text-4xl"></i>
                </div>
            </td>
        </tr>
    `;

    try {
        const invoices = await getAllInvoices();

        let filteredInvoices = invoices;

        if (role === 'manager' && companyId) {
            filteredInvoices = invoices.filter(inv => inv.customerId === companyId);
        }

        allInvoices = filteredInvoices;
        displayInvoices(filteredInvoices);
    } catch (error) {
        console.error('خطأ في تحميل الفواتير:', error);
        allInvoices = [];
        displayInvoices([]);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ أثناء تحميل الفواتير'
        });
    }
}



// عرض الفواتير في الجدول
function displayInvoices(invoices) {
    const invoicesList = document.getElementById('invoicesList');
    
    if (!Array.isArray(invoices) || invoices.length === 0) {
        invoicesList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-4">
                    <div class="flex flex-col items-center justify-center py-8">
                        <i class="fas fa-file-invoice text-gray-400 text-5xl mb-4"></i>
                        <p class="text-gray-500">لا توجد فواتير</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    // ترتيب الفواتير من الأحدث إلى الأقدم
    invoices.sort((a, b) => {
        const dateA = new Date(a.invoiceDate || a.createdAt || 0);
        const dateB = new Date(b.invoiceDate || b.createdAt || 0);
        return dateB - dateA;
    });

    invoicesList.innerHTML = invoices.map(invoice => {
        // معالجة التاريخ
        const date = new Date(invoice.invoiceDate || invoice.createdAt);
        const formattedDate = date instanceof Date && !isNaN(date) 
            ? date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            })
            : 'غير محدد';

        // معالجة حالة السداد
        let statusClass = '';
        let statusText = invoice.paymentStatus || 'pending';
        
        switch (statusText.toLowerCase()) {
            case 'paid':
                statusClass = 'bg-green-100 text-green-800';
                statusText = 'مدفوع';
                break;
            case 'unpaid':
                statusClass = 'bg-red-100 text-red-800';
                statusText = 'غير مدفوع';
                break;
            case 'partially_paid':
                statusClass = 'bg-yellow-100 text-yellow-800';
                statusText = 'مدفوع جزئياً';
                break;
            default:
                statusClass = 'bg-gray-100 text-gray-800';
                statusText = 'قيد الانتظار';
        }

        return `
            <tr class="border-b hover:bg-gray-50 transition duration-150">
                <td class="p-3 text-right">${invoice.invoiceNumber || 'غير محدد'}</td>
                <td class="p-3 text-right">${formattedDate}</td>
                <td class="p-3 text-right">${invoice.customerName || 'غير محدد'}</td>
                <td class="p-3 text-right">${(invoice.totalAmount || 0).toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })} جنيه</td>
                <td class="p-3 text-right">
                    <span class="px-3 py-1 rounded-full text-sm ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="p-3">
                    <div class="flex gap-2 justify-end">
                        <button onclick="window.open('view-invoice.html?id=${invoice.id}', '_blank')" 
                                class="text-blue-600 hover:text-blue-800 transition-colors duration-150"
                                title="عرض الفاتورة">
                            <i class="far fa-eye"></i>
                        </button>
                        <button onclick="window.open('edit-invoice.html?id=${invoice.id}', '_blank')" 
                                class="text-yellow-600 hover:text-yellow-800 transition-colors duration-150"
                                title="تعديل الفاتورة">
                            <i class="far fa-edit"></i>
                        </button>
                        <button onclick="deleteInvoiceHandler('${invoice.id}', '${invoice.invoiceNumber}')" 
                                class="text-red-600 hover:text-red-800 transition-colors duration-150"
                                title="حذف الفاتورة">
                            <i class="far fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// تصفية الفواتير
function filterInvoices() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    const filteredInvoices = allInvoices.filter(invoice => {
        const matchesSearch = ((invoice.number || '').toLowerCase().includes(searchTerm) ||
                             (invoice.customerName || '').toLowerCase().includes(searchTerm));
        
        const matchesStatus = statusFilter === 'all' || (invoice.status || 'غير مسدد') === statusFilter;
        
        const matchesDate = !dateFilter || 
                           (invoice.createdAt || invoice.date || '').split('T')[0] === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    displayInvoices(filteredInvoices);
}

// حذف فاتورة
window.deleteInvoiceHandler = async function(invoiceId, invoiceNumber) {
    try {
        const result = await Swal.fire({
            title: 'تأكيد الحذف',
            text: `هل أنت متأكد من حذف الفاتورة رقم ${invoiceNumber || 'غير محدد'}؟`,
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
            await deleteInvoice(invoiceId);
            await Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                text: 'تم حذف الفاتورة بنجاح'
            });
            await loadInvoices();
        }
    } catch (error) {
        console.error('خطأ في حذف الفاتورة:', error);
        await Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ أثناء حذف الفاتورة'
        });
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
        loadInvoices()  // Load all contracts for admins
    }

    // Managers should see only their company's contracts
    else if (role === 'manager') {
        if (companyId) {
            loadInvoices(companyId , 'manager');  // Filter contracts by the manager's company
        }
    }

    // Users should be redirected to the dashboard
    else if (role === 'user') {
        window.location.href = 'dashboard.html';
    }
});