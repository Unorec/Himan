class SystemUI extends window.HimanSystem.Module {
    constructor() {
        super();
        this.loginWrapper = document.querySelector('.login-wrapper');
        this.mainSystem = document.querySelector('#mainSystem');
    }

    async moduleSetup() {
        const authManager = this.getModule('auth');
        
        // 監聽認證狀態變化
        authManager.on('auth:statusChanged', (status) => {
            if (status.isAuthenticated) {
                this.showMainSystem();
            } else {
                this.showLogin();
            }
        });

        // 初始化檢查認證狀態
        if (authManager.isAuthenticated) {
            this.showMainSystem();
        }
    }

    showMainSystem() {
        if (this.loginWrapper && this.mainSystem) {
            this.loginWrapper.classList.add('hidden');
            this.mainSystem.classList.remove('hidden-system');
        }
    }

    showLogin() {
        if (this.loginWrapper && this.mainSystem) {
            this.loginWrapper.classList.remove('hidden');
            this.mainSystem.classList.add('hidden-system');
        }
    }
}

window.HimanSystem.core.registerModule('systemUI', new SystemUI(), ['auth']);
