import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
// التحقق من تسجيل الدخول
(function(){
  if (!localStorage.getItem("idToken")) {
    window.location.href = "login.html";
  }
})();
async function loadInvoice() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const invoiceId = urlParams.get('id');
        
        if (!invoiceId) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'لم يتم تحديد معرف الفاتورة',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'الفاتورة غير موجودة',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        const invoice = docSnap.data();
        console.log('بيانات الفاتورة الكاملة:', invoice);

        // تحديث العناصر بشكل آمن
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`عنصر غير موجود: ${id}`);
            }
        };

        // تحديث بيانات الشركة
        // تحميل بيانات الشركة من Firestore
        const companyRef = doc(db, 'settings', 'company');
        const companySnap = await getDoc(companyRef);
        
        let companyInfo;
        if (companySnap.exists()) {
            companyInfo = companySnap.data();
        } else {
            companyInfo = {
                name: 'غير محدد',
                address: 'غير محدد',
                phone: 'غير محدد',
                email: 'غير محدد'
            };
            console.warn('لم يتم العثور على بيانات الشركة في الإعدادات');
        }

        const companyLogo = document.getElementById('companyLogo');
        if (companyLogo) {
            companyLogo.src = companyInfo.logo || './data/norWeenlogoBlack.png';
            companyLogo.classList.remove('hidden');
        }

        const companyName = document.getElementById('companyName');
        if (companyName) {
            companyName.textContent = companyInfo.name;
            companyName.classList.remove('hidden');
        }

        updateElement('companyAddress', `العنوان: ${companyInfo.address}`);
        updateElement('companyPhone', `الهاتف: ${companyInfo.phone}`);
        updateElement('companyEmail', `البريد الإلكتروني: ${companyInfo.email}`);

        // تحديث بيانات الفاتورة
        updateElement('invoiceNumber', `رقم الفاتورة: ${invoice.invoiceNumber || 'غير محدد'}`);
        updateElement('invoiceDate', `التاريخ: ${invoice.invoiceDate ? 
            new Date(invoice.invoiceDate).toLocaleDateString('ar-EG') : 'غير محدد'}`);
        
        // تحديث بيانات العميل
        updateElement('customerName', `اسم العميل: ${invoice.customerName || 'غير محدد'}`);
        // updateElement('customerEmail', `البريد الإلكتروني: ${invoice.customerEmail || 'غير محدد'}`);
        updateElement('customerPhone', `رقم الهاتف: ${invoice.customerPhone || 'غير محدد'}`);

        // عرض تفاصيل المنتجات
        const invoiceItems = document.getElementById('invoiceItems');
        if (invoiceItems) {
            if (invoice.products && Array.isArray(invoice.products) && invoice.products.length > 0) {
                invoiceItems.innerHTML = invoice.products.map(product => `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 text-right">${product.productName || 'غير محدد'}</td>
                        <td class="p-3 text-right">${product.productCode || '-'}</td>
                        <td class="p-3 text-right">${Number(product.price || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</td>
                        <td class="p-3 text-right">${product.quantity || 0}</td>
                        <td class="p-3 text-right">${product.discount || 0}%</td>
                        <td class="p-3 text-right">${Number(product.total || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</td>
                    </tr>
                `).join('');
            } else {
                invoiceItems.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center p-4">
                            <div class="flex flex-col items-center justify-center py-8">
                                <i class="fas fa-box text-gray-400 text-5xl mb-4"></i>
                                <p class="text-gray-500">لا توجد منتجات في هذه الفاتورة</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }

        // تحديث الإجماليات والدفع
        updateElement('invoiceTotal', `${Number(invoice.totalAmount || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه`);
        
        const paymentDetails = document.getElementById('paymentDetails');
        if (paymentDetails && (invoice.paidAmount || invoice.remainingAmount)) {
            paymentDetails.classList.remove('hidden');
            
            const paidElement = document.getElementById('paidAmount');
            const remainingElement = document.getElementById('remainingAmount');
            
            if (paidElement) {
                paidElement.textContent = `المدفوع: ${Number(invoice.paidAmount || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه`;
                paidElement.classList.add('text-green-600', 'font-bold');
            }
            
            if (remainingElement) {
                remainingElement.textContent = `المتبقي: ${Number(invoice.remainingAmount || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه`;
                remainingElement.classList.add('text-red-600', 'font-bold');
            }
        }

        // تحديث الملاحظات
        const notesSection = document.getElementById('notesSection');
        if (notesSection) {
            if (invoice.notes && invoice.notes.trim()) {
                updateElement('invoiceNotes', invoice.notes);
                notesSection.classList.remove('hidden');
            } else {
                notesSection.classList.add('hidden');
            }
        }

    } catch (error) {
        console.error('خطأ في تحميل الفاتورة:', error);
        await Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء تحميل الفاتورة',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
}

// تحميل الفاتورة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadInvoice);