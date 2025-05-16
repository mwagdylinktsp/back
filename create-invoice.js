import { getFirestore, collection, getDocs, addDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getCustomers, getProducts, createInvoice } from './src/services/firebaseService.js';
import { db, auth } from './src/firebase.js';
import {
    getAuth, onAuthStateChanged
  } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

// التحقق من تسجيل الدخول
(function(){
  if (!localStorage.getItem("idToken")) {
    window.location.href = "login.html";
  }
})();
let customers = [];
let products = [];

// تحميل بيانات العملاء والمنتجات
async function loadInitialData() {
    try {
        // تحميل العملاء
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const customerSelect = document.getElementById('customerId');
        customerSelect.innerHTML = '<option value="">اختر العميل</option>'; // إضافة هذا السطر
        customersSnapshot.forEach(doc => {
            const customer = { id: doc.id, ...doc.data() };
            customers.push(customer);
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            customerSelect.appendChild(option);
        });

        // تحميل المنتجات
        const productsSnapshot = await getDocs(collection(db, 'products'));
        products = [];
        productsSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        updateProductSelects();

        // تعيين التاريخ الحالي
        const today = new Date();
        document.getElementById('invoiceDate').valueAsDate = today;
        
        // توليد رقم فاتورة جديد
        generateInvoiceNumber();

        console.log('تم تحميل البيانات بنجاح:', { customers, products }); // إضافة سجل للتأكد من تحميل البيانات

    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        alert('حدث خطأ في تحميل البيانات');
    }
}

// تحديث قوائم اختيار المنتجات
function updateProductSelects() {
    const productSelects = document.querySelectorAll('.product-select');
    productSelects.forEach(select => {
        // حفظ القيمة المحددة حالياً
        const currentValue = select.value;
        // مسح القائمة الحالية
        select.innerHTML = '<option value="">اختر المنتج</option>';
        // إضافة المنتجات
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.code})`;
            select.appendChild(option);
        });
        // استعادة القيمة المحددة
        if (currentValue) select.value = currentValue;
    });
}

// عرض تفاصيل العميل عند اختياره
document.getElementById('customerId').addEventListener('change', (e) => {
    const customerId = e.target.value;
    const customerDetails = document.getElementById('customerDetails');
    if (customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('customerName').textContent = `الاسم: ${customer.name}`;
            document.getElementById('customerPhone').textContent = `الهاتف: ${customer.phone || 'غير متوفر'}`;
            document.getElementById('customerAddress').textContent = `العنوان: ${customer.address || 'غير متوفر'}`;
            customerDetails.classList.remove('hidden');
        }
    } else {
        customerDetails.classList.add('hidden');
    }
});

// توليد رقم فاتورة جديد
function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    document.getElementById('invoiceNumber').value = `INV-${year}${month}${day}-${random}`;
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadInitialData);

// باقي الكود الخاص بإضافة المنتجات وحساب الإجمالي يبقى كما هو
document.getElementById('addProduct').addEventListener('click', () => {
    const productsList = document.getElementById('productsList');
    const newRow = document.createElement('div');
    newRow.className = 'product-item grid grid-cols-7 gap-4 mb-4'; // عدلنا إلى 7 أعمدة
    newRow.innerHTML = `
        <select class="product-select p-2 border rounded col-span-2" required>
            <option value="">اختر المنتج</option>
        </select>
        <input type="number" class="quantity p-2 border rounded" placeholder="الكمية" min="1" required>
        <input type="number" class="price p-2 border rounded" placeholder="السعر" readonly>
        <input type="number" class="discount p-2 border rounded" placeholder="الخصم %" min="0" max="100">
        <input type="number" class="total p-2 border rounded" placeholder="الإجمالي" readonly>
        <button type="button" class="remove-product bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
            <i class="fas fa-trash"></i>
        </button>
    `;
    productsList.appendChild(newRow);
    updateProductSelects();
});

// حذف صف المنتج عند الضغط على زر الحذف
document.getElementById('productsList').addEventListener('click', (e) => {
    if (e.target.closest('.remove-product')) {
        e.target.closest('.product-item').remove();
        calculateInvoiceTotal();
    }
});

// حساب الإجمالي عند تغيير الكمية أو الخصم
document.getElementById('productsList').addEventListener('change', (e) => {
    if (e.target.classList.contains('product-select')) {
        const row = e.target.closest('.product-item');
        const selectedProduct = products.find(p => p.id === e.target.value);
        if (selectedProduct) {
            row.querySelector('.price').value = selectedProduct.price;
            calculateRowTotal(row);
        }
    }
    if (e.target.classList.contains('quantity') || e.target.classList.contains('discount')) {
        calculateRowTotal(e.target.closest('.product-item'));
    }
});

// حساب إجمالي الصف
function calculateRowTotal(row) {
    const price = parseFloat(row.querySelector('.price').value) || 0;
    const quantity = parseInt(row.querySelector('.quantity').value) || 0;
    const discount = parseFloat(row.querySelector('.discount').value) || 0;
    
    const total = price * quantity * (1 - discount / 100);
    row.querySelector('.total').value = total.toFixed(2);
    
    calculateInvoiceTotal();
}

// حساب إجمالي الفاتورة
function calculateInvoiceTotal() {
    const totals = Array.from(document.querySelectorAll('.total'))
        .map(input => parseFloat(input.value) || 0);
    const invoiceTotal = totals.reduce((sum, total) => sum + total, 0);
    document.getElementById('totalAmount').value = invoiceTotal.toFixed(2);
}

// معالجة حدث تقديم نموذج الفاتورة
document.getElementById('invoiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // التحقق من وجود منتجات في الفاتورة
        const productItems = document.querySelectorAll('.product-item');
        if (productItems.length === 0) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'يجب إضافة منتج واحد على الأقل للفاتورة',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        // التحقق من اختيار العميل
        const customerId = document.getElementById('customerId').value;
        if (!customerId) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'يرجى اختيار العميل',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        // العثور على معلومات العميل
        const customer = customers.find(c => c.id === customerId);
        
        // التحقق من وجود بيانات العميل
        if (!customer) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'لم يتم العثور على بيانات العميل',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        // جمع بيانات الفاتورة مع التحقق من القيم الفارغة
        const invoiceData = {
            invoiceNumber: document.getElementById('invoiceNumber').value || `INV-${Date.now()}`,
            invoiceDate: document.getElementById('invoiceDate').value || new Date().toISOString().split('T')[0],
            customerId: customerId,
            customerName: customer.name || 'غير محدد',
            customerPhone: customer.phone || 'غير متوفر',
            customerAddress: customer.address || 'غير متوفر',
            totalAmount: parseFloat(document.getElementById('totalAmount').value) || 0,
            notes: document.getElementById('notes')?.value || '',
            products: [],
            createdAt: new Date().toISOString(),
            status: 'pending',
            paymentStatus: 'unpaid'
        };

        // جمع بيانات المنتجات
        const productsData = [];
        for (const item of productItems) {
            const productSelect = item.querySelector('.product-select');
            const selectedProduct = products.find(p => p.id === productSelect.value);
            
            if (!selectedProduct) continue;

            const quantity = parseInt(item.querySelector('.quantity').value) || 0;
            const price = parseFloat(item.querySelector('.price').value) || 0;
            const discount = parseFloat(item.querySelector('.discount').value) || 0;
            const total = parseFloat(item.querySelector('.total').value) || 0;

            if (quantity > 0 && price > 0) {
                productsData.push({
                    productId: selectedProduct.id,
                    productName: selectedProduct.name || 'غير محدد',
                    productCode: selectedProduct.code || 'غير محدد',
                    quantity: quantity,
                    price: price,
                    discount: discount,
                    total: total
                });
            }
        }

        // التحقق من وجود منتجات صالحة
        if (productsData.length === 0) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'يرجى إدخال منتجات صالحة للفاتورة',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        invoiceData.products = productsData;

        // حفظ الفاتورة في Firebase
        await addDoc(collection(db, 'invoices'), invoiceData);

        await Swal.fire({
            title: 'تم بنجاح!',
            text: 'تم حفظ الفاتورة بنجاح',
            icon: 'success',
            confirmButtonColor: '#ff3c00'
        });

        // إعادة التوجيه إلى صفحة سجل الفواتير
        window.location.href = 'invoices-history.html';
        
    } catch (error) {
        console.error('خطأ في حفظ الفاتورة:', error);
        await Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء حفظ الفاتورة',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
});
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
        loadInitialData();
    } else {
        // Users should be redirected to the dashboard
        window.location.href = 'dashboard.html';
    }
  });
});