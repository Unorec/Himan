export const config = {
    appName: 'HiMAN管理系統',
    version: '1.0.0',
    apiBaseUrl: 'http://localhost:3000/api',
    storagePrefix: 'himan_',
    refreshTokenInterval: 1000 * 60 * 20, // 20分鐘
    toastDuration: 3000
};

export const navItems = [
    {
        id: 'entry',
        label: '入場登記',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
    },
    {
        id: 'members',
        label: '會員管理',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
    },
    {
        id: 'reports',
        label: '報表查詢',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
    }
];

window.HimanSystem = {
    debug: true,
    isElectron: true,
    config: {
        modules: {
            required: ['storage', 'auth', 'entry', 'stats'],
            optional: ['modal']
        }
    }
};
