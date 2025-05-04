import { db, storage, auth} from '../firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc,
    query,
    where,
    getDoc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

// خدمات الشركة
export const saveCompanyData = async (companyData, logoFile) => {
    try {
        console.log('Saving company data:', companyData);
        let logoUrl = null;

        // رفع الصورة إذا تم تحديدها
        if (logoFile) {
            const storageRef = ref(storage, `logos/${logoFile.name}`);
            await uploadBytes(storageRef, logoFile);
            logoUrl = await getDownloadURL(storageRef);
        }

        const companiesRef = collection(db, 'companies');
        const snapshot = await getDocs(companiesRef);
        const updatedData = {
            ...companyData,
            updatedAt: new Date().toISOString()
        };

        if (logoUrl) {
            updatedData.logoUrl = logoUrl;
        }

        if (snapshot.empty) {
            await addDoc(companiesRef, updatedData);
        } else {
            const companyDoc = snapshot.docs[0];
            await updateDoc(doc(db, 'companies', companyDoc.id), updatedData);
        }
        console.log('Company data saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving company data:', error);
        throw error;
    }
};

export const getCompanyData = async () => {
    try {
        console.log('Get company data...');
        const companiesRef = collection(db, 'companies');
        const snapshot = await getDocs(companiesRef);
        if (!snapshot.empty) {
            const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            console.log('Company data retrieved:', data);
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error getting company data:', error);
        throw error;
    }
};

// خدمات العملاء
export const addCustomer = async (customerData) => {
    try {
        console.log('Adding new Client', customerData);
        const customersRef = collection(db, 'customers');
        const docRef = await addDoc(customersRef, {
            ...customerData,
            createdAt: new Date().toISOString()
        });
        console.log('Client added successfully', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding Client', error);
        throw error;
    }
};

export const getCustomers = async () => {
    try {
        console.log('Get clients list...');
        const customersRef = collection(db, 'customers');
        const snapshot = await getDocs(customersRef);
        const customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log('Clients list retrieved', customers);
        return customers;
    } catch (error) {
        console.error('Error getting clients list', error);
        throw error;
    }
};

export const deleteCustomer = async (customerId) => {
    try {
        console.log('Deleting Client: ', customerId);
        await deleteDoc(doc(db, 'customers', customerId));
        console.log('Client deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting Client', error);
        throw error;
    }
};

// خدمات المنتجات
export const addProduct = async (productData) => {
    try {
        console.log('Adding new product:', productData);
        const productsRef = collection(db, 'products');
        const docRef = await addDoc(productsRef, {
            ...productData,
            createdAt: new Date().toISOString()
        });
        console.log('Product added successfully.', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
};

export const getProducts = async () => {
    try {
        console.log('Get products list...');
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log('Products list retrieved.', products);
        return products;
    } catch (error) {
        console.error('Error getting products list:', error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        console.log('Deleting product:', productId);
        await deleteDoc(doc(db, 'products', productId));
        console.log('Product deleted successfully.');
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

// خدمات الفواتير
export const createInvoice = async (invoiceData) => {
    try {
        const invoicesRef = collection(db, 'invoices');

        let customer = null;
        if (invoiceData.customerId) {
            const customerRef = doc(db, 'customers', invoiceData.customerId);
            const customerSnap = await getDoc(customerRef);
            if (customerSnap.exists()) {
                customer = customerSnap.data(); // نسخة من بيانات العميل
            }
        }

        const docRef = await addDoc(invoicesRef, {
            ...invoiceData,
            customer, // دمج بيانات العميل snapshot
            createdAt: new Date().toISOString(),
        });

        return docRef.id;
    } catch (error) {
        throw error;
    }
};

export const getInvoiceById = async (invoiceId) => {
    try {
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const snapshot = await getDoc(invoiceRef);

        if (!snapshot.exists()) return null;

        const invoice = { id: snapshot.id, ...snapshot.data() };

        // في حالة مش متخزن customer، نجيبه من ID
        if (!invoice.customer && invoice.customerId) {
            const customerRef = doc(db, 'customers', invoice.customerId);
            const customerSnap = await getDoc(customerRef);
            if (customerSnap.exists()) {
                invoice.customer = customerSnap.data();
            }
        }

        return invoice;
    } catch (error) {
        throw error;
    }
};

// export const createInvoice = async (invoiceData) => {
//     try {
//         console.log('Creating new invoice:', invoiceData);
//         const invoicesRef = collection(db, 'invoices');
        
//         // تحويل الأسعار إلى أرقام
//         const items = invoiceData.items.map(item => ({
//             ...item,
//             price: parseFloat(item.price),
//             quantity: parseInt(item.quantity),
//             discount: parseFloat(item.discount || 0),
//             total: parseFloat(item.total)
//         }));

//         const docRef = await addDoc(invoicesRef, {
//             ...invoiceData,
//             items,
//             total: parseFloat(invoiceData.total),
//             createdAt: new Date().toISOString(),
//             status: invoiceData.paymentStatus || 'pending'
//         });
        
//         console.log('Invoice created successfully:', docRef.id);
//         return docRef.id;
//     } catch (error) {
//         console.error('Error creating invoice:', error);
//         throw error;
//     }
// };

export const getInvoices = async () => {
    try {
        console.log('Get invoices list...');
        const invoicesRef = collection(db, 'invoices');
        const snapshot = await getDocs(invoicesRef);
        const invoices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log('Invoices list retrieved:', invoices);
        return invoices;
    } catch (error) {
        console.error('Error getting invoices list:', error);
        throw error;
    }
};

// export const getInvoiceById = async (invoiceId) => {
//     try {
//         console.log('Get invoice:', invoiceId);
//         const invoiceRef = doc(db, 'invoices', invoiceId);
//         const snapshot = await getDoc(invoiceRef);
//         if (snapshot.exists()) {
//             const invoice = { id: snapshot.id, ...snapshot.data() };
//             console.log('Invoice retrieved:', invoice);
//             return invoice;
//         }
//         return null;
//     } catch (error) {
//         console.error('Error getting invoice:', error);
//         throw error;
//     }
// };

export const updateInvoiceStatus = async (invoiceId, status) => {
    try {
        console.log('Updating invoice status:', invoiceId, status);
        const invoiceRef = doc(db, 'invoices', invoiceId);
        await updateDoc(invoiceRef, { 
            status,
            updatedAt: new Date().toISOString()
        });
        console.log('Invoice status updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating invoice status:', error);
        throw error;
    }
};

export async function getAllInvoices() {
    try {
        console.log('Fetching invoices...');
        const invoicesRef = collection(db, 'invoices');
        const querySnapshot = await getDocs(invoicesRef);
        const invoices = [];
        
        querySnapshot.forEach((doc) => {
            invoices.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Fetched invoices:', invoices);
        return invoices;
    } catch (error) {
        console.error('Error getting invoices:', error);
        throw error;
    }
}

export async function updateInvoice(invoiceId, updateData) {
    try {
        const invoiceRef = doc(db, 'invoices', invoiceId);
        await updateDoc(invoiceRef, updateData);
        console.log('Invoice updated successfully');
    } catch (error) {
        console.error('Error updating invoice:', error);
        throw error;
    }
}

export async function deleteInvoice(invoiceId) {
    try {
        const invoiceRef = doc(db, 'invoices', invoiceId);
        await deleteDoc(invoiceRef);
        console.log('Invoice deleted successfully');
    } catch (error) {
        console.error('Error deleting invoice:', error);
        throw error;
    }
}