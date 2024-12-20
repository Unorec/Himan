// 建立全域命名空間
window.modalModule = {
    currentModal: null
};

// 顯示 Modal
function showModal(content) {
    try {
        // 建立 Modal 結構
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        modalContainer.innerHTML = content;
        
        modalOverlay.appendChild(modalContainer);
        document.body.appendChild(modalOverlay);
        
        // 儲存當前 Modal 參考
        modalModule.currentModal = modalOverlay;

        // 點擊背景關閉
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        // ESC 鍵關閉
        document.addEventListener('keydown', handleEscKey);
        
    } catch (error) {
        console.error('Show modal error:', error);
        if (window.showToast) {
            window.showToast('顯示視窗失敗', 'error');
        }
    }
}

// 關閉 Modal
function closeModal() {
    try {
        if (modalModule.currentModal) {
            document.body.removeChild(modalModule.currentModal);
            modalModule.currentModal = null;
        }
        // 移除 ESC 鍵監聽
        document.removeEventListener('keydown', handleEscKey);
    } catch (error) {
        console.error('Close modal error:', error);
    }
}

// ESC 鍵處理
function handleEscKey(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

// 掛載到全域
window.showModal = showModal;
window.closeModal = closeModal;

// 標記模組已載入
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.modal = true;
