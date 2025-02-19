// 注入FFmpeg.js
const script = document.createElement('script');
script.src = chrome.runtime.getURL('lib/ffmpeg.min.js');
document.head.appendChild(script);

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .xiaoyuzhou-download-btn {
        background-color: #1890ff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin: 10px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.3s ease;
    }
    .xiaoyuzhou-download-btn:hover {
        background-color: #40a9ff;
        transform: translateY(-1px);
    }
    .xiaoyuzhou-download-btn.searching {
        background-color: #f0f0f0;
        color: #666;
        cursor: wait;
    }
    .xiaoyuzhou-download-btn.error {
        background-color: #ff4d4f;
    }
    .xiaoyuzhou-download-status {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: #1890ff;
        color: white;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
`;
document.head.appendChild(style);

// 主要功能代码
function init() {
    console.log('初始化下载器...');
    
    // 避免重复添加按钮
    const existingButton = document.querySelector('.xiaoyuzhou-download-btn');
    if (existingButton) {
        existingButton.remove();
    }

    // 创建下载按钮
    const downloadButton = document.createElement('button');
    downloadButton.className = 'xiaoyuzhou-download-btn searching';
    downloadButton.innerHTML = `<i>🔍</i><span>查找音频中...</span>`;

    // 插入按钮
    const title = document.querySelector('.episode-title') || 
                 document.querySelector('.jsx-399326063.title');
    if (title) {
        title.parentNode.insertBefore(downloadButton, title.nextSibling);
    }

    // 查找音频元素
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = setInterval(() => {
        attempts++;
        const audioElement = document.querySelector('audio');
        
        if (audioElement) {
            clearInterval(checkInterval);
            downloadButton.innerHTML = `<i>⬇️</i><span>下载音频</span>`;
            downloadButton.classList.remove('searching');
            
            downloadButton.addEventListener('click', () => {
                const audioUrl = audioElement.src;
                if (audioUrl) {
                    if (audioUrl.includes('.m4a')) {
                        showNotification('检测到M4A格式，正在转换为MP3...');
                        convertM4AtoMP3(audioUrl);
                    } else {
                        downloadAudio(audioUrl);
                    }
                }
            });
        }
        
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            downloadButton.innerHTML = `<i>⚠️</i><span>未找到音频</span>`;
            downloadButton.classList.add('error');
        }
    }, 1000);
}

// 显示通知
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'xiaoyuzhou-download-status';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, duration);
}

// 格式转换功能
async function convertM4AtoMP3(audioUrl) {
    try {
        showNotification('正在下载M4A文件...');
        
        // 获取音频数据
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        showNotification('正在转换为MP3格式...');
        
        // 创建 FFmpeg 实例
        const ffmpeg = createFFmpeg({ log: true });
        await ffmpeg.load();
        
        // 写入输入文件
        ffmpeg.FS('writeFile', 'input.m4a', new Uint8Array(arrayBuffer));
        
        // 执行转换
        await ffmpeg.run('-i', 'input.m4a', '-acodec', 'libmp3lame', '-q:a', '2', 'output.mp3');
        
        // 读取输出文件
        const data = ffmpeg.FS('readFile', 'output.mp3');
        
        // 获取文件名
        const title = document.querySelector('.episode-title')?.textContent || 
                     document.title || 
                     '小宇宙FM音频';
        const fileName = `${title}.mp3`.replace(/[\\/:*?"<>|]/g, '_');
        
        // 创建下载
        const blob = new Blob([data.buffer], { type: 'audio/mp3' });
        chrome.runtime.sendMessage({
            type: 'download',
            url: URL.createObjectURL(blob),
            filename: fileName
        });
        
        showNotification('MP3转换完成！');
        
    } catch (error) {
        console.error('转换失败:', error);
        showNotification('转换失败，请重试');
    }
}

// 下载功能
function downloadAudio(audioUrl) {
    if (!audioUrl) {
        showNotification('未找到音频文件');
        return;
    }
    
    const title = document.querySelector('.episode-title')?.textContent || 
                 document.title || 
                 '小宇宙FM音频';
    const fileName = `${title}.mp3`.replace(/[\\/:*?"<>|]/g, '_');
    
    chrome.runtime.sendMessage({
        type: 'download',
        url: audioUrl,
        filename: fileName
    });
    
    showNotification('开始下载...');
}

// 监听页面变化
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        if (url.includes('xiaoyuzhoufm.com/episode/')) {
            init();
        }
    }
}).observe(document, {subtree: true, childList: true});

// 初始化
init(); 