import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تأكد من وجود مجلد البيانات
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
}

export const DataStore = {
    company: {
        save: function(data) {
            writeFileSync(join(dataDir, 'company.json'), JSON.stringify(data, null, 2));
        },
        get: function() {
            try {
                return JSON.parse(readFileSync(join(dataDir, 'company.json')));
            } catch {
                return {};
            }
        }
    },
    customers: {
        getAll: function() {
            try {
                return JSON.parse(readFileSync(join(dataDir, 'customers.json')));
            } catch {
                return [];
            }
        },
        add: function(customer) {
            const customers = this.getAll();
            customers.push(customer);
            writeFileSync(join(dataDir, 'customers.json'), JSON.stringify(customers, null, 2));
        },
        remove: function(email) {
            const customers = this.getAll().filter(c => c.email !== email);
            writeFileSync(join(dataDir, 'customers.json'), JSON.stringify(customers, null, 2));
        }
    },
    products: {
        getAll: function() {
            try {
                return JSON.parse(readFileSync(join(dataDir, 'products.json')));
            } catch {
                return [];
            }
        },
        add: function(product) {
            const products = this.getAll();
            products.push(product);
            writeFileSync(join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
        },
        remove: function(code) {
            const products = this.getAll().filter(p => p.code !== code);
            writeFileSync(join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
        }
    },
    invoices: {
        getAll: function() {
            try {
                return JSON.parse(readFileSync(join(dataDir, 'invoices.json')));
            } catch {
                return [];
            }
        },
        add: function(invoice) {
            const invoices = this.getAll();
            
            // التحقق من عدم تكرار رقم الفاتورة
            if (invoices.some(inv => inv.invoiceNumber === invoice.invoiceNumber)) {
                throw new Error('Invoice number already exists');
            }
            
            invoices.push(invoice);
            writeFileSync(join(dataDir, 'invoices.json'), JSON.stringify(invoices, null, 2));
        },
        update: function(invoiceNumber, updatedInvoice) {
            const invoices = this.getAll();
            const index = invoices.findIndex(inv => inv.invoiceNumber === invoiceNumber);
            
            if (index === -1) {
                throw new Error('Invoice not found');
            }
            
            // تحديث الفاتورة مع الحفاظ على رقم الفاتورة الأصلي
            invoices[index] = { ...updatedInvoice, invoiceNumber };
            writeFileSync(join(dataDir, 'invoices.json'), JSON.stringify(invoices, null, 2));
        },
        remove: function(invoiceNumber) {
            const invoices = this.getAll().filter(inv => inv.invoiceNumber !== invoiceNumber);
            writeFileSync(join(dataDir, 'invoices.json'), JSON.stringify(invoices, null, 2));
        }
    }
};
