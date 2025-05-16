// دالة حفظ الزيارة
async function saveVisit() {
    try {
        if (!validateVisitForm()) {
            await Swal.fire({
                title: 'خطأ!',
                text: 'يرجى ملء جميع الحقول المطلوبة',
                icon: 'error',
                confirmButtonColor: '#ff3c00'
            });
            return;
        }

        // ... existing code ...

        await Swal.fire({
            title: 'تم بنجاح!',
            text: 'تم حفظ الزيارة بنجاح',
            icon: 'success',
            confirmButtonColor: '#ff3c00'
        });

        window.location.href = 'visits.html';
    } catch (error) {
        console.error('خطأ في حفظ الزيارة:', error);
        await Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء حفظ الزيارة',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
}