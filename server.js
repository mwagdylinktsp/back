import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DataStore } from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3002; // تغيير المنفذ إلى 3001


// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '/dashboard.html'));
});

// API Routes
app.get('/api/company', (req, res) => {
    res.json(DataStore.company.get());
});

app.post('/api/company', (req, res) => {
    DataStore.company.save(req.body);
    res.json({ success: true });
});

app.get('/api/customers', (req, res) => {
    res.json(DataStore.customers.getAll());
});

app.post('/api/customers', (req, res) => {
    DataStore.customers.add(req.body);
    res.json({ success: true });
});

app.delete('/api/customers/:email', (req, res) => {
    DataStore.customers.remove(req.params.email);
    res.json({ success: true });
});

app.get('/api/products', (req, res) => {
    res.json(DataStore.products.getAll());
});

app.post('/api/products', (req, res) => {
    DataStore.products.add(req.body);
    res.json({ success: true });
});

app.delete('/api/products/:code', (req, res) => {
    DataStore.products.remove(req.params.code);
    res.json({ success: true });
});

// إضافة نقاط النهاية للفواتير
app.get('/api/invoices', (req, res) => {
    res.json(DataStore.invoices.getAll());
});

app.post('/api/invoices', (req, res) => {
    try {
        const invoice = req.body;
        invoice.date = new Date(invoice.date);
        invoice.createdAt = new Date();
        
        // التحقق من صحة حالة السداد
        if (!['Paid', 'Unpaid'].includes(invoice.paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        DataStore.invoices.add(invoice);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/invoices/:invoiceNumber', (req, res) => {
    try {
        const invoice = req.body;
        DataStore.invoices.update(req.params.invoiceNumber, invoice);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/invoices/:invoiceNumber', (req, res) => {
    DataStore.invoices.remove(req.params.invoiceNumber);
    res.json({ success: true });
});


// إضافة معالجة الأخطاء
process.on('uncaughtException', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} 'in use, trying another port`);
        setTimeout(() => {
            app.listen(port + 1);
        }, 1000);
    } else {
        console.error('Unexpected error:', err);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
