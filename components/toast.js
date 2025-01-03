(function() {
    'use strict';

    class ToastComponent extends window.HimanSystem.Module {
        constructor() {
            super();
            this.container = null;
            this._initialized = false;
            this._initTimeout = 15000; // 延長初始化超時時間至 15 秒
            this._maxRetries = 5; // 增加重試次數
            this._retryInterval = 2000; // 新增：重試間隔時間
            this._retryCount = 0;
            this._systemCheckInterval = 100; // 檢查系統核心的間隔
        }

        async initialize() {
            if (this._initialized) return this;

            console.debug('開始初始化 Toast 元件...');
            
            try {
                await this._initializeInternal();
                this._initialized = true;
                console.debug('Toast 初始化成功');
                return this;
            } catch (error) {
                console.error('Toast 初始化失敗:', error);
                throw error;
            }
        }

        async _waitForSystem() {
            const startTime = Date.now();
            
            while (Date.now() - startTime < this._initTimeout) {
                if (window.HimanSystem?.core?.isReady) {
                    console.debug('系統核心已就緒');
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, this._systemCheckInterval));
            }
            
            throw new Error('等待系統核心超時');
        }

        async _initializeInternal() {
            // 等待 DOM 載入完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }

        show(message, type = 'info') {
            if (!this._initialized) {
                console.warn('Toast 尚未初始化');
                return;
            }

            const toast = document.createElement('div');
            toast.className = `toast-message toast-${type}`;
            toast.textContent = message;

            this.container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    this.container.removeChild(toast);
                }, 300);
            }, 3000);
        }

        destroy() {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            this._initialized = false;
            this._retryCount = 0;
        }
    }

    // 只保留一次註冊
    const toast = new ToastComponent();
    const core = window.HimanSystem?.core;
    
    if (core) {
        core.registerModule('toast', toast);
    } else {
        console.error('系統核心未就緒，無法註冊 Toast 模組');
    }

    // 註冊全域方法
    window.showToast = async (message, type) => {
        if (!toast._initialized) {
            await toast.initialize();
        }
        toast.show(message, type);
    };
})();
