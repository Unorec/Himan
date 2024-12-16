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

/**
 * 顯示/隱藏載入中動畫
 * @param {boolean|string} param - 若為 boolean 則控制顯示/隱藏，若為 string 則為顯示訊息
 */
export const showLoading = (param = true) => {
    // 如果已存在 loading overlay，先移除
    const existingOverlay = document.querySelector('.loading-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // 如果參數為 false，直接返回（相當於 hideLoading）
    if (param === false) return;

    // 建立新的 loading 元素
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${typeof param === 'string' ? param : '處理中...'}</div>
    `;
    document.body.appendChild(loading);
};

// 為了保持向後相容，建立 hideLoading 作為 showLoading(false) 的別名
export const hideLoading = () => showLoading(false);

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

/**
 * 顯示確認對話框
 * @param {string} message - 確認訊息
 * @param {Function} onConfirm - 確認回調
 * @param {Function} onCancel - 取消回調
 */
export const showConfirm = (message, onConfirm, onCancel) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-body">
                <p>${message}</p>
                <div class="form-actions">
                    <button class="primary-button" id="confirmBtn">確認</button>
                    <button class="secondary-button" id="cancelBtn">取消</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('confirmBtn').onclick = () => {
        modal.remove();
        onConfirm?.();
    };

    document.getElementById('cancelBtn').onclick = () => {
        modal.remove();
        onCancel?.();
    };
};

export default {
    showToast,
    showLoading,
    hideLoading,  // 加入 hideLoading 到預設導出
    showConfirm,
    switchModule,
    showModal,
    closeModal
};
