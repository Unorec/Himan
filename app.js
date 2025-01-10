const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 設定靜態檔案目錄和 MIME 類型
app.use(express.static(path.join(__dirname, 'src'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// 設定安全標頭
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// 首頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
});
