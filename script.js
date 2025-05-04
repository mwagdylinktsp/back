import {
    saveCompanyData,
    getCompanyData,
    addCustomer,
    getCustomers,
    deleteCustomer,
    addProduct,
    getProducts,
    deleteProduct,
    createInvoice
} from './src/services/firebaseService.js';

// معالجة نموذج الشركة
document.getElementById('companyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const companyData = {
        name: document.getElementById('companyName').value,
        address: document.getElementById('companyAddress').value,
        phone: document.getElementById('companyPhone').value,
        email: document.getElementById('companyEmail').value
    };

    const logoInput = document.getElementById('companyLogo');
    const logoFile = logoInput.files[0];

    try {
        await saveCompanyData(companyData, logoFile);
        alert('Done saving company data');
    } catch (error) {
        console.error('Error saving company data:', error);
        alert('Error saving company data');
    }
});

// معالجة تحميل الصورة
document.getElementById('companyLogo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoPreview = document.getElementById('logoPreview');
            logoPreview.src = e.target.result;
            logoPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// معالجة نموذج العملاء
document.getElementById('customerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const customer = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value
    };
    
    if (!customer.name || !customer.email || !customer.phone) {
        alert('All fields are required');
        return;
    }
    
    try {
        await addCustomer(customer);
        this.reset();
        await displayCustomers();
        alert('CLient added successfully');
    } catch (error) {
        console.error('Error adding Client:', error);
        alert('Error adding Client');
    }
});

// عرض العملاء
async function displayCustomers() {
    try {
        const customers = await getCustomers();
        const customersList = document.getElementById('customersList');
        const customerSelect = document.getElementById('invoiceCustomer');
        
        if (customers.length === 0) {
            customersList.innerHTML = '<p>No Clients found</p>';
            customerSelect.innerHTML = '<option value="">Choose a Client</option>';
            return;
        }

        customersList.innerHTML = customers.map(customer => `
            <div class="flex justify-between items-center p-4 bg-gray-100 rounded mb-2">
                <div>
                    <p class="font-bold">${customer.name}</p>
                    <p>${customer.email}</p>
                    <p>${customer.phone}</p>
                </div>
                <button onclick="window.deleteCustomerHandler('${customer.id}')" class="text-red-500">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        customerSelect.innerHTML = `
            <option value="">Choose a Client</option>
            ${customers.map(customer => `
                <option value="${customer.id}">${customer.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error displaying Clients:', error);
        alert('Error displaying Clients');
    }
}

// معالجة نموذج المنتجات
document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const product = {
        name: document.getElementById('productName').value,
        code: document.getElementById('productCode').value,
        price: parseFloat(document.getElementById('productPrice').value)
    };
    
    if (!product.name || !product.code || isNaN(product.price)) {
        alert('All fields are required');
        return;
    }
    
    try {
        await addProduct(product);
        this.reset();
        await displayProducts();
        alert('Product added successfully');
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product');
    }
});

// عرض المنتجات
async function displayProducts() {
    try {
        const products = await getProducts();
        const productsList = document.getElementById('productsList');
        const productSelect = document.getElementById('invoiceProduct');
        
        if (products.length === 0) {
            productsList.innerHTML = '<p>No products found</p>';
            productSelect.innerHTML = '<option value="">Choose a product</option>';
            return;
        }

        productsList.innerHTML = products.map(product => `
            <div class="flex justify-between items-center p-4 bg-gray-100 rounded mb-2">
                <div>
                    <p class="font-bold">${product.name}</p>
                    <p>Code: ${product.code}</p>
                    <p>Price: ${product.price} EGP</p>
                </div>
                <button onclick="window.deleteProductHandler('${product.id}')" class="text-red-500">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        productSelect.innerHTML = `
            <option value="">Choose a product</option>
            ${products.map(product => `
                <option value="${product.id}" data-price="${product.price}" data-code="${product.code}">
                    ${product.name}
                </option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error displaying products:', error);
        alert('Error displaying products');
    }
}

// حذف عميل
window.deleteCustomerHandler = async (id) => {
    if (confirm('Are you sure you want to delete this client?')) {
        try {
            await deleteCustomer(id);
            await displayCustomers();
            alert('Client deleted successfully');
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Error deleting client');
        }
    }
};

// حذف منتج
window.deleteProductHandler = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteProduct(id);
            await displayProducts();
            alert('Product deleted successfully');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    }
};

// إضافة منتج للفاتورة
window.addInvoiceItem = function() {
    const productSelect = document.getElementById('invoiceProduct');
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    if (!selectedOption.value) return;

    const quantity = parseInt(document.getElementById('invoiceQuantity').value);
    const discount = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
    const price = parseFloat(selectedOption.dataset.price);
    const total = (price * quantity) * (1 - discount / 100);

    const item = {
        productId: selectedOption.value,
        name: selectedOption.text,
        code: selectedOption.dataset.code,
        price: price,
        quantity: quantity,
        discount: discount,
        total: total
    };

    addItemToInvoiceTable(item);
    updateInvoiceTotal();
};

// إضافة صف للفاتورة
function addItemToInvoiceTable(item) {
    const tbody = document.getElementById('invoiceItems');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="p-2">${item.name}</td>
        <td class="p-2">${item.code}</td>
        <td class="p-2">${item.price}</td>
        <td class="p-2">${item.quantity}</td>
        <td class="p-2">${item.discount}%</td>
        <td class="p-2">${item.total.toFixed(2)}</td>
        <td class="p-2">
            <button onclick="this.closest('tr').remove(); updateInvoiceTotal();" class="text-red-500">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

// تحديث إجمالي الفاتورة
function updateInvoiceTotal() {
    const rows = document.getElementById('invoiceItems').getElementsByTagName('tr');
    let total = 0;
    for (let row of rows) {
        total += parseFloat(row.cells[5].textContent);
    }
    document.getElementById('invoiceTotal').textContent = total.toFixed(2);
}

// معالجة إنشاء الفاتورة
document.getElementById('invoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const rows = document.getElementById('invoiceItems').getElementsByTagName('tr');
    if (rows.length === 0) {
        alert('Please add at least one item to the invoice');
        return;
    }

    const items = [];
    for (let row of rows) {
        items.push({
            name: row.cells[0].textContent,
            code: row.cells[1].textContent,
            price: parseFloat(row.cells[2].textContent),
            quantity: parseInt(row.cells[3].textContent),
            discount: parseFloat(row.cells[4].textContent),
            total: parseFloat(row.cells[5].textContent)
        });
    }
    const invoiceData = {
        number: document.getElementById('invoiceNumber').value,
        date: document.getElementById('invoiceDate').value,
        customerId: document.getElementById('invoiceCustomer').value,
        paymentStatus: document.getElementById('paymentStatus').value,
        notes: document.getElementById('invoiceNotes').value,
        items: items,
        total: parseFloat(document.getElementById('invoiceTotal').textContent)
    };
    // const invoiceData = {
    //     number: document.getElementById('invoiceNumber').value,
    //     date: document.getElementById('invoiceDate').value,
    //     customerId: document.getElementById('invoiceCustomer').value,
    //     customerName: document.getElementById('invoiceCustomer').options[document.getElementById('invoiceCustomer').selectedIndex].text,
    //     paymentStatus: document.getElementById('paymentStatus').value,
    //     notes: document.getElementById('invoiceNotes').value,
    //     items: items,
    //     total: parseFloat(document.getElementById('invoiceTotal').textContent)
    // };

    try {
        const invoiceId = await createInvoice(invoiceData);
        alert('Invoice created successfully');
        
        // فتح الفاتورة في نافذة جديدة
        window.open(`view-invoice.html?id=${invoiceId}`, '_blank');
        
        // إعادة تعيين النموذج
        this.reset();
        document.getElementById('invoiceItems').innerHTML = '';
        document.getElementById('invoiceTotal').textContent = '0.00';
    } catch (error) {
        console.error('Error creating invoice:', error);
        alert('Error creating invoice');
    }
});

// تحميل البيانات عند بدء التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Starting to load data...');
    try {
        const companyData = await getCompanyData();
        if (companyData) {
            document.getElementById('companyName').value = companyData.name || '';
            document.getElementById('companyAddress').value = companyData.address || '';
            document.getElementById('companyPhone').value = companyData.phone || '';
            document.getElementById('companyEmail').value = companyData.email || '';
            
            if (companyData.logoUrl) {
                const preview = document.getElementById('logoPreview');
                preview.src = companyData.logoUrl;
                preview.classList.remove('hidden');
            }
        }
        
        await displayCustomers();
        await displayProducts();
        
        // تعيين تاريخ اليوم كقيمة افتراضية
        document.getElementById('invoiceDate').valueAsDate = new Date();
        
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data');
    }
});

