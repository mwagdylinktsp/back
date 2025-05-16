import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase.js';

async function loadInvoiceData() {
    try {
        // استخراج معرف الفاتورة من URL
        const urlParams = new URLSearchParams(window.location.search);
        const invoiceId = urlParams.get('id');
        
        if (!invoiceId) {
            alert('لم يتم العثور على معرف الفاتورة');
            return;
        }

        // استرجاع بيانات الفاتورة من Firestore
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            alert('لم يتم العثور على الفاتورة');
            return;
        }

        const invoice = invoiceSnap.data();

        // عرض بيانات الفاتورة
        document.getElementById('invoiceNumber').textContent = invoice.number;
        document.getElementById('invoiceDate').textContent = new Date(invoice.date).toLocaleDateString('ar-EG');
        document.getElementById('customerName').textContent = invoice.customerName;
        document.getElementById('customerEmail').textContent = invoice.customerEmail || '';
        document.getElementById('customerPhone').textContent = invoice.customerPhone || '';

        // عرض تفاصيل المنتجات
        const invoiceItems = document.getElementById('invoiceItems');
        invoiceItems.innerHTML = invoice.items.map(item => `
            <tr class="border-b">
                <td class="p-3 text-right">${item.name}</td>
                <td class="p-3 text-right">${item.code || '-'}</td>
                <td class="p-3 text-right">${item.price} جنيه</td>
                <td class="p-3 text-right">${item.quantity}</td>
                <td class="p-3 text-right">${item.discount || 0}%</td>
                <td class="p-3 text-right">${item.total} جنيه</td>
            </tr>
        `).join('');

        // عرض الإجمالي والمدفوعات
        document.getElementById('invoiceTotal').textContent = invoice.total;
        
        if (invoice.paidAmount > 0) {
            document.getElementById('paymentDetails').classList.remove('hidden');
            document.getElementById('paidAmount').textContent = invoice.paidAmount;
            document.getElementById('remainingAmount').textContent = invoice.total - invoice.paidAmount;
        }

        // عرض حالة الدفع
        document.getElementById('paymentStatus').textContent = invoice.status || 'Unpaid';
        
        // عرض الملاحظات
        if (invoice.notes) {
            document.getElementById('invoiceNotes').textContent = invoice.notes;
        } else {
            document.getElementById('notesSection').classList.add('hidden');
        }

    } catch (error) {
        console.error('خطأ في تحميل بيانات الفاتورة:', error);
        alert('حدث خطأ أثناء تحميل بيانات الفاتورة');
    }
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadInvoiceData);