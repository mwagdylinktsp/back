export interface Company {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
}

export interface Customer {
    name: string;
    email: string;
    phone: string;
}

export interface Product {
    code: string;
    name: string;
    price: number;
    description?: string;
}

export interface InvoiceItem {
    product: Product;
    quantity: number;
    price: number;
}

export interface Invoice {
    id: string;
    customer: Customer;
    items: InvoiceItem[];
    total: number;
    date: string;
    status: 'pending' | 'paid';
}
