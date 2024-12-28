(function() {
    'use strict';

    const ToastSystem = {
        show(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };

    // 註冊到全域和模組系統
    window.showToast = ToastSystem.show;
    window.HimanSystem = window.HimanSystem || {};
    window.HimanSystem.toast = ToastSystem;
})();
