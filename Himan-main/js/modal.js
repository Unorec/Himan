// 建立全域命名空間
window.modalModule = {
    currentModal: null
};

// 顯示 Modal
function showModal(content) {
    // 先關閉現有 modal
    closeModal();
    
    const modalHTML = `
        <div class="modal-container">
            <div class="modal-overlay" onclick="closeModal()"></div>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    window.modalModule.currentModal = document.querySelector('.modal-container');
    
    // 添加 ESC 監聽
    document.addEventListener('keydown', handleEscKey);
}

// 關閉 Modal
function closeModal() {
    const modalContainer = document.querySelector('.modal-container');
    if (modalContainer) {
        modalContainer.classList.add('closing');
        setTimeout(() => {
            modalContainer.remove();
            window.modalModule.currentModal = null;
        }, 300);
    }
    
    // 移除 ESC 監聽
    document.removeEventListener('keydown', handleEscKey);
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
