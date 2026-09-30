/**
 * 恒久印记 - 极速云端知识库与富文本引擎 (Google Docs + Wiki Style)
 * 文件名: counseling-doc.js
 * 更新内容: 左侧分类目录导航、右侧沉浸式A4纸排版、管理员免检编辑、拖拽R2秒传
 */

(function initCounselingDocEngine() {
    // 1. 注入极简高级的 UI 样式
    if (!document.getElementById('counseling-doc-style')) {
        const style = document.createElement('style');
        style.id = 'counseling-doc-style';
        style.innerHTML = `
            .doc-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #f8f9fa; z-index: 99999;
                display: none; flex-direction: row; overflow: hidden;
                transition: opacity 0.3s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            
            /* ================= 左侧：知识库分类导航树 ================= */
            .doc-sidebar {
                width: 280px; background: #ffffff; border-right: 1px solid #e0e0e0;
                display: flex; flex-direction: column; flex-shrink: 0; height: 100%;
                box-shadow: 2px 0 10px rgba(0,0,0,0.02); z-index: 10;
            }
            .doc-sidebar-header {
                padding: 20px; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: space-between; align-items: center;
            }
            .doc-sidebar-header h2 { font-size: 1.1rem; color: #202124; margin: 0; }
            .btn-close-kb { background: #f1f3f4; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; color: #5f6368; font-weight: bold; transition: 0.2s; }
            .btn-close-kb:hover { background: #e8eaed; color: #202124; }
            
            .doc-sidebar-content { flex: 1; overflow-y: auto; padding: 15px; }
            .kb-category-group { margin-bottom: 20px; }
            .kb-category-title { 
                font-size: 0.85rem; font-weight: bold; color: #5f6368; text-transform: uppercase; 
                margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; letter-spacing: 1px;
            }
            .kb-article-item {
                padding: 10px 15px; border-radius: 8px; cursor: pointer; font-size: 0.95rem; color: #3c4043;
                margin-bottom: 4px; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;
            }
            .kb-article-item:hover { background: #f1f3f4; }
            .kb-article-item.active { background: #e8f0fe; color: #1a73e8; font-weight: 500; }
            
            .kb-admin-btn { background: transparent; border: none; color: #1a73e8; font-size: 1rem; cursor: pointer; display: none; padding: 2px 6px; border-radius: 4px; }
            .kb-admin-btn:hover { background: rgba(26,115,232,0.1); }
            .kb-admin-btn.del { color: #ea4335; }
            .kb-admin-btn.del:hover { background: rgba(234,67,53,0.1); }
            .admin-mode .kb-admin-btn { display: inline-block; }
            .admin-mode .kb-category-title:hover .kb-admin-btn { display: inline-block; }

            .btn-add-cat { width: 100%; padding: 12px; background: #fff; border: 1px dashed #dadce0; border-radius: 8px; color: #1a73e8; cursor: pointer; font-weight: 500; display: none; }
            .admin-mode .btn-add-cat { display: block; }
            .btn-add-cat:hover { background: #f8f9fa; }

            /* ================= 右侧：文档编辑主区域 ================= */
            .doc-main { flex: 1; display: flex; flex-direction: column; position: relative; height: 100%; background: #f8f9fa; }
            
            .doc-header-wrapper { background: #ffffff; border-bottom: 1px solid #e0e0e0; display: flex; flex-direction: column; flex-shrink: 0; }
            .doc-header-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 25px; }
            
            .doc-title-input {
                background: transparent; border: none; color: #202124; font-size: 1.4rem; 
                font-weight: 500; outline: none; width: 70%; pointer-events: none; padding: 4px 8px; border-radius: 4px;
            }
            .admin-mode .doc-title-input { pointer-events: auto; }
            .admin-mode .doc-title-input:focus { background: #f1f3f4; }
            
            .btn-doc-save { background: #1a73e8; border: none; color: #fff; padding: 8px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; display: none; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            .admin-mode .btn-doc-save { display: block; }
            .btn-doc-save:active { transform: scale(0.95); }

            /* 仿 Google Docs 工具栏 */
            .doc-toolbar {
                display: none; flex-wrap: wrap; gap: 4px; padding: 8px 25px; 
                background: #edf2fa; border-top: 1px solid #e0e0e0; align-items: center;
            }
            .admin-mode .doc-toolbar { display: flex; }
            .doc-tool-btn {
                background: transparent; border: 1px solid transparent; color: #444746;
                width: 32px; height: 32px; border-radius: 4px; cursor: pointer; font-size: 15px;
                display: flex; justify-content: center; align-items: center; transition: all 0.2s; font-family: serif;
            }
            .doc-tool-btn:hover { background: #e0e6ed; }
            .doc-tool-select { background: transparent; border: 1px solid transparent; padding: 4px; border-radius: 4px; outline: none; cursor: pointer; color: #444746; font-size: 14px; }
            .doc-tool-select:hover { background: #e0e6ed; }
            .doc-tool-separator { width: 1px; height: 18px; background: #c7c7c7; margin: 0 6px; }
            
            .color-picker-wrap { position: relative; display: flex; align-items: center; cursor: pointer; }
            .color-picker-wrap input[type="color"] { opacity: 0; position: absolute; width: 100%; height: 100%; cursor: pointer; }
            .color-picker-icon { width: 32px; height: 32px; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-weight: bold; }
            .color-picker-icon:hover { background: #e0e6ed; }

            /* A4 纸张沉浸式阅读区 */
            .doc-body-scroll {
                flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 40px 20px 80px 20px;
                scroll-behavior: smooth;
            }
            .doc-paper-wrapper { position: relative; width: 100%; max-width: 816px; display: none; }
            .doc-paper-wrapper.show { display: block; }
            
            .doc-paper {
                background: #ffffff; color: #111111;
                width: 100%; min-height: 1056px; 
                padding: clamp(40px, 8vw, 80px) clamp(40px, 6vw, 70px);
                box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
                outline: none; font-size: 11.5pt; line-height: 1.8; word-wrap: break-word;
                font-family: Arial, "Microsoft YaHei", sans-serif;
            }
            
            .doc-paper img, .doc-paper video { max-width: 100%; height: auto; border-radius: 6px; margin: 15px 0; border: 1px solid #e0e0e0; }
            .doc-paper audio { width: 100%; margin: 15px 0; outline: none; }
            .doc-paper a.doc-file-link { 
                display: inline-flex; align-items: center; background: #f8f9fa; color: #1a73e8; 
                padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; 
                border: 1px solid #dadce0; margin: 10px 0; font-size: 0.95rem;
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
            .doc-paper-wrapper.drag-over .doc-drag-overlay { display: flex; }
            
            [contenteditable="true"]:empty:before { content: attr(placeholder); opacity: 0.4; pointer-events: none; display: block; }
            
            .empty-state { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: #5f6368; font-size: 1.1rem; flex-direction: column; gap: 15px; }
            
            /* 移动端响应式侧边栏 */
            @media (max-width: 768px) {
                .doc-modal-overlay { flex-direction: column; }
                .doc-sidebar { width: 100%; height: 35vh; border-right: none; border-bottom: 2px solid #e0e0e0; }
                .doc-main { height: 65vh; }
                .doc-paper { min-height: 600px; padding: 30px 20px; font-size: 16px; }
                .doc-toolbar { overflow-x: auto; flex-wrap: nowrap; padding: 8px 10px; }
                .doc-tool-btn { flex-shrink: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // 2. 注入文档系统的 HTML 骨架
    const docModalHTML = `
        <div class="doc-modal-overlay" id="counseling-doc-modal">
            <!-- 左侧：知识库导航 -->
            <div class="doc-sidebar">
                <div class="doc-sidebar-header">
                    <h2 id="kb-main-title">知识库文档</h2>
                    <button class="btn-close-kb" onclick="window.closeCounselingDoc()">退出</button>
                </div>
                <div class="doc-sidebar-content" id="kb-sidebar-content">
                    <!-- 动态分类与文章列表渲染区 -->
                </div>
                <div style="padding: 15px;">
                    <button class="btn-add-cat" onclick="window.kbAddCategory()">+ 新增分类菜单</button>
                </div>
            </div>

            <!-- 右侧：文档编辑区 -->
            <div class="doc-main">
                <div class="doc-header-wrapper">
                    <div class="doc-header-top">
                        <input type="text" class="doc-title-input" id="doc-title" placeholder="无标题文档" onblur="window.kbSaveDocMeta()">
                        <div class="doc-actions">
                            <button class="btn-doc-save" onclick="window.saveCounselingDoc()">☁ 云端保存</button>
                        </div>
                    </div>
                    <!-- Google Docs 风格工具栏 -->
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
                        <button class="doc-tool-btn" onclick="document.getElementById('doc-file-upload').click()" title="插入图片/视频/音乐/PPT" style="width:auto; padding:0 10px; color:#1a73e8; font-weight:bold;">
                            <span style="font-size:18px; margin-right:4px;">+</span> 插入附件
                        </button>
                        <input type="file" id="doc-file-upload" style="display:none;" multiple onchange="window.handleDocFileUpload(this)">
                    </div>
                </div>
                
                <div class="doc-body-scroll">
                    <div class="empty-state" id="doc-empty-state">
                        <div>👈 请在左侧选择或创建一篇文档</div>
                    </div>
                    <div class="doc-paper-wrapper" id="doc-paper-wrapper">
                        <div class="doc-paper" id="doc-editor" placeholder="开始撰写内容...\n\n· 支持直接从 Word/WPS 全选复制并粘贴，颜色和排版100%保留。\n· 支持直接将电脑的 图片、视频、音频、PDF、PPT 拖拽到此处极速上传。"></div>
                        <div class="doc-drag-overlay">松开鼠标，极速上传并插入到文档中</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', docModalHTML);

    // ================== 数据结构与状态 ==================
    let currentSystemId = null; 
    let activeArticleId = null;

    // 3. 核心 API: 打开整个知识库系统
    window.openCounselingDoc = function(systemId) {
        if (!systemId) systemId = 'sys_default_doc';
        currentSystemId = systemId;
        activeArticleId = null;
        
        // 初始化数据库结构
        if (!db.docSystems) db.docSystems = {};
        if (!db.docSystems[systemId]) {
            db.docSystems[systemId] = {
                title: '知识库',
                categories: [
                    { id: 'cat_' + Date.now(), name: '默认分类', articles: [] }
                ]
            };
        }

        const modal = document.getElementById('counseling-doc-modal');
        
        // 【核心修复】：不再判断 isEditMode，只要是站长登录，永远开启管理员模式！
        if (state.isAdmin) {
            modal.classList.add('admin-mode');
            document.getElementById('doc-editor').setAttribute('contenteditable', 'true');
        } else {
            modal.classList.remove('admin-mode');
            document.getElementById('doc-editor').setAttribute('contenteditable', 'false');
        }

        window.renderKBSidebar();
        window.kbShowEmptyState(); // 默认不选中任何文章

        modal.style.display = 'flex';
        setTimeout(() => modal.style.opacity = '1', 10);
    };

    window.closeCounselingDoc = function() {
        const modal = document.getElementById('counseling-doc-modal');
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    };

    // ================== 左侧目录树渲染与 CRUD ==================
    window.renderKBSidebar = function() {
        const sysData = db.docSystems[currentSystemId];
        const sbContent = document.getElementById('kb-sidebar-content');
        sbContent.innerHTML = '';

        sysData.categories.forEach(cat => {
            const catGroup = document.createElement('div');
            catGroup.className = 'kb-category-group';
            
            // 分类标题栏
            const catTitle = document.createElement('div');
            catTitle.className = 'kb-category-title';
            catTitle.innerHTML = `
                <span>${cat.name}</span>
                <div>
                    <button class="kb-admin-btn" onclick="window.kbAddArticle('${cat.id}')" title="添加文章">+</button>
                    <button class="kb-admin-btn del" onclick="window.kbDeleteCategory('${cat.id}')" title="删除分类">✖</button>
                </div>
            `;
            catGroup.appendChild(catTitle);

            // 文章列表
            cat.articles.forEach(art => {
                const artItem = document.createElement('div');
                artItem.className = `kb-article-item ${art.id === activeArticleId ? 'active' : ''}`;
                artItem.innerHTML = `
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📄 ${art.title}</span>
                    <button class="kb-admin-btn del" onclick="event.stopPropagation(); window.kbDeleteArticle('${cat.id}', '${art.id}')">✖</button>
                `;
                artItem.onclick = () => window.kbSelectArticle(cat.id, art.id);
                catGroup.appendChild(artItem);
            });

            sbContent.appendChild(catGroup);
        });
    };

    // 分类操作
    window.kbAddCategory = async function() {
        const name = prompt("请输入新分类名称 (如: 夫妻沟通):", "新分类");
        if (!name) return;
        db.docSystems[currentSystemId].categories.push({ id: 'cat_' + Date.now(), name: name, articles: [] });
        await window.saveDB();
        window.renderKBSidebar();
    };

    window.kbDeleteCategory = async function(catId) {
        const sys = db.docSystems[currentSystemId];
        const cat = sys.categories.find(c => c.id === catId);
        if (cat.articles.length > 0 && !confirm(`分类 [${cat.name}] 下还有文章，确定连同文章一起彻底删除吗？`)) return;
        sys.categories = sys.categories.filter(c => c.id !== catId);
        if (sys.categories.length === 0) window.kbShowEmptyState();
        await window.saveDB();
        window.renderKBSidebar();
    };

    // 文章操作
    window.kbAddArticle = async function(catId) {
        const title = prompt("请输入新文章标题:", "无标题文档");
        if (!title) return;
        const newArt = { id: 'art_' + Date.now(), title: title, content: '' };
        const cat = db.docSystems[currentSystemId].categories.find(c => c.id === catId);
        cat.articles.push(newArt);
        await window.saveDB();
        window.renderKBSidebar();
        window.kbSelectArticle(catId, newArt.id); // 创建后自动打开
    };

    window.kbDeleteArticle = async function(catId, artId) {
        if (!confirm("确定要删除这篇文档吗？删除后无法恢复！")) return;
        const cat = db.docSystems[currentSystemId].categories.find(c => c.id === catId);
        cat.articles = cat.articles.filter(a => a.id !== artId);
        if (activeArticleId === artId) window.kbShowEmptyState();
        await window.saveDB();
        window.renderKBSidebar();
    };

    // ================== 右侧文档渲染与编辑 ==================
    window.kbShowEmptyState = function() {
        activeArticleId = null;
        document.getElementById('doc-empty-state').style.display = 'flex';
        document.getElementById('doc-paper-wrapper').style.display = 'none';
        document.getElementById('doc-title').value = '';
    };

    window.kbSelectArticle = function(catId, artId) {
        activeArticleId = artId;
        const cat = db.docSystems[currentSystemId].categories.find(c => c.id === catId);
        const art = cat.articles.find(a => a.id === artId);
        
        document.getElementById('doc-empty-state').style.display = 'none';
        document.getElementById('doc-paper-wrapper').style.display = 'block';
        
        document.getElementById('doc-title').value = art.title;
        document.getElementById('doc-editor').innerHTML = art.content;
        
        window.renderKBSidebar(); // 刷新高亮状态
    };

    // 失去焦点时实时保存标题
    window.kbSaveDocMeta = async function() {
        if (!activeArticleId) return;
        const newTitle = document.getElementById('doc-title').value.trim() || '无标题文档';
        let found = false;
        db.docSystems[currentSystemId].categories.forEach(c => {
            c.articles.forEach(a => { if (a.id === activeArticleId) { a.title = newTitle; found = true; } });
        });
        if(found) {
            await window.saveDB();
            window.renderKBSidebar();
        }
    };

    // 手动保存正文内容
    window.saveCounselingDoc = async function() {
        if (!activeArticleId) return;
        const content = document.getElementById('doc-editor').innerHTML;
        db.docSystems[currentSystemId].categories.forEach(c => {
            c.articles.forEach(a => { if (a.id === activeArticleId) a.content = content; });
        });
        await window.saveDB();
        window.showGlobalToast('文档已安全同步至云端', 'success');
    };

    // ================== R2 富文本与多媒体引擎 ==================
    window.docExec = function(command, value = null) {
        document.getElementById('doc-editor').focus();
        document.execCommand(command, false, value);
    };

    const editorWrapper = document.getElementById('doc-paper-wrapper');
    const editor = document.getElementById('doc-editor');

    // 拖拽多媒体支持
    editorWrapper.addEventListener('dragover', (e) => {
        if(state.isAdmin) { e.preventDefault(); editorWrapper.classList.add('drag-over'); }
    });
    editorWrapper.addEventListener('dragleave', (e) => { editorWrapper.classList.remove('drag-over'); });
    editorWrapper.addEventListener('drop', (e) => {
        if(state.isAdmin) {
            e.preventDefault();
            editorWrapper.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) processDocFiles(e.dataTransfer.files);
        }
    });

    // 按钮手动选择附件
    window.handleDocFileUpload = function(input) {
        if (input.files.length > 0) {
            processDocFiles(input.files);
            input.value = ''; 
        }
    };

    async function processDocFiles(files) {
        window.showGlobalToast(`正在将 ${files.length} 个附件极速直传至云端...`, 'loading');
        editor.focus(); 
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const url = await uploadToR2(file);
                insertMediaToEditor(url, file.type, file.name);
            } catch (err) {
                window.showGlobalToast(`文件 ${file.name} 上传失败`, 'error');
            }
        }
        window.showGlobalToast('所有附件处理完毕', 'success');
        window.saveCounselingDoc(); 
    }

    function uploadToR2(file) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload');
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).url);
                else reject(new Error('Upload failed'));
            };
            xhr.onerror = () => reject(new Error('Network error'));
            const formData = new FormData();
            formData.append('file', file);
            xhr.send(formData);
        });
    }

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
            html = `<br><a href="${url}" target="_blank" class="doc-file-link">📎 下载附件：${fileName}</a><br>`;
        }
        document.execCommand('insertHTML', false, html);
    }

})();
