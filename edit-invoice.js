import { getInvoiceById, updateInvoice } from './src/services/firebaseService.js';

// Show/hide paid amount container
function togglePaidAmountContainer() {
    const paidAmountContainer = document.getElementById('paidAmountContainer');
    const paymentStatus = document.getElementById('paymentStatus');
    if (paymentStatus.value === 'Partially Paid') {
        paidAmountContainer.classList.remove('hidden');
    } else {
        paidAmountContainer.classList.add('hidden');
    }
}

// Load invoice data
async function loadInvoice() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const invoiceId = urlParams.get('id');
        
        if (!invoiceId) {
            alert('Invoice not selected');
            window.close();
            return;
        }

        const invoice = await getInvoiceById(invoiceId);
        if (!invoice) {
            alert('Invoice not found');
            window.close();
            return;
        }

        document.getElementById('invoiceNumber').value = invoice.number || '';
        document.getElementById('invoiceDate').value = invoice.date || '';
        document.getElementById('customerName').value = invoice.customerName || '';
        document.getElementById('paymentStatus').value = invoice.paymentStatus || '';
        document.getElementById('notes').value = invoice.notes || '';

        if (invoice.paymentStatus === 'Partially Paid') {
            document.getElementById('paidAmount').value = invoice.paidAmount || '';
        }

        // Ensure correct display of paid amount container
        togglePaidAmountContainer();

        window.currentInvoiceId = invoiceId;

    } catch (error) {
        console.error('Error loading invoice:', error);
        alert('Error loading invoice');
    }
}

// Save changes
window.saveChanges = async function() {
    try {
        const invoiceId = window.currentInvoiceId;
        if (!invoiceId) {
            alert('Invoice not selected');
            return;
        }

        const updateData = {
            date: document.getElementById('invoiceDate').value,
            status: document.getElementById('paymentStatus').value,
            notes: document.getElementById('notes').value,
            paidAmount: 0 // إضافة قيمة افتراضية صفر
        };

        if (updateData.status === 'Partially Paid') {
            const paidAmount = parseFloat(document.getElementById('paidAmount').value);
            if (isNaN(paidAmount) || paidAmount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            updateData.paidAmount = paidAmount;
        }

        await updateInvoice(invoiceId, updateData);
        alert('Changes saved successfully');
        window.opener.location.reload();
        window.close();

    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes');
    }
};

// Listen for payment status changes
document.getElementById('paymentStatus').addEventListener('change', togglePaidAmountContainer);

// Load invoice on page load
document.addEventListener('DOMContentLoaded', loadInvoice);

// تحديث دالة حذف المنتج من الفاتورة
window.removeProduct = async (index) => {
    try {
        const result = await Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذا المنتج من الفاتورة؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff3c00',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            products.splice(index, 1);
            updateProductsTable();
            calculateTotal();
            
            Swal.fire({
                title: 'تم الحذف!',
                text: 'تم حذف المنتج من الفاتورة بنجاح',
                icon: 'success',
                confirmButtonColor: '#ff3c00'
            });
        }
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء حذف المنتج',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
};
