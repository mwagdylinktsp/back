// ... existing code ...
res.json({
    tickets: tickets.recordset || [], // التأكد من إرجاع مصفوفة فارغة إذا لم تكن هناك بيانات
    companies: companies.recordset || [],
    visits: visits.recordset || []
});
// ... existing code ...