document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    updateDateTime();
    bindEvents();
    setInterval(updateDateTime, 1000);
}

function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = dateTimeString;
}

function bindEvents() {
    const form = document.getElementById('entryForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // 付款方式切換
    const paymentInputs = document.querySelectorAll('input[name="paymentType"]');
    paymentInputs.forEach(input => {
        input.addEventListener('change', handlePaymentTypeChange);
    });

    // 頁面導航控制
    const navItems = document.querySelectorAll('.nav-item');
    
    function switchPage(targetId) {
        // 隱藏所有頁面
        document.querySelectorAll('.page-section').forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden');
        });

        // 顯示目標頁面
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            // 使用 setTimeout 確保 CSS 轉場效果
            setTimeout(() => {
                targetPage.classList.add('active');
            }, 10);
        }
    }

    // 綁定導航點擊事件
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // 更新導航項目狀態
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 切換頁面
            const targetPage = item.getAttribute('data-page');
            switchPage(targetPage);
        });
    });

    // 初始顯示入場登記頁面
    switchPage('entryForm');

    // 系統時間顯示
    const timeDisplay = document.getElementById('currentTime');
    if (timeDisplay) {
        const updateTime = () => {
            timeDisplay.textContent = new Date().toLocaleTimeString();
        };
        updateTime();
        setInterval(updateTime, 1000);
    }
}
