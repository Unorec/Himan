// 移除重複的 Toast 類，使用現有的 ToastComponent
if (!window.HimanSystem?.toast) {
    window.HimanSystem = window.HimanSystem || {};
    window.HimanSystem.toast = new (window.HimanSystem.ToastComponent || class {
        show(message, type = 'info') {
            console.warn('Toast 系統尚未初始化');
            console.log(message, type);
        }
    })();
}

// 全域輔助函數
window.showToast = (message, type) => {
    window.HimanSystem.toast.show(message, type);
};
