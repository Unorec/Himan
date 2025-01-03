class ResourceManager {
    constructor() {
        this.loadedResources = new Set();
        this.loading = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.baseUrl = this.getBaseUrl();
    }

    getBaseUrl() {
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            if (script.src.includes('resourceManager.js')) {
                return script.src.substring(0, script.src.lastIndexOf('/') + 1);
            }
        }
        return window.location.origin + '/';
    }

    async loadResource(resource) {
        const { type, url } = resource;
        
        if (this.loadedResources.has(url)) {
            return Promise.resolve();
        }

        if (this.loading.has(url)) {
            return this.loading.get(url);
        }

        const loadPromise = type === 'script' ? 
            this.loadScript(url) : 
            this.loadStyle(url);

        this.loading.set(url, loadPromise);
        
        try {
            await loadPromise;
            this.loadedResources.add(url);
        } finally {
            this.loading.delete(url);
        }
        
        return loadPromise;
    }

    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`腳本載入失敗: ${url}`));
            document.head.appendChild(script);
        });
    }

    loadStyle(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = () => reject(new Error(`樣式表載入失敗: ${url}`));
            document.head.appendChild(link);
        });
    }

    async preloadResources(resources) {
        const promises = resources.map(resource => this.loadResource(resource));
        return Promise.all(promises);
    }
}

// 註冊到全域
window.HimanSystem.resourceManager = new ResourceManager();