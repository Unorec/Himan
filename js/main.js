// 全域狀態管理
const app = {
    currentUser: null,
    currentSection: 'entry',
    isLoading: false
};

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkLoginStatus();
});

// 初始化所有事件監聽
function initializeEventListeners() {
    // 主選單點擊事件
    document.querySelectorAll('.main-menu .menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            switchSection(section);
            
            // 更新選中狀態
            document.querySelectorAll('.main-menu .menu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            e.target.classList.add('active');
        });
    });
}

// 檢查登入狀態
function checkLoginStatus() {
    const session = storageManager.getUserSession();
    if (session) {
        app.currentUser = session.username;
        document.getElementById('currentUser').textContent = session.username;
        showMainSystem();
    } else {
        showLoginForm();
    }
}

// 修改切換頁面區段函數
async function switchSection(sectionId) {
    console.log(`開始切換至區段: ${sectionId}`);
    const startTime = performance.now();
    
    try {
        showLoading(true);
        app.currentSection = sectionId;
        
        // 檢查必要模組
        if (sectionId === 'entry' && !window.initializeEntrySection) {
            throw new Error('入場區段模組未正確載入');
        }

        // 更新選單狀態
        document.querySelectorAll('.main-menu .menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });

        // 載入對應內容
        await loadSectionContent(sectionId);
        
        const loadTime = performance.now() - startTime;
        console.log(`區段 ${sectionId} 載入完成，耗時: ${loadTime.toFixed(2)}ms`);

    } catch (error) {
        console.error('切換區段失敗:', error);
        showToast('載入頁面失敗: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 顯示主系統
function showMainSystem() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // 載入預設區段（入場登記）
    switchSection('entry');
}

// 顯示登入表單
function showLoginForm() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('mainSystem').style.display = 'none';
}

// 修改載入區段內容函數
async function loadSectionContent(sectionId) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        throw new Error('主內容區域未找到');
    }

    try {
        showLoading(true);

        // 檢查必要函數是否已載入
        if (sectionId === 'records' && typeof window.loadRecordsSection !== 'function') {
            throw new Error('記錄功能尚未載入完成，請稍後再試');
        }

        switch (sectionId) {
            case 'entry':
                await loadEntrySection();
                break;
            case 'records':
                await window.loadRecordsSection();
                break;
            case 'stats':
                mainContent.innerHTML = '<div class="card"><div class="card-header"><h2>統計報表</h2></div><div class="card-body">統計報表功能開發中...</div></div>';
                break;
                
            case 'settings':
                mainContent.innerHTML = '<div class="card"><div class="card-header"><h2>系統設定</h2></div><div class="card-body">系統設定功能開發中...</div></div>';
                break;
                
            default:
                mainContent.innerHTML = '<div class="card"><div class="card-header"><h2>功能不存在</h2></div><div class="card-body">請選擇其他功能</div></div>';
        }
    } catch (error) {
        console.error('Error loading section:', error);
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>載入失敗</h2>
                </div>
                <div class="card-body error-message">
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="primary-button">
                        重新整理頁面
                    </button>
                </div>
            </div>
        `;
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 將需要的函數和物件掛載到 window 上
window.app = app;
window.showToast = showToast;
window.showLoading = showLoading;
window.showMainSystem = showMainSystem;
window.showLoginForm = showLoginForm;
window.switchSection = switchSection;

// 輔助函數
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

function showLoading(show = true) {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}