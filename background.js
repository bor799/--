chrome.runtime.onInstalled.addListener(() => {
  console.log('小宇宙FM音频转换器已安装');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'download') {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename
    });
  }
}); 