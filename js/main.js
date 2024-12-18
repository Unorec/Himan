// 修正導入路徑（移除開頭的 ../）
import { showToast, showLoading } from './ui.js';
import { 
    initializeRecords, 
    displayRecords 
} from './records.js';
import { CONFIG } from './config.js';
import { getStorage, setStorage } from './storage.js';

// Storage Manager implementation
const storageManager = {
    getUserSession() {
        return getStorage('userSession');
    },
    setUserSession(session) {
        return setStorage('userSession', session);
    }
};

// 全域狀態管理
const app = {
    currentUser: null,
    currentSection: 'entry',
    isLoading: false
};

// 初始化主程式
const initializeMain = () => {
    // 註冊選單點擊事件
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            await loadSection(section);
        });
    });
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkLoginStatus();
    initializeMain();
    console.log('App version:', CONFIG.VERSION);
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

// 切換頁面區段
function switchSection(sectionId) {
    console.log('Switching to section:', sectionId); // 調試用
    
    // 更新目前區段
    app.currentSection = sectionId;
    
    // 顯示載入動畫
    showLoading(true);
    
    try {
        // 載入對應的內容
        loadSectionContent(sectionId);
    } catch (error) {
        console.error('Error switching section:', error);
        showToast('切換頁面失敗', 'error');
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

// 載入區段內容
async function loadSectionContent(sectionId) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        console.error('Main content container not found');
        return;
    }

    try {
        // 動態導入對應模組
        const module = await import(`./${sectionId}.js`);
        if (module.default && module.default.loadSection) {
            await module.default.loadSection();
        } else {
            mainContent.innerHTML = getDefaultContent(sectionId);
        }
    } catch (error) {
        console.error('Error loading section content:', error);
        mainContent.innerHTML = getErrorContent(error);
        showToast('載入內容失敗', 'error');
    }
}

// 取得預設內容
function getDefaultContent(sectionId) {
    const contentMap = {
        stats: '<div class="card"><div class="card-header"><h2>統計報表</h2></div><div class="card-body">統計報表功能開發中...</div></div>',
        settings: '<div class="card"><div class="card-header"><h2>系統設定</h2></div><div class="card-body">系統設定功能開發中...</div></div>',
        default: '<div class="card"><div class="card-header"><h2>功能不存在</h2></div><div class="card-body">請選擇其他功能</div></div>'
    };
    return contentMap[sectionId] || contentMap.default;
}

// 取得錯誤內容
function getErrorContent(error) {
    return `
        <div class="card">
            <div class="card-header">
                <h2>載入失敗</h2>
            </div>
            <div class="card-body">
                <p>載入內容時發生錯誤，請重新整理頁面或聯絡系統管理員。</p>
                <p>錯誤訊息：${error.message}</p>
            </div>
        </div>
    `;
}

// 修改載入區段函數
const loadSection = async (sectionName) => {
    try {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        showLoading(true);
        // 修改模組導入路徑
        const module = await import(`./${sectionName}.js`);
        if (module.default && typeof module.default.loadSection === 'function') {
            await module.default.loadSection();
        } else {
            throw new Error(`模組 ${sectionName} 載入失敗`);
        }
    } catch (error) {
        console.error('Section loading error:', error);
        showToast(`載入 ${sectionName} 失敗`, 'error');
    } finally {
        showLoading(false);
    }
};

// 更新路由處理
function handleRoute(hash) {
    const section = hash.split('?')[0].replace('#', '') || 'entry';
    const params = new URLSearchParams(hash.split('?')[1] || '');
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    switch(section) {
        case 'entry':
            const lockerId = params.get('locker');
            entryManager.renderView(lockerId);
            break;
        case 'records':
            recordsManager.renderView();
            break;
        case 'stats':
            statsManager.renderView();
            break;
        case 'settings':
            settingsManager.renderView();
            break;
    }
}

// 將需要的函數和物件掛載到 window 上
Object.assign(window, {
    app,
    showMainSystem,
    showLoginForm,
    switchSection
});

export default {
    initializeMain,
    loadSection
};