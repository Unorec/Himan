   <div id="admin-settings">
       <h2>管理者專用設定區域</h2>
       <form id="admin-settings-form">
           <label for="account-management">班別帳號密碼管理</label>
           <input type="text" id="account-management" name="account-management">
           
           <label for="petty-cash">零用金設定</label>
           <input type="number" id="petty-cash" name="petty-cash">
           
           <label for="backup-settings">備份設定</label>
           <select id="backup-settings" name="backup-settings">
               <option value="automatic">自動備份</option>
               <option value="manual">手動備份</option>
           </select>
           
           <label for="monthly-report">每月日報表設定</label>
           <input type="date" id="monthly-report" name="monthly-report">
           
           <button type="submit">儲存設定</button>
       </form>
   </div>