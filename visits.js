// دالة حذف الزيارة
window.deleteVisit = async (visitId) => {
    try {
        const result = await Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذه الزيارة؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff3c00',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            await deleteDoc(doc(db, 'visits', visitId));
            
            await Swal.fire({
                title: 'تم الحذف!',
                text: 'تم حذف الزيارة بنجاح',
                icon: 'success',
                confirmButtonColor: '#ff3c00'
            });
        }
    } catch (error) {
        console.error('خطأ في حذف الزيارة:', error);
        await Swal.fire({
            title: 'خطأ!',
            text: 'حدث خطأ أثناء حذف الزيارة',
            icon: 'error',
            confirmButtonColor: '#ff3c00'
        });
    }
};