export function canAccessContracts(currentUser) {
  return currentUser.role === 'admin';
}

export function canAccessCustomers(currentUser) {
  return currentUser.role === 'admin';
}

export function canAccessProducts(currentUser) {
  return currentUser.role === 'admin';
}

export function canAccessCreateInvoice(currentUser) {
  return currentUser.role === 'admin';
}

export function canAccessCompanySettings(currentUser) {
  return currentUser.role === 'admin';
}

export function canAccessUsers(currentUser) {
  return currentUser.role === 'admin' || currentUser.role === 'manager';
}

export function canAccessInvoicesHistory(currentUser) {
  return currentUser.role === 'admin' || currentUser.role === 'manager';
}

export function canAccessTickets(currentUser) {
  return currentUser.role !== 'user' ? true : true; // الكل يقدر يدخل للتذاكر
}

export function canAccessVisits(currentUser) {
  return currentUser.role !== 'user' ? true : true; // الكل يقدر يدخل للزيارات
}

export function canAccessUserProfile(currentUser) {
  return true; // الكل يقدر يفتح صفحة البروفايل
}
