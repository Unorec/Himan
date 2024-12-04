// server.js
const express = require('express');
const app = express();
const port = 3000;

// 假設紀錄儲存在一個陣列中
let records = [];

// 清空紀錄的路由
app.delete('/api/clear-records', (req, res) => {
    records = [];
    res.send({ message: '紀錄已清空' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
