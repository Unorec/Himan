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
    console.log('Loading content for section:', sectionId); // 調試用
    
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        console.error('Main content container not found');
        return;
    }

    try {
        switch (sectionId) {
            case 'entry':
                if (typeof loadEntrySection === 'function') {
                    await loadEntrySection();
                } else {
                    throw new Error('入場登記功能尚未載入');
                }
                break;
            case 'records':
                if (typeof loadRecordsSection === 'function') {
                    await loadRecordsSection();
                } else {
                    throw new Error('入場記錄功能尚未載入');
                }
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
        console.error('Error loading section content:', error);
        mainContent.innerHTML = `
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
        showToast('載入內容失敗', 'error');
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