(function() {
    'use strict';

    class ResourceLoader {
        constructor() {
            this.loadedResources = new Set();
            this.loading = new Map();
            this.retryAttempts = 3;
            this.retryDelay = 1000;
            this.debugMode = true;
            this.initialized = false;
            this.requiredResources = [
                'core.js',
                'module.js',
                'system.js'
            ];
            this.resourceRoot = this.detectResourceRoot();
        }

        detectResourceRoot() {
            // 優先使用 base 標籤
            const baseElement = document.querySelector('base');
            if (baseElement) {
                return baseElement.href;
            }

            // 其次檢查當前腳本路徑
            const scripts = document.getElementsByTagName('script');
            for (const script of scripts) {
                if (script.src.includes('resourceLoader.js')) {
                    return script.src.substring(0, script.src.lastIndexOf('/') + 1);
                }
            }

            // 最後使用當前頁面路徑
            const pathParts = window.location.pathname.split('/');
            pathParts.pop();
            return window.location.origin + pathParts.join('/') + '/';
        }

        async loadScript(url, options = {}) {
            try {
                const fullUrl = this.resolveUrl(url);
                if (this.debugMode) {
                    console.log('嘗試載入腳本:', fullUrl);
                }
                
                if (this.loadedResources.has(url)) {
                    return Promise.resolve();
                }

                if (this.loading.has(url)) {
                    return this.loading.get(url);
                }

                // 驗證資源是否存在
                if (!await this.verifyResource(fullUrl)) {
                    throw new Error(`資源不存在: ${fullUrl}`);
                }

                const loadPromise = this.tryLoadWithRetry(url, options);
                this.loading.set(url, loadPromise);
                return loadPromise;
            } catch (error) {
                this.logError(error, url);
                throw error;
            }
        }

        async tryLoadWithRetry(url, options, attempt = 1) {
            const fullUrl = this.resolveUrl(url);
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = fullUrl;
                script.async = options.async ?? true;
                script.crossOrigin = 'anonymous';  // 添加跨域支持

                const cleanup = () => {
                    script.onerror = null;
                    script.onload = null;
                };

                script.onload = () => {
                    cleanup();
                    this.loadedResources.add(url);
                    this.loading.delete(url);
                    if (this.debugMode) {
                        console.log('腳本載入成功:', fullUrl);
                    }
                    resolve();
                };

                script.onerror = async (error) => {
                    cleanup();
                    this.logError(error, fullUrl);
                    
                    if (attempt < this.retryAttempts) {
                        console.warn(`重試載入 (${attempt}/${this.retryAttempts}):`, fullUrl);
                        try {
                            await new Promise(r => setTimeout(r, this.retryDelay));
                            const result = await this.tryLoadWithRetry(url, options, attempt + 1);
                            resolve(result);
                        } catch (retryError) {
                            reject(retryError);
                        }
                    } else {
                        const finalError = new Error(`載入失敗 (${this.retryAttempts}次重試後): ${fullUrl}`);
                        this.loading.delete(url);
                        this.showError(`資源載入失敗: ${url.split('/').pop()}`);
                        reject(finalError);
                    }
                };

                // 添加載入超時處理
                const timeout = setTimeout(() => {
                    cleanup();
                    script.remove();
                    reject(new Error(`載入超時: ${fullUrl}`));
                }, 10000);  // 10秒超時

                script.addEventListener('load', () => {
                    clearTimeout(timeout);
                });

                script.addEventListener('error', () => {
                    clearTimeout(timeout);
                });

                document.head.appendChild(script);
            });
        }

        resolveUrl(url) {
            // 絕對路徑直接返回
            if (url.startsWith('http') || url.startsWith('//')) {
                return url;
            }

            // 移除開頭的 './' 或 '/'
            url = url.replace(/^\.\/|^\//, '');

            // 組合完整路徑
            return this.resourceRoot + url;
        }

        async verifyResource(url) {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                return response.ok;
            } catch (error) {
                console.warn(`資源驗證失敗: ${url}`, error);
                return false;
            }
        }

        logError(error, url) {
            const errorInfo = {
                url: url,
                error: error.message || '未知錯誤',
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                type: 'ResourceLoadError'
            };
            
            console.error('資源載入失敗:', errorInfo);
            
            // 可以在這裡添加錯誤上報邏輯
            if (window.errorReporter) {
                window.errorReporter.report(errorInfo);
            }
        }

        async loadStyle(url) {
            if (this.loadedResources.has(url)) {
                return Promise.resolve();
            }

            if (this.loading.has(url)) {
                return this.loading.get(url);
            }

            const loadPromise = new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;

                link.addEventListener('load', (event) => {
                    this.handleEvent(event);
                    this.loadedResources.add(url);
                    this.loading.delete(url);
                    resolve();
                }, { capture: true });

                link.addEventListener('error', (event) => {
                    this.handleEvent(event);
                    this.loading.delete(url);
                    reject(new Error(`樣式表載入失敗: ${url}`));
                }, { capture: true });

                document.head.appendChild(link);
            });

            this.loading.set(url, loadPromise);
            return loadPromise;
        }

        async checkResources() {
            try {
                const resources = Array.from(this.loadedResources.values());
                const missingResources = resources.filter(url => !this.isLoaded(url));
                
                if (missingResources.length > 0) {
                    console.warn('發現未載入的資源:', missingResources);
                    await Promise.all(
                        missingResources.map(url => this.loadResource(url))
                    );
                }
                
                return {
                    success: true,
                    loaded: this.loadedResources.size,
                    missing: missingResources.length
                };
            } catch (error) {
                console.error('資源檢查失敗:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        async loadResource(url) {
            if (url.endsWith('.js')) {
                return this.loadScript(url);
            } else if (url.endsWith('.css')) {
                return this.loadStyle(url);
            } else {
                throw new Error(`未知的資源類型: ${url}`);
            }
        }

        isLoaded(url) {
            return this.loadedResources.has(url);
        }

        clearCache() {
            this.loadedResources.clear();
        }

        handleEvent(event) {
            console.log('事件階段:', {
                capturing: event.eventPhase === Event.CAPTURING_PHASE,
                target: event.eventPhase === Event.AT_TARGET,
                bubbling: event.eventPhase === Event.BUBBLING_PHASE
            });
            
            // 記錄事件資訊
            this.logEventPhase(event);
        }

        logEventPhase(event) {
            const phases = {
                1: 'CAPTURING_PHASE',
                2: 'AT_TARGET',
                3: 'BUBBLING_PHASE'
            };
            
            console.debug('資源載入事件:', {
                phase: phases[event.eventPhase],
                type: event.type,
                target: event.target.tagName,
                currentTarget: event.currentTarget.tagName
            });
        }

        getLoadStatus() {
            return {
                total: this.loadedResources.size + this.loading.size,
                loaded: this.loadedResources.size,
                loading: this.loading.size,
                pending: Array.from(this.loading.keys()),
                completed: Array.from(this.loadedResources)
            };
        }

        async loadResources(resources) {
            if (this.initialized) return true;

            try {
                const missingCore = this.checkCoreResources();
                if (missingCore.length > 0) {
                    for (const resource of resources) {
                        await this.loadResource(resource);
                    }
                }
                
                this.initialized = true;
                return true;
            } catch (error) {
                console.warn('資源載入警告:', error);
                if (!this.initialized) {
                    this.showError('系統初始化中，請稍候...');
                }
                return false;
            }
        }

        checkCoreResources() {
            return this.requiredResources.filter(name => 
                !this.loadedResources.has(name) && 
                !document.querySelector(`script[src*="${name}"]`)
            );
        }

        showError(message) {
            // 防止重複顯示錯誤
            if (document.querySelector('.resource-error')) {
                return;
            }

            const errorDiv = document.createElement('div');
            errorDiv.className = 'resource-error';
            errorDiv.style.cssText = `
                position: fixed;
                inset-block-start: 20px;
                inset-inline-end: 20px;
                background: #ff9800;
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 9999;
                animation: slideIn 0.3s ease;
            `;
            errorDiv.textContent = message;
            
            // 3秒後自動移除
            setTimeout(() => {
                errorDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => errorDiv.remove(), 300);
            }, 3000);

            document.body.appendChild(errorDiv);
        }
    }

    // 註冊到全域命名空間
    window.HimanSystem = window.HimanSystem || {};
    window.HimanSystem.resourceLoader = new ResourceLoader();

    // 移除重複的初始化代碼，只保留事件監聽
    document.addEventListener('DOMContentLoaded', () => {
        const resources = [
            { type: 'style', url: './css/main.css' },
            { type: 'style', url: './css/components.css' },
            { type: 'script', url: './js/core/core.js' },
            { type: 'script', url: './js/core/module.js' }
        ];
        window.HimanSystem.resourceLoader.loadResources(resources);
    });
})();
