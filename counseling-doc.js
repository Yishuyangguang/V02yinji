/**
 * 恒久印记 - 极速云端富文本辅导文档引擎 (Google Docs Style)
 * 文件名: counseling-doc.js
 * 功能: 完美保留复制格式、支持直接拖拽多媒体文件上传 R2、管理员实时编辑
 */

(function initCounselingDocEngine() {
    // 1. 注入谷歌文档风格的极致 UI 样式
    if (!document.getElementById('counseling-doc-style')) {
        const style = document.createElement('style');
        style.id = 'counseling-doc-style';
        style.innerHTML = `
            .doc-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: var(--theme-bg-color); z-index: 9999;
                display: none; flex-direction: column; overflow: hidden;
                transition: opacity 0.3s;
            }
            
            /* 顶部导航与工具栏 */
            .doc-header {
                width: 100%; background: var(--theme-glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border-bottom: 1px solid var(--theme-glass-border); padding: 10px 20px;
                display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;
            }
            .doc-header-top { display: flex; justify-content: space-between; align-items: center; }
            .doc-title-input {
                background: transparent; border: none; color: var(--theme-text); font-size: 1.4rem; font-weight: bold;
                font-family: var(--font-title); outline: none; width: 60%; pointer-events: none;
            }
            .edit-mode .doc-title-input { pointer-events: auto; border-bottom: 1px dashed var(--theme-primary); }
            
            .doc-actions { display: flex; gap: 10px; }
            .btn-doc-close { background: transparent; border: 1px solid var(--theme-glass-border); color: var(--theme-text); padding: 6px 15px; border-radius: 15px; cursor: pointer; }
            .btn-doc-save { background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary)); border: none; color: #111; padding: 6px 20px; border-radius: 15px; font-weight: bold; cursor: pointer; display: none; }
            .edit-mode .btn-doc-save { display: block; }

            /* 仿 WPS/Google Docs 富文本工具栏 */
            .doc-toolbar {
                display: none; flex-wrap: wrap; gap: 5px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 12px;
            }
            .edit-mode .doc-toolbar { display: flex; }
            .doc-tool-btn {
                background: transparent; border: 1px solid transparent; color: var(--theme-text);
                width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold;
                display: flex; justify-content: center; align-items: center; transition: all 0.2s;
            }
            .doc-tool-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--theme-glass-border); }
            .doc-tool-separator { width: 1px; height: 20px; background: var(--theme-glass-border); margin: 0 5px; align-self: center; }

            /* A4 纸张沉浸式阅读区 */
            .doc-body-scroll {
                flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 30px 15px 80px 15px;
                background: rgba(0,0,0,0.1); scroll-behavior: smooth;
            }
            .doc-paper {
                background: var(--theme-glass-bg); color: var(--theme-text);
                width: 100%; max-width: 850px; min-height: 1050px;
                padding: clamp(30px, 8vw, 80px) clamp(20px, 6vw, 60px);
                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                outline: none; font-size: 1.1rem; line-height: 1.8; word-break: break-word;
            }
            .light-theme .doc-paper { background: #ffffff; color: #333; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
            
            /* 富文本内部媒体样式自适应 */
            .doc-paper img, .doc-paper video { max-width: 100%; height: auto; border-radius: 8px; margin: 15px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .doc-paper audio { width: 100%; margin: 15px 0; outline: none; }
            .doc-paper a.doc-file-link { display: inline-flex; align-items: center; background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 8px 15px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px dashed #6366f1; margin: 10px 0; }
            
            /* 拖拽上传遮罩层 */
            .doc-drag-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(99, 102, 241, 0.85); backdrop-filter: blur(5px);
                color: white; font-size: 1.5rem; font-weight: bold; border-radius: 8px;
                display: none; justify-content: center; align-items: center; z-index: 100;
                border: 3px dashed white; pointer-events: none;
            }
            .doc-paper.drag-over .doc-drag-overlay { display: flex; }
            
            [contenteditable="true"]:empty:before { content: attr(placeholder); opacity: 0.4; pointer-events: none; display: block; }
        `;
        document.head.appendChild(style);
    }

    // 2. 注入文档系统的 HTML 骨架
    const docModalHTML = `
        <div class="doc-modal-overlay" id="counseling-doc-modal">
            <div class="doc-header">
                <div class="doc-header-top">
                    <input type="text" class="doc-title-input" id="doc-title" placeholder="无标题文档" value="婚前辅导文档">
                    <div class="doc-actions">
                        <button class="btn-doc-close" onclick="window.closeCounselingDoc()">关 闭</button>
                        <button class="btn-doc-save" onclick="window.saveCounselingDoc()">云端保存</button>
                    </div>
                </div>
                <div class="doc-toolbar" id="doc-toolbar">
                    <button class="doc-tool-btn" onclick="document.execCommand('bold', false, null)" title="加粗">B</button>
                    <button class="doc-tool-btn" onclick="document.execCommand('italic', false, null)" style="font-style: italic;" title="斜体">I</button>
                    <button class="doc-tool-btn" onclick="document.execCommand('underline', false, null)" style="text-decoration: underline;" title="下划线">U</button>
                    <div class="doc-tool-separator"></div>
                    <button class="doc-tool-btn" onclick="document.execCommand('justifyLeft', false, null)" title="左对齐">⇦</button>
                    <button class="doc-tool-btn" onclick="document.execCommand('justifyCenter', false, null)" title="居中">⇨⇦</button>
                    <button class="doc-tool-btn" onclick="document.execCommand('justifyRight', false, null)" title="右对齐">⇨</button>
                    <div class="doc-tool-separator"></div>
                    <button class="doc-tool-btn" onclick="document.execCommand('insertUnorderedList', false, null)" title="项目符号">•</button>
                    <button class="doc-tool-btn" onclick="document.execCommand('insertOrderedList', false, null)" title="编号">1.</button>
                    <div class="doc-tool-separator"></div>
                    <button class="doc-tool-btn" onclick="document.getElementById('doc-file-upload').click()" title="插入图片/视频/文件" style="color:#d4af37;">📁 插入附件</button>
                    <input type="file" id="doc-file-upload" style="display:none;" multiple onchange="window.handleDocFileUpload(this)">
                </div>
            </div>
            <div class="doc-body-scroll">
                <div style="position:relative; width: 100%; max-width: 850px;">
                    <div class="doc-paper" id="doc-editor" placeholder="开始撰写辅导内容，或直接从网页、Word粘贴内容至此...\n\n(支持直接将电脑/手机里的图片、视频、音乐、PPT拖拽到此处自动上传)"></div>
                    <div class="doc-drag-overlay">松开鼠标，极速上传至当前位置</div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', docModalHTML);

    let currentDocId = null;

    // 3. 核心 API: 打开文档 (支持绑定不同的文档ID，实现多个按钮对应多个文章)
    window.openCounselingDoc = function(docId = 'default_counseling') {
        currentDocId = docId;
        
        // 数据结构初始化兼容
        if (!db.customDocs) db.customDocs = {};
        if (!db.customDocs[docId]) db.customDocs[docId] = { title: '婚前辅导', content: '' };

        const docData = db.customDocs[docId];
        document.getElementById('doc-title').value = docData.title || '无标题文档';
        document.getElementById('doc-editor').innerHTML = docData.content || '';

        const modal = document.getElementById('counseling-doc-modal');
        const editor = document.getElementById('doc-editor');

        // 权限判定：如果是管理员且开启了深度编辑，解锁富文本权限
        if (state.isAdmin && state.isEditMode) {
            modal.classList.add('edit-mode');
            editor.setAttribute('contenteditable', 'true');
        } else {
            modal.classList.remove('edit-mode');
            editor.setAttribute('contenteditable', 'false');
        }

        modal.style.display = 'flex';
        setTimeout(() => modal.style.opacity = '1', 10);
    };

    window.closeCounselingDoc = function() {
        const modal = document.getElementById('counseling-doc-modal');
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    };

    window.saveCounselingDoc = async function() {
        if (!currentDocId) return;
        const title = document.getElementById('doc-title').value.trim();
        const content = document.getElementById('doc-editor').innerHTML;

        if (!db.customDocs) db.customDocs = {};
        db.customDocs[currentDocId] = { title, content };

        await window.saveDB();
        window.showGlobalToast('文档已安全同步至云端', 'success');
    };

    // 4. R2 拖拽上传与粘贴上传引擎核心
    const editor = document.getElementById('doc-editor');

    // 拖拽视觉反馈
    editor.addEventListener('dragover', (e) => {
        if(state.isAdmin && state.isEditMode) { e.preventDefault(); editor.classList.add('drag-over'); }
    });
    editor.addEventListener('dragleave', (e) => { editor.classList.remove('drag-over'); });
    editor.addEventListener('drop', (e) => {
        if(state.isAdmin && state.isEditMode) {
            e.preventDefault();
            editor.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                processDocFiles(e.dataTransfer.files);
            }
        }
    });

    // 按钮手动选择上传
    window.handleDocFileUpload = function(input) {
        if (input.files.length > 0) {
            processDocFiles(input.files);
            input.value = ''; // 清空选择，允许重复传同名文件
        }
    };

    // 核心流：分发上传到 R2 并生成对应的 HTML 标签插入文档
    async function processDocFiles(files) {
        window.showGlobalToast(`正在将 ${files.length} 个文件直传云端...`, 'loading');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // 调用你现成的 app.js 中已有的 R2 上传接口
                const url = await uploadToR2(file);
                insertMediaToEditor(url, file.type, file.name);
            } catch (err) {
                window.showGlobalToast(`文件 ${file.name} 上传失败`, 'error');
            }
        }
        window.showGlobalToast('附件全部插入成功', 'success');
        window.saveCounselingDoc(); // 自动保存一次
    }

    // 后台无感上传函数
    function uploadToR2(file) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload');
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText).url);
                } else reject(new Error('Upload failed'));
            };
            xhr.onerror = () => reject(new Error('Network error'));
            const formData = new FormData();
            formData.append('file', file);
            xhr.send(formData);
        });
    }

    // 智能识别文件类型并转为对应的排版 HTML
    function insertMediaToEditor(url, mimeType, fileName) {
        editor.focus();
        let html = '';
        if (mimeType.startsWith('image/')) {
            html = `<img src="${url}" alt="${fileName}">`;
        } else if (mimeType.startsWith('video/')) {
            html = `<video src="${url}" controls playsinline style="max-width:100%; border-radius:8px;"></video><br/>`;
        } else if (mimeType.startsWith('audio/')) {
            html = `<audio src="${url}" controls style="width:100%;"></audio><br/>`;
        } else {
            // PPT、PDF、Word 等不可直接预览的文件，变为漂亮的下载胶囊
            html = `<a href="${url}" target="_blank" class="doc-file-link">📎 下载附件: ${fileName}</a><br/>`;
        }
        document.execCommand('insertHTML', false, html);
    }

})();
