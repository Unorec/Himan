// UI 相關工具函數

// 顯示 Toast 訊息
export const showToast = (message, type = 'info') => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
};

// 顯示/隱藏載入中動畫
export const showLoading = (show = true) => {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
};

// 顯示確認對話框
export const showConfirm = (message) => {
    return confirm(message);
};

// 切換模組顯示
export const switchModule = (moduleName) => {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    // 移除所有現有內容
    mainContent.innerHTML = '';
    
    // 顯示載入中動畫
    showLoading(true);
    
    // 動態載入對應模組
    import(`./js/${moduleName}.js`)
        .then(module => {
            if (module.default && module.default.loadSection) {
                module.default.loadSection();
            }
        })
        .catch(error => {
            console.error(`Error loading module ${moduleName}:`, error);
            showToast(`載入 ${moduleName} 失敗`, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
};

// 顯示模態框
export const showModal = (content, title = '') => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-button">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const closeButton = modal.querySelector('.close-button');
    closeButton.onclick = () => closeModal(modal);
};

// 關閉模態框
export const closeModal = (modal) => {
    if (modal && modal.parentElement) {
        modal.parentElement.removeChild(modal);
    }
};

export default {
    showToast,
    showLoading,
    showConfirm,
    switchModule,
    showModal,
    closeModal
};
