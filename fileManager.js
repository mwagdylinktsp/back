const FileManager = {
    // حفظ الفاتورة كملف JSON
    saveInvoiceToFile: function(invoice) {
        try {
            // إنشاء نص الملف
            const invoiceJson = JSON.stringify(invoice, null, 2);
            
            // إنشاء اسم الملف باستخدام رقم الفاتورة والتاريخ
            const date = new Date(invoice.date);
            const fileName = `invoice_${invoice.invoiceNumber}_${date.toISOString().split('T')[0]}.json`;
            
            // إنشاء مجلد DataHistory إذا لم يكن موجوداً
            const fs = require('fs');
            const path = require('path');
            const dataHistoryPath = path.join(__dirname, 'DataHistory');
            
            if (!fs.existsSync(dataHistoryPath)) {
                fs.mkdirSync(dataHistoryPath);
            }
            
            // حفظ الملف
            const filePath = path.join(dataHistoryPath, fileName);
            fs.writeFileSync(filePath, invoiceJson);
            
            return true;
        } catch (error) {
            console.error('Error saving invoice to file:', error);
            return false;
        }
    },

    // قراءة جميع الفواتير من المجلد
    loadAllInvoices: function() {
        try {
            const fs = require('fs');
            const path = require('path');
            const dataHistoryPath = path.join(__dirname, 'DataHistory');
            
            // إذا لم يكن المجلد موجوداً، قم بإنشائه وإرجاع مصفوفة فارغة
            if (!fs.existsSync(dataHistoryPath)) {
                fs.mkdirSync(dataHistoryPath);
                return [];
            }
            
            // قراءة جميع الملفات في المجلد
            const files = fs.readdirSync(dataHistoryPath);
            const invoices = [];
            
            // قراءة كل ملف وإضافته للمصفوفة
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const filePath = path.join(dataHistoryPath, file);
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    try {
                        const invoice = JSON.parse(fileContent);
                        invoices.push(invoice);
                    } catch (e) {
                        console.error(`Error reading file ${file}:`, e);
                    }
                }
            });
            
            // ترتيب الفواتير حسب التاريخ والرقم
            invoices.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateA - dateB === 0) {
                    return parseInt(a.invoiceNumber) - parseInt(b.invoiceNumber);
                }
                return dateA - dateB;
            });
            
            return invoices;
        } catch (error) {
            console.error('Error loading invoices:', error);
            return [];
        }
    }
};
