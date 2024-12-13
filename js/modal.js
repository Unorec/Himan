// Modal 控制系統
class ModalSystem {
    constructor() {
        this.initializeModal();
    }

    initializeModal() {
        // 創建 Modal HTML 結構
        const modalHTML = `
            <div id="modalOverlay" class="modal-overlay" style="display: none;">
                <div class="modal-container">
                    <div id="modalContent"></div>
                </div>
            </div>
        `;

        // 將 Modal 加入到 body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 綁定關閉事件
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }
    }

    showModal(content) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContent = document.getElementById('modalContent');
        if (modalOverlay && modalContent) {
            const sanitizedContent = typeof content === 'string' ? 
                content.replace(/</g, '&lt;').replace(/>/g, '&gt;') : content;
            modalContent.innerHTML = sanitizedContent;
            modalOverlay.style.display = 'flex';
        }
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }
}

// 創建全域實例
const modalSystem = new ModalSystem();

// 暴露給全域使用
window.showModal = (content) => modalSystem.showModal(content);
window.closeModal = () => modalSystem.closeModal();