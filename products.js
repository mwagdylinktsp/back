import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, getDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

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
const handleLogin = () => {
    const token = localStorage.getItem("idToken");
    if (!token) {
        window.location.href = "login.html";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من تسجيل الدخول
    handleLogin();

    // بدء مراقبة المنتجات
    initializeProductsListener();

    // إضافة مستمعي الأحداث
    setupEventListeners();
});

function initializeProductsListener() {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        const tableBody = document.getElementById('productsTableBody');
        
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد منتجات</td></tr>';
            return;
        }
    
        tableBody.innerHTML = '';
        snapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="p-3">${product.code || ''}</td>
                <td class="p-3">${product.name || ''}</td>
                <td class="p-3">${product.price || 0} EGP</td>
                <td class="p-3">${product.quantity || 0}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${product.status === 'active' ? 'متاح' : 'غير متاح'}
                    </span>
                </td>
                <td class="p-3">
                    <div class="flex gap-2">
                        <button onclick="window.editProduct('${doc.id}')" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.deleteProduct('${doc.id}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

function setupEventListeners() {
    // البحث في المنتجات
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // نموذج المنتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductForm);
    }
}

// دالة معالجة نموذج المنتج
async function handleProductForm(e) {
    e.preventDefault();
    const productData = {
        code: document.getElementById('productCode').value.trim(),
        name: document.getElementById('productName').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        quantity: parseInt(document.getElementById('productQuantity').value) || 0,
        status: document.getElementById('productStatus').value,
        updatedAt: new Date()
    };

    try {
        const productId = document.getElementById('productId').value;
        
        // التحقق من تكرار كود المنتج
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('code', '==', productData.code));
        const querySnapshot = await getDocs(q);
        
        // التحقق من وجود منتج بنفس الكود (مع استثناء المنتج الحالي في حالة التحديث)
        const duplicateProduct = querySnapshot.docs.find(doc => doc.id !== productId);
        
        if (duplicateProduct) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'كود المنتج موجود بالفعل، يرجى استخدام كود آخر',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        if (productId) {
            await updateDoc(doc(db, 'products', productId), productData);
        } else {
            await addDoc(collection(db, 'products'), productData);
        }
        
        closeProductModal();
        await Swal.fire({
            title: 'تم بنجاح!',
            text: productId ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح',
            icon: 'success',
            confirmButtonColor: '#ff3c00'
        });
    } catch (error) {
        console.error('خطأ في حفظ المنتج:', error);
        await Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء حفظ المنتج',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
}

// Add the missing handleSearch function
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const tableBody = document.getElementById('productsTableBody');
    const rows = tableBody.getElementsByTagName('tr');

    for (const row of rows) {
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        // Skip if it's the "no products" message row
        if (cells.length === 1 && cells[0].getAttribute('colspan')) {
            continue;
        }

        // Search through each cell in the row
        for (const cell of cells) {
            if (cell.textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }

        // Show/hide row based on search match
        row.style.display = found ? '' : 'none';
    }
}

// حذف منتج
window.deleteProduct = async (productId) => {
    try {
        const result = await Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذا المنتج؟',
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
            await deleteDoc(doc(db, 'products', productId));
            await Swal.fire({
                title: 'تم الحذف!',
                text: 'تم حذف المنتج بنجاح',
                icon: 'success',
                confirmButtonColor: '#ff3c00'
            });
        }
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        await Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء حذف المنتج',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
};

// تحرير منتج
window.editProduct = async (productId) => {
    try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const product = docSnap.data();
            document.getElementById('modalTitle').textContent = 'تعديل المنتج';
            document.getElementById('productCode').value = product.code || '';
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productPrice').value = product.price || 0;
            document.getElementById('productQuantity').value = product.quantity || 0;
            document.getElementById('productStatus').value = product.status || 'active';
            document.getElementById('productId').value = productId;
            document.getElementById('productModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات المنتج:', error);
        await Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء تحميل بيانات المنتج',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
};

// إضافة/تحديث منتج
// إزالة مستمع النموذج المكرر
// احذف هذا الجزء من الكود
/*
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productData = {
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        quantity: parseInt(document.getElementById('productQuantity').value) || 0,
        status: document.getElementById('productStatus').value,
        updatedAt: new Date()
    };

    try {
        const productId = document.getElementById('productId').value;
        if (productId) {
            await updateDoc(doc(db, 'products', productId), productData);
        } else {
            await addDoc(collection(db, 'products'), productData);
        }
        closeProductModal();
    } catch (error) {
        console.error('خطأ في حفظ المنتج:', error);
        alert('حدث خطأ أثناء حفظ المنتج');
    }
});
*/

// فتح نافذة إضافة منتج جديد
window.openAddProductModal = () => {
    document.getElementById('modalTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.remove('hidden');
};

// إغلاق النافذة المنبثقة
window.closeProductModal = () => {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
};