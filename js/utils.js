// 更新時間計算相關函數
function calculateTimeRange(hours) {
    const now = new Date();
    const maxHours = 24;
    const validHours = Math.min(Math.max(1, hours), maxHours);
    const endTime = new Date(now.getTime() + validHours * 60 * 60 * 1000);
    
    return {
        start: now,
        end: endTime,
        hours: validHours
    };
}

// ...existing code...
