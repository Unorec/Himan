// 測試結果處理器
class TestResultHandler {
    static handleTestResult(result) {
        try {
            const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
            
            switch (parsedResult.level) {
                case 'error':
                    console.error(`測試錯誤: ${parsedResult.description}`);
                    return false;
                    
                case 'fail':
                    console.warn(`測試失敗: ${parsedResult.description}`);
                    return false;
                    
                case 'warn':
                    console.warn(`測試警告: ${parsedResult.description}`);
                    return true;
                    
                case 'unsupported':
                    console.info(`不支援的測試: ${parsedResult.description}`);
                    return true;
                    
                default:
                    console.log(`測試結果: ${parsedResult.description}`);
                    return true;
            }
        } catch (error) {
            console.error('處理測試結果時發生錯誤:', error);
            return false;
        }
    }
}

// 將處理器掛載到全域
window.TestResultHandler = TestResultHandler;
