import { getAllInvoices, deleteInvoice } from './src/services/firebaseService.js';

// حذف فاتورة
window.deleteInvoiceHandler = async function(invoiceId, invoiceNumber) {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNumber}؟`)) {
        try {
            await deleteInvoice(invoiceId);
            alert('Invoice deleted successfully');
            // تحديث القائمة
            displayInvoices();
        } catch (error) {
            console.error('Error deleting invoice', error);
            alert('Error deleting invoice');
        }
    }
};

// عرض الفواتير
async function displayInvoices() {
    try {
        console.log('Starting to display invoices...');
        const invoices = await getAllInvoices();
        const invoicesList = document.getElementById('invoicesList');
        
        console.log('Retrieved invoices:', invoices);
        
        if (!invoices || invoices.length === 0) {
            invoicesList.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد فواتير</td></tr>';
            return;
        }

        // ترتيب الفواتير من الأحدث إلى الأقدم
        invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

        invoicesList.innerHTML = invoices.map(invoice => {
            console.log('Processing invoice:', invoice);
            
            // تنسيق التاريخ
            const date = new Date(invoice.date);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

            // تحديد لون حالة السداد وحساب المبلغ المتبقي
            let statusClass = '';
            let paymentInfo = '';
            const total = parseFloat(invoice.total) || 0;
            
            switch (invoice.paymentStatus) {
                case 'Paid':
                    statusClass = 'text-green-600';
                    paymentInfo = 'Fully Paid';
                    break;
                case 'Partially Paid':
                    statusClass = 'text-yellow-600';
                    const paidAmount = parseFloat(invoice.paidAmount) || 0;
                    const remaining = total - paidAmount;
                    paymentInfo = `Paid: ${paidAmount.toFixed(2)} | Remaining: ${remaining.toFixed(2)}`;
                    break;
                default:
                    statusClass = 'text-red-600';
                    paymentInfo = 'Not Paid';
            }

            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3">${invoice.number || 'N/A'}</td>
                    <td class="p-3">${formattedDate}</td>
                    <td class="p-3">${invoice.customerName || 'N/A'}</td>
                    <td class="p-3">${total.toFixed(2)} EGP</td>
                    <td class="p-3">
                        <span class="${statusClass}">
                            ${invoice.paymentStatus || 'N/A'}
                            <br>
                            <small>${paymentInfo}</small>
                        </span>
                    </td>
                    <td class="p-3">
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="window.open('view-invoice.html?id=${invoice.id}', '_blank')" 
                                    class="text-white px-3 py-1 rounded"
                                    style="background-color: #ff3c00; transition: background-color 0.2s;"
                                    onmouseover="this.style.backgroundColor='#cc3200';"
                                    onmouseout="this.style.backgroundColor='#ff3c00';"
                                    title="View Invoice">
                                <i class="far fa-eye"></i>
                            </button>
                            <button onclick="window.open('edit-invoice.html?id=${invoice.id}', '_blank')" 
                                    class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                    title="Edit Invoice">
                                <i class="far fa-edit"></i>
                            </button>
                            <button onclick="deleteInvoiceHandler('${invoice.id}', '${invoice.number}')" 
                                    class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    title="Delete Invoice">
                                <i class="far fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log('Finished displaying invoices');
    } catch (error) {
        console.error('Error displaying invoices', error);
        const invoicesList = document.getElementById('invoicesList');
        invoicesList.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-red-600">Error loading invoices</td></tr>';
    }
}

// تحميل الفواتير عند بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, starting to load invoices...');
    displayInvoices();
});
