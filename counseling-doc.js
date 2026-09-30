/**
 * 恒久印记 - 极速云端富文本辅导文档引擎 (Google Docs Style)
 * 文件名: counseling-doc.js
 * 更新内容: 引入完整的类 Google Docs 工具栏、A4纸张排版、原生富文本保留、多媒体拖拽上传
 */

(function initCounselingDocEngine() {
    // 1. 注入 Google Docs 风格的极致 UI 样式
    if (!document.getElementById('counseling-doc-style')) {
        const style = document.createElement('style');
        style.id = 'counseling-doc-style';
        style.innerHTML = `
            .doc-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #f8f9fa; z-index: 99999;
                display: none; flex-direction: column; overflow: hidden;
                transition: opacity 0.3s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            
            /* 顶部导航与工具栏区 */
            .doc-header-wrapper {
                background: #ffffff; border-bottom: 1px solid #e0e0e0;
                display: flex; flex-direction: column; flex-shrink: 0;
            }
            
            .doc-header-top { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 10px 20px;
            }
            
            .doc-title-input {
                background: transparent; border: none; color: #202124; font-size: 1.25rem; 
                font-weight: 500; outline: none; width: 60%; pointer-events: none; padding: 4px 8px; border-radius: 4px;
            }
            .edit-mode .doc-title-input { pointer-events: auto; }
            .edit-mode .doc-title-input:focus { background: #f1f3f4; }
            
            .doc-actions { display: flex; gap: 12px; align-items: center; }
            .btn-doc-close { background: #f1f3f4; border: none; color: #3c4043; padding: 8px 18px; border-radius: 4px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
            .btn-doc-close:hover { background: #e8eaed; }
            .btn-doc-save { background: #1a73e8; border: none; color: #fff; padding: 8px 24px; border-radius: 4px; font-weight: 600; cursor: pointer; display: none; transition: background 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            .btn-doc-save:hover { background: #1557b0; }
            .edit-mode .btn-doc-save { display: block; }

            /* 仿 Google Docs 富文本工具栏 */
            .doc-toolbar {
                display: none; flex-wrap: wrap; gap: 4px; padding: 6px 20px; 
                background: #edf2fa; border-top: 1px solid #e0e0e0; align-items: center;
            }
            .edit-mode .doc-toolbar { display: flex; }
            .doc-tool-btn {
                background: transparent; border: 1px solid transparent; color: #444746;
                width: 30px; height: 30px; border-radius: 4px; cursor: pointer; font-size: 14px;
                display: flex; justify-content: center; align-items: center; transition: all 0.2s; font-family: serif;
            }
            .doc-tool-btn:hover { background: #e0e6ed; }
            .doc-tool-select { background: transparent; border: 1px solid transparent; padding: 4px; border-radius: 4px; outline: none; cursor: pointer; color: #444746; }
            .doc-tool-select:hover { background: #e0e6ed; }
            .doc-tool-separator { width: 1px; height: 18px; background: #c7c7c7; margin: 0 4px; }
            
            /* 颜色选择器美化 */
            .color-picker-wrap { position: relative; display: flex; align-items: center; cursor: pointer; }
            .color-picker-wrap input[type="color"] { opacity: 0; position: absolute; width: 100%; height: 100%; cursor: pointer; }
            .color-picker-icon { width: 30px; height: 30px; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-weight: bold; border: 1px solid transparent; }
            .color-picker-icon:hover { background: #e0e6ed; }

            /* A4 纸张沉浸式阅读区 */
            .doc-body-scroll {
                flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 25px 15px 80px 15px;
                background: #f8f9fa; scroll-behavior: smooth;
            }
            .doc-paper {
                background: #ffffff; color: #111111;
                width: 100%; max-width: 816px; /* 标准 A4 纸宽度 */
                min-height: 1056px; /* 标准 A4 纸高度 */
                padding: clamp(40px, 8vw, 80px) clamp(30px, 6vw, 70px);
                box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
                outline: none; font-size: 11pt; line-height: 1.8; word-wrap: break-word;
                font-family: Arial, "Microsoft YaHei", sans-serif;
            }
            
            /* 富文本内部媒体与附件样式 */
            .doc-paper img, .doc-paper video { max-width: 100%; height: auto; border-radius: 4px; margin: 15px 0; border: 1px solid #e0e0e0; }
            .doc-paper audio { width: 100%; margin: 15px 0; outline: none; }
            .doc-paper a.doc-file-link { 
                display: inline-flex; align-items: center; background: #f8f9fa; color: #1a73e8; 
                padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; 
                border: 1px solid #dadce0; margin: 10px 0; font-size: 0.95rem; transition: background 0.2s;
            }
            .doc-paper a.doc-file-link:hover { background: #f1f3f4; }
            
            /* 拖拽上传全屏遮罩层 */
            .doc-drag-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(26, 115, 232, 0.9); backdrop-filter: blur(5px);
                color: white; font-size: 1.8rem; font-weight: bold;
                display: none; justify-content: center; align-items: center; z-index: 100;
                border: 4px dashed rgba(255,255,255,0.8); pointer-events: none;
            }
            .doc-paper-wrapper { position: relative; width: 100%; max-width: 816px; }
            .doc-paper-wrapper.drag-over .doc-drag-overlay { display: flex; }
            
            /* 占位符提示 */
            [contenteditable="true"]:empty:before { content: attr(placeholder); opacity: 0.4; pointer-events: none; display: block; }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .doc-paper { min-height: 800px; padding: 30px 20px; font-size: 16px; }
                .doc-toolbar { overflow-x: auto; flex-wrap: nowrap; padding: 6px 10px; }
                .doc-tool-btn { flex-shrink: 0; }
                .doc-title-input { font-size: 1.1rem; width: 50%; }
            }
        `;
        document.head.appendChild(style);
    }

    // 2. 注入文档系统的 HTML 骨架
    const docModalHTML = `
        <div class="doc-modal-overlay" id="counseling-doc-modal">
            <div class="doc-header-wrapper">
                <div class="doc-header-top">
                    <input type="text" class="doc-title-input" id="doc-title" placeholder="无标题文档" value="婚前辅导文档">
                    <div class="doc-actions">
                        <button class="btn-doc-close" onclick="window.closeCounselingDoc()">关 闭</button>
                        <button class="btn-doc-save" onclick="window.saveCounselingDoc()">保 存</button>
                    </div>
                </div>
                <!-- 仿 Google Docs 工具栏 -->
                <div class="doc-toolbar" id="doc-toolbar">
                    <button class="doc-tool-btn" onclick="window.docExec('undo')" title="撤销">↩</button>
                    <button class="doc-tool-btn" onclick="window.docExec('redo')" title="重做">↪</button>
                    <div class="doc-tool-separator"></div>
                    
                    <select class="doc-tool-select" onchange="window.docExec('formatBlock', this.value)" title="段落格式">
                        <option value="P">正文</option>
                        <option value="H1">标题 1</option>
                        <option value="H2">标题 2</option>
                        <option value="H3">标题 3</option>
                    </select>
                    <div class="doc-tool-separator"></div>

                    <button class="doc-tool-btn" onclick="window.docExec('bold')" style="font-weight:bold;" title="加粗 (Ctrl+B)">B</button>
                    <button class="doc-tool-btn" onclick="window.docExec('italic')" style="font-style:italic;" title="斜体 (Ctrl+I)">I</button>
                    <button class="doc-tool-btn" onclick="window.docExec('underline')" style="text-decoration:underline;" title="下划线 (Ctrl+U)">U</button>
                    <button class="doc-tool-btn" onclick="window.docExec('strikeThrough')" style="text-decoration:line-through;" title="删除线">S</button>
                    <div class="doc-tool-separator"></div>

                    <div class="color-picker-wrap" title="文本颜色">
                        <div class="color-picker-icon" style="color: #ea4335; border-bottom: 3px solid #ea4335;">A</div>
                        <input type="color" onchange="window.docExec('foreColor', this.value)">
                    </div>
                    <div class="color-picker-wrap" title="背景高亮">
                        <div class="color-picker-icon" style="background: #fbbc04; color: #fff;">✎</div>
                        <input type="color" onchange="window.docExec('hiliteColor', this.value)">
                    </div>
                    <div class="doc-tool-separator"></div>

                    <button class="doc-tool-btn" onclick="window.docExec('justifyLeft')" title="左对齐">⇦</button>
                    <button class="doc-tool-btn" onclick="window.docExec('justifyCenter')" title="居中">⇨⇦</button>
                    <button class="doc-tool-btn" onclick="window.docExec('justifyRight')" title="右对齐">⇨</button>
                    <div class="doc-tool-separator"></div>

                    <button class="doc-tool-btn" onclick="window.docExec('insertUnorderedList')" title="无序列表">•</button>
                    <button class="doc-tool-btn" onclick="window.docExec('insertOrderedList')" title="有序列表">1.</button>
                    <button class="doc-tool-btn" onclick="window.docExec('removeFormat')" title="清除格式">🆑</button>
                    <div class="doc-tool-separator"></div>

                    <button class="doc-tool-btn" onclick="document.getElementById('doc-file-upload').click()" title="插入图片/视频/音乐/PPT" style="width:auto; padding:0 10px; color:#1a73e8;">
                        <span style="font-size:16px; margin-right:4px;">+</span> 插入附件
                    </button>
                    <input type="file" id="doc-file-upload" style="display:none;" multiple onchange="window.handleDocFileUpload(this)">
                </div>
            </div>
            
            <div class="doc-body-scroll">
                <div class="doc-paper-wrapper" id="doc-paper-wrapper">
                    <div class="doc-paper" id="doc-editor" placeholder="开始撰写辅导内容...\n\n· 支持直接从 Word 或网页全选复制并粘贴到此处，所有颜色和排版格式将完美保留。\n· 支持直接将电脑或手机里的 图片、视频、音频、PDF、PPT 等附件拖拽到这页纸上，系统会自动上传并插入。"></div>
                    <div class="doc-drag-overlay">松开鼠标，极速上传并插入到文档中</div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', docModalHTML);

    let currentDocId = null;

    // 3. 核心 API: 文本格式化执行器
    window.docExec = function(command, value = null) {
        document.getElementById('doc-editor').focus();
        document.execCommand(command, false, value);
    };

    // 4. 核心 API: 打开文档 (从 DB 中读取)
    window.openCounselingDoc = function(docId) {
        if (!docId) docId = 'default_counseling_doc';
        currentDocId = docId;
        
        if (!db.customDocs) db.customDocs = {};
        if (!db.customDocs[docId]) db.customDocs[docId] = { title: '无标题文档', content: '' };

        const docData = db.customDocs[docId];
        document.getElementById('doc-title').value = docData.title || '无标题文档';
        document.getElementById('doc-editor').innerHTML = docData.content || '';

        const modal = document.getElementById('counseling-doc-modal');
        const editor = document.getElementById('doc-editor');

        // 权限判定：防越权隔离
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

    // 5. R2 拖拽上传与粘贴上传引擎核心
    const editorWrapper = document.getElementById('doc-paper-wrapper');
    const editor = document.getElementById('doc-editor');

    // 拖拽视觉反馈绑定在 Wrapper 上，防止在内容上拖拽时闪烁
    editorWrapper.addEventListener('dragover', (e) => {
        if(state.isAdmin && state.isEditMode) { 
            e.preventDefault(); 
            editorWrapper.classList.add('drag-over'); 
        }
    });
    editorWrapper.addEventListener('dragleave', (e) => { 
        editorWrapper.classList.remove('drag-over'); 
    });
    editorWrapper.addEventListener('drop', (e) => {
        if(state.isAdmin && state.isEditMode) {
            e.preventDefault();
            editorWrapper.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                processDocFiles(e.dataTransfer.files);
            }
        }
    });

    // 按钮手动选择附件
    window.handleDocFileUpload = function(input) {
        if (input.files.length > 0) {
            processDocFiles(input.files);
            input.value = ''; // 清空 value，允许重复传同名文件
        }
    };

    // 批量分发上传到 R2 并生成对应的 HTML 标签插入文档
    async function processDocFiles(files) {
        window.showGlobalToast(`正在将 ${files.length} 个附件极速直传至云端...`, 'loading');
        editor.focus(); // 确保插入时焦点在编辑器内
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // 借助原有的无感 R2 上传接口
                const url = await uploadToR2(file);
                insertMediaToEditor(url, file.type, file.name);
            } catch (err) {
                window.showGlobalToast(`文件 ${file.name} 上传失败`, 'error');
            }
        }
        window.showGlobalToast('所有附件处理完毕', 'success');
        window.saveCounselingDoc(); // 自动保存
    }

    // 后台流式直传 R2 API
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

    // 智能识别文件类型并转为优美的 Google Docs 风格 HTML 排版
    function insertMediaToEditor(url, mimeType, fileName) {
        editor.focus();
        let html = '';
        if (mimeType.startsWith('image/')) {
            html = `<br><img src="${url}" alt="${fileName}"><br>`;
        } else if (mimeType.startsWith('video/')) {
            html = `<br><video src="${url}" controls playsinline></video><br>`;
        } else if (mimeType.startsWith('audio/')) {
            html = `<br><audio src="${url}" controls></audio><br>`;
        } else {
            // 文档附件（PPT、PDF、ZIP等）生成精美的下载胶囊
            html = `<br><a href="${url}" target="_blank" class="doc-file-link">📎 下载附件：${fileName}</a><br>`;
        }
        document.execCommand('insertHTML', false, html);
    }

})();
