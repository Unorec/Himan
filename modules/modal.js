class ModalModule extends window.HimanSystem.Module {
    constructor() {
        super();
        this.currentModal = null;
        this.isAnimating = false;
        this.isInitialized = false;
    }

    async moduleSetup() {
        // 清理已存在的模態框
        document.querySelectorAll('.modal-container').forEach(modal => modal.remove());
    }

    // 展現彈窗的優雅綻放
    showModal(content) {
        // 確保優雅的轉場
        if (this.currentModal) {
            this.closeModal();
        }

        // 譜寫彈窗的優雅結構
        const modalHTML = `
            <div class="modal-container" role="dialog" aria-modal="true">
                <div class="modal-overlay" aria-hidden="true"></div>
                <div class="modal-content" role="document">
                    ${content}
                </div>
            </div>
        `;

        // 將彈窗優雅地融入頁面
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 捕捉彈窗的靈魂
        this.currentModal = document.querySelector('.modal-container');
        
        // 優雅地處理焦點
        this.trapFocus();
        
        // 綁定互動的韻律
        this.bindEvents();

        // 展現優雅的入場動畫
        requestAnimationFrame(() => {
            this.currentModal.classList.add('modal-visible');
        });

        // 阻止背景的互動
        document.body.style.overflow = 'hidden';
    }

    // 譜寫優雅的關閉樂章
    closeModal() {
        if (!this.currentModal || this.isAnimating) return;
        
        this.isAnimating = true;
        
        // 優雅的離場動畫
        this.currentModal.classList.add('modal-closing');
        
        // 移除事件監聽器
        document.removeEventListener('keydown', this.handleEscKey);
        
        // 等待動畫的完美落幕
        setTimeout(() => {
            if (this.currentModal) {
                this.currentModal.remove();
                this.currentModal = null;
                
                // 釋放背景的互動
                document.body.style.overflow = '';
                
                this.isAnimating = false;
            }
        }, 300); // 動畫的優雅時長
    }

    trapFocus() {
        const focusableElements = this.currentModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // 設置初始焦點
        firstElement.focus();

        // 優雅地處理焦點循環
        this.currentModal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    // 綁定互動的優雅韻律
    bindEvents() {
        if (!this.currentModal) return;

        // 點擊遮罩層的優雅關閉
        const overlay = this.currentModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeModal());
        }

        // ESC按鍵的優雅退場
        document.addEventListener('keydown', this.handleEscKey);

        // 關閉按鈕的優雅呼應
        const closeButtons = this.currentModal.querySelectorAll('[data-close-modal]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModal());
        });
    }

    // ESC按鍵的優雅處理
    handleEscKey(e) {
        if (e.key === 'Escape' && this.currentModal && !this.isAnimating) {
            this.closeModal();
        }
    }

    // 創建確認對話框的優雅詩篇
    confirm(options) {
        const { title, message, confirmText = '確認', cancelText = '取消', 
                confirmClass = 'primary-button', cancelClass = 'secondary-button' } = options;

        return new Promise((resolve) => {
            const content = `
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="${cancelClass}" data-close-modal>
                            ${cancelText}
                        </button>
                        <button class="${confirmClass}" id="confirmButton">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            this.showModal(content);

            // 綁定確認的優雅回應
            const confirmButton = document.getElementById('confirmButton');
            if (confirmButton) {
                confirmButton.addEventListener('click', () => {
                    this.closeModal();
                    resolve(true);
                });

                // 綁定取消的優雅退場
                this.currentModal.querySelector('[data-close-modal]')
                    .addEventListener('click', () => {
                        resolve(false);
                    });
            }
        });
    }

    // 創建警告提示的優雅呈現
    alert(options) {
        const { title, message, buttonText = '確定', 
                buttonClass = 'primary-button' } = options;

        return new Promise((resolve) => {
            const content = `
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="${buttonClass}" id="alertButton">
                            ${buttonText}
                        </button>
                    </div>
                </div>
            `;

            this.showModal(content);

            // 綁定確認的優雅回應
            const alertButton = document.getElementById('alertButton');
            if (alertButton) {
                alertButton.addEventListener('click', () => {
                    this.closeModal();
                    resolve();
                });
            }
        });
    }

    async init() {
        try {
            const existingModals = document.querySelectorAll('.modal-container');
            existingModals.forEach(modal => modal.remove());
            
            document.removeEventListener('keydown', this.handleEscKey);
            
            this.isInitialized = true;
            console.log('模態框系統初始化完成');
            return true;
        } catch (error) {
            console.error('模態框系統初始化失敗:', error);
            return false;
        }
    }
}

window.HimanSystem.core.registerModule('modal', new ModalModule());

// 將彈窗系統優雅地融入全域
window.showModal = (content) => window.modalModule.showModal(content);
window.closeModal = () => window.modalModule.closeModal();
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.modal = true;