import { getInvoiceById, updateInvoice } from './src/services/firebaseService.js';

// تحميل بيانات الفاتورة
async function loadInvoice() {
    try {
        // الحصول على معرف الفاتورة من URL
        const urlParams = new URLSearchParams(window.location.search);
        const invoiceId = urlParams.get('id');
        
        if (!invoiceId) {
            alert('Invoice not selected');
            window.close();
            return;
        }

        // جلب بيانات الفاتورة
        const invoice = await getInvoiceById(invoiceId);
        if (!invoice) {
            alert('Invoice not found');
            window.close();
            return;
        }

        // تعبئة البيانات في النموذج
        document.getElementById('invoiceNumber').value = invoice.number || '';
        document.getElementById('invoiceDate').value = invoice.date || '';
        document.getElementById('customerName').value = invoice.customerName || '';
        document.getElementById('paymentStatus').value = invoice.paymentStatus || 'Unpaid';
        document.getElementById('notes').value = invoice.notes || '';
        
        if (invoice.paymentStatus === 'Partially Paid') {
            document.getElementById('paidAmountContainer').classList.remove('hidden');
            document.getElementById('paidAmount').value = invoice.paidAmount || '';
        }

        // حفظ معرف الفاتورة للاستخدام لاحقاً
        window.currentInvoiceId = invoiceId;

    } catch (error) {
        console.error('Error loading invoice:', error);
        alert('Error loading invoice');
    }
}

// حفظ التغييرات
window.saveChanges = async function() {
    try {
        const invoiceId = window.currentInvoiceId;
        if (!invoiceId) {
            alert('Invoice not selected');
            return;
        }

        const updateData = {
            date: document.getElementById('invoiceDate').value,
            paymentStatus: document.getElementById('paymentStatus').value,
            notes: document.getElementById('notes').value
        };

        // إضافة المبلغ المدفوع إذا كانت الحالة مسدد جزئياً
        if (updateData.paymentStatus === 'Partially Paid') {
            const paidAmount = parseFloat(document.getElementById('paidAmount').value);
            if (isNaN(paidAmount) || paidAmount <= 0) {
                alert('Please enter a valid paid amount');
                return;
            }
            updateData.paidAmount = paidAmount;
        }

        await updateInvoice(invoiceId, updateData);
        alert('Changes saved successfully');
        window.opener.location.reload(); // تحديث صفحة سجل الفواتير
        window.close();

    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes');
    }
};

// إظهار/إخفاء حقل المبلغ المدفوع حسب حالة السداد
document.getElementById('paymentStatus').addEventListener('change', function(e) {
    const paidAmountContainer = document.getElementById('paidAmountContainer');
    if (e.target.value === 'Partially Paid') {
        paidAmountContainer.classList.remove('hidden');
    } else {
        paidAmountContainer.classList.add('hidden');
    }
});

// تحميل الفاتورة عند فتح الصفحة
document.addEventListener('DOMContentLoaded', loadInvoice);
