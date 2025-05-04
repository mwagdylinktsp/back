import { getInvoiceById, getCompanyData } from './src/services/firebaseService.js';

async function loadInvoice() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const invoiceId = urlParams.get('id');
        if (!invoiceId) {
            alert('Invoice not selected');
            return;
        }

        const invoice = await getInvoiceById(invoiceId);
        if (!invoice) {
            alert('Invoice not found');
            return;
        }

        const company = await getCompanyData();
        if (company) {
            document.getElementById('companyName').textContent = company.name || '';
            document.getElementById('companyAddress').textContent = company.address || '';
            document.getElementById('companyPhone').textContent = company.phone || '';
            document.getElementById('companyEmail').textContent = company.email || '';
            if (company.logoUrl) {
                const logoImg = document.getElementById('companyLogo');
                logoImg.src = company.logoUrl;
            }
        }

        document.title = `Invoice Number ${invoice.number}`;
        document.getElementById('invoiceNumber').textContent = `Invoice Number: ${invoice.number}`;
        document.getElementById('invoiceDate').textContent = `Date: ${new Date(invoice.date).toLocaleDateString('en-US')}`;

        const customer = invoice.customer || {};
        document.getElementById('customerName').innerHTML = `<strong>Name:</strong> ${customer.name || ''}`;
        document.getElementById('customerEmail').innerHTML = `<strong>Email:</strong> ${customer.email || ''}`;
        document.getElementById('customerPhone').innerHTML = `<strong>Phone:</strong> ${customer.phone || ''}`;

        const itemsHtml = invoice.items.map(item => `
            <tr class="border-b text-sm">
                <td class="p-3 text-right">${item.name}</td>
                <td class="p-3 text-right">${item.code}</td>
                <td class="p-3 text-right">${item.price.toFixed(2)} EGP</td>
                <td class="p-3 text-right">${item.quantity}</td>
                <td class="p-3 text-right">${item.discount}%</td>
                <td class="p-3 text-right">${item.total.toFixed(2)} EGP</td>
            </tr>
        `).join('');
        document.getElementById('invoiceItems').innerHTML = itemsHtml;

        document.getElementById('invoiceTotal').textContent = invoice.total.toFixed(2);

        const paymentStatusElement = document.getElementById('paymentStatus');
        const paymentDetailsElement = document.getElementById('paymentDetails');

        let statusClass = '';
        switch (invoice.paymentStatus) {
            case 'Paid':
                statusClass = 'text-green-600';
                break;
            case 'Unpaid':
                statusClass = 'text-red-600';
                break;
            default:
                statusClass = 'text-yellow-600';
        }

        paymentStatusElement.className = `mt-2 font-bold ${statusClass}`;
        paymentStatusElement.textContent = `Payment Status: ${invoice.paymentStatus}`;

        if (invoice.paymentStatus === 'Partially Paid' && invoice.paidAmount) {
            paymentDetailsElement.classList.remove('hidden');
            document.getElementById('paidAmount').textContent = invoice.paidAmount.toFixed(2);
            const remaining = invoice.total - invoice.paidAmount;
            document.getElementById('remainingAmount').textContent = remaining.toFixed(2);
        }

        if (invoice.notes) {
            document.getElementById('invoiceNotes').textContent = invoice.notes;
        } else {
            document.getElementById('notesSection').classList.add('hidden');
        }

    } catch (error) {
        console.error('Error loading invoice:', error);
        alert('Error loading invoice');
    }
}

document.addEventListener('DOMContentLoaded', loadInvoice);
