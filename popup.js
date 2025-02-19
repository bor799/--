document.addEventListener('DOMContentLoaded', function() {
    // 检查当前标签页是否是小宇宙FM
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const isXiaoyuzhou = currentTab.url.includes('xiaoyuzhoufm.com/episode');
        
        const status = document.querySelector('.status p');
        if (isXiaoyuzhou) {
            status.textContent = '✅ 当前页面可以使用下载功能';
        } else {
            status.textContent = '⚠️ 请访问小宇宙FM播客页面';
        }
    });
}); 