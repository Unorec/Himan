// 使用 IIFE 避免全域變數污染
window.HimanStorage = (function() {
  const VERSION = '1.0.0';
  let isInitialized = false;
  
  function initialize() {
    if (isInitialized) return true;
    
    console.log('初始化儲存模組...');
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      isInitialized = true;
      return true;
    } catch (e) {
      console.error('localStorage 不可用:', e);
      return false;
    }
  }

  return {
    isAvailable: initialize(),
    
    checkAvailability() {
      return isInitialized;
    },

    saveData(key, data) {
      if (!this.isAvailable) return false;
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('儲存資料失敗:', e);
        return false;
      }
    },

    getData(key) {
      if (!this.isAvailable) return null;
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.error('讀取資料失敗:', e);
        return null;
      }
    },

    removeData(key) {
      if (!this.isAvailable) return false;
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('刪除資料失敗:', e);
        return false;
      }
    },

    clearAll() {
      if (!this.isAvailable) return false;
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.error('清除所有資料失敗:', e);
        return false;
      }
    }
  };
})();
