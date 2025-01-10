document.addEventListener('DOMContentLoaded', function() {
    // 初始化頁面
    initializePage();
    
    // 監聽頁面切換
    window.addEventListener('hashchange', function() {
        handlePageChange();
    });
});

function initializePage() {
    // 如果沒有 hash，預設顯示入場頁面
    if (!window.location.hash) {
        window.location.hash = '#entry';
    }
    handlePageChange();
    
    window.onerror = function(msg, url, line, col, error) {
        console.error('發生錯誤:', {
            message: msg,
            url: url,
            line: line,
            column: col,
            error: error
        });
        
        // 顯示使用者友善的錯誤訊息
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = '系統發生錯誤，請重新整理頁面';
            errorMessage.style.display = 'block';
        }
        
        return false;
    };
}

function handlePageChange() {
    const hash = window.location.hash || '#entry';
    
    // 隱藏所有區段
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 顯示當前區段
    const currentSection = document.querySelector(hash);
    if (currentSection) {
        currentSection.style.display = 'block';
    }
    
    // 更新導航選中狀態
    updateNavigation(hash);
}

function updateNavigation(hash) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === hash);
    });
}

// 各個功能模組的初始化函數
function initEntryModule() {
    console.log('入場登記模組初始化');
    // 這裡將實現入場登記的具體邏輯
}

function initRecordsModule() {
    console.log('入場記錄模組初始化');
    // 這裡將實現入場記錄的具體邏輯
}

function initTicketsModule() {
    console.log('票券管理模組初始化');
    // 這裡將實現票券管理的具體邏輯
}

function initStatsModule() {
    console.log('營業報表模組初始化');
    // 這裡將實現營業報表的具體邏輯
}