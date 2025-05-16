import { db, storage, auth } from '../firebase.js';
import {
    collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
    getDoc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import {
    createUserWithEmailAndPassword, updateEmail, updatePassword, deleteUser as deleteAuthUser
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

/* ==================== الشركة ==================== */
export async function getCompanyInfo() {
    const docRef = doc(db, 'company', 'info');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
}

export async function saveCompanyInfo(data) {
    const docRef = doc(db, 'company', 'info');
    await setDoc(docRef, data);
}

export const saveCompanyData = async (companyData, logoFile) => {
    let logoUrl = null;
    if (logoFile) {
        const storageRef = ref(storage, `logos/${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
    }
    const companiesRef = collection(db, 'companies');
    const snapshot = await getDocs(companiesRef);
    const updatedData = { ...companyData, updatedAt: new Date().toISOString() };
    if (logoUrl) updatedData.logoUrl = logoUrl;
    if (snapshot.empty) await addDoc(companiesRef, updatedData);
    else await updateDoc(doc(db, 'companies', snapshot.docs[0].id), updatedData);
};

export const getCompanyData = async () => {
    const snapshot = await getDocs(collection(db, 'companies'));
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

/* ==================== العملاء ==================== */
export const addCustomer = async (customerData) => {
    const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData, createdAt: new Date().toISOString()
    });
    return docRef.id;
};

export const getCustomers = async () => {
    const snapshot = await getDocs(collection(db, 'customers'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteCustomer = async (customerId) => {
    await deleteDoc(doc(db, 'customers', customerId));
};

/* ==================== المنتجات ==================== */
export const addProduct = async (productData) => {
    const docRef = await addDoc(collection(db, 'products'), {
        ...productData, createdAt: new Date().toISOString()
    });
    return docRef.id;
};

export const getProducts = async () => {
    const snapshot = await getDocs(collection(db, 'products'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteProduct = async (productId) => {
    await deleteDoc(doc(db, 'products', productId));
};

/* ==================== الفواتير ==================== */
export const createInvoice = async (invoiceData) => {
    let customer = null;
    if (invoiceData.customerId) {
        const customerSnap = await getDoc(doc(db, 'customers', invoiceData.customerId));
        if (customerSnap.exists()) customer = customerSnap.data();
    }
    const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData, customer, createdAt: new Date().toISOString()
    });
    return docRef.id;
};

// دالة للحصول على الفاتورة بواسطة المعرف
export async function getInvoiceById(invoiceId) {
    try {
        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.error('لا توجد فاتورة بهذا المعرف:', invoiceId);
            return null;
        }
    } catch (error) {
        console.error('خطأ في استرجاع الفاتورة:', error);
        throw error;
    }
}

export const getAllInvoices = async () => {
    const snapshot = await getDocs(collection(db, 'invoices'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateInvoice = async (invoiceId, updateData) => {
    await updateDoc(doc(db, 'invoices', invoiceId), {
        ...updateData, updatedAt: new Date().toISOString()
    });
};

export const updateInvoiceStatus = async (invoiceId, status) => {
    await updateDoc(doc(db, 'invoices', invoiceId), {
        status, updatedAt: new Date().toISOString()
    });
};

export const deleteInvoice = async (invoiceId) => {
    await deleteDoc(doc(db, 'invoices', invoiceId));
};

/* ==================== المستخدمين ==================== */
export const getUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createUser = async (userData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        customerId: userData.customerId || null,
        customerName: userData.customerName || null,
        active: true,
        createdAt: serverTimestamp()
    });
    return userCredential.user.uid;
};

export const updateUser = async (userId, userData) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        name: userData.name,
        role: userData.role,
        customerId: userData.customerId || null,
        customerName: userData.customerName || null,
        updatedAt: serverTimestamp()
    });
    
    const user = auth.currentUser;
    if (userData.email && user) {
        await updateEmail(user, userData.email);
        await updateDoc(userRef, { email: userData.email });
    }
    if (userData.password && user) await updatePassword(user, userData.password);
};

export const deleteUser = async (userId) => {
    const user = auth.currentUser;
    if (user) await deleteAuthUser(user);
    await deleteDoc(doc(db, 'users', userId));
};
