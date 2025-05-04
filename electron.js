const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// إدارة حفظ وقراءة الفواتير
ipcMain.handle('saveInvoice', async (event, invoice) => {
    try {
        const dataHistoryPath = path.join(__dirname, 'DataHistory');
        if (!fs.existsSync(dataHistoryPath)) {
            fs.mkdirSync(dataHistoryPath);
        }

        const fileName = `invoice_${invoice.invoiceNumber}_${new Date(invoice.date).toISOString().split('T')[0]}.json`;
        const filePath = path.join(dataHistoryPath, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(invoice, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving invoice:', error);
        return false;
    }
});

ipcMain.handle('loadInvoices', async () => {
    try {
        const dataHistoryPath = path.join(__dirname, 'DataHistory');
        if (!fs.existsSync(dataHistoryPath)) {
            fs.mkdirSync(dataHistoryPath);
            return [];
        }

        const files = fs.readdirSync(dataHistoryPath);
        const invoices = [];

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

        return invoices.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA - dateB === 0) {
                return parseInt(a.invoiceNumber) - parseInt(b.invoiceNumber);
            }
            return dateA - dateB;
        });
    } catch (error) {
        console.error('Error loading invoices:', error);
        return [];
    }
});
