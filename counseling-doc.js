/**
 * 恒久印记 - 极速云端知识库与富文本引擎 (Google Docs + Wiki Style)
 * 文件名: counseling-doc.js
 * 更新内容: 新增分类与文档重命名、修复全局居中污染、新增两端对齐按钮、恢复原生粘贴格式保留
 */

(function initCounselingDocEngine() {
    console.log("🚀 成功加载知识库引擎 V7.3 (排版隔离与对齐修复版)");

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
                box-shadow: 2px 0 10px rgba(0,0,0,0.02); z-index: 10; transition: transform 0.3s ease, width 0.3s ease;
            }
            .doc-sidebar.collapsed { display: none; }
            
            .doc-sidebar-header {
                padding: 20px; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: space-between; align-items: center;
            }
            .doc-sidebar-header h2 { font-size: 1.1rem; color: #202124; margin: 0; font-weight: bold; }
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
            .kb-article-item.active { background: #e8f0fe; color: #1a73e8; font-weight: bold; }
            
            .kb-admin-btn { background: transparent; border: none; color: #1a73e8; font-size: 1.1rem; cursor: pointer; display: none; padding: 2px 6px; border-radius: 4px; }
            .kb-admin-btn:hover { background: rgba(26,115,232,0.1); }
            .kb-admin-btn.del { color: #ea4335; }
            .kb-admin-btn.del:hover { background: rgba(234,67,53,0.1); }
            .admin-mode .kb-admin-btn { display: inline-block; }
            .admin-mode .kb-category-title:hover .kb-admin-btn { display: inline-block; }

            .btn-add-cat { width: 100%; padding: 12px; background: #fff; border: 1px dashed #dadce0; border-radius: 8px; color: #1a73e8; cursor: pointer; font-weight: bold; display: none; margin-top: 10px; }
            .admin-mode .btn-add-cat { display: block; }
            .btn-add-cat:hover { background: #f8f9fa; }

            /* ================= 右侧：文档编辑与阅读主区域 ================= */
            .doc-main { flex: 1; display: flex; flex-direction: column; position: relative; height: 100%; background: #f8f9fa; min-width: 0; }
            
            .doc-header-wrapper { background: #ffffff; border-bottom: 1px solid #e0e0e0; display: flex; flex-direction: column; flex-shrink: 0; }
            .doc-header-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 25px; gap: 15px; }
            
            .doc-title-group { display: flex; align-items: center; gap: 10px; flex: 1; }
            .btn-toggle-menu { display: none; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #5f6368; padding: 5px; border-radius: 4px; }
            .btn-toggle-menu:hover { background: #f1f3f4; }
            .reader-mode .btn-toggle-menu { display: block; }

            .doc-title-input {
                background: transparent; border: none; color: #202124; font-size: 1.4rem; 
                font-weight: bold; outline: none; width: 100%; max-width: 500px; pointer-events: none; padding: 4px 8px; border-radius: 4px;
            }
            .admin-mode .doc-title-input { pointer-events: auto; }
            .admin-mode .doc-title-input:focus { background: #f1f3f4; border-bottom: 2px solid #1a73e8; }
            
            /* 站长：保存按钮区 */
            .doc-actions-admin { display: none; gap: 10px; align-items: center; }
            .btn-doc-save { background: #1a73e8; border: none; color: #fff; padding: 8px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            .btn-doc-save:active { transform: scale(0.95); }
            .admin-mode .doc-actions-admin { display: flex; }

            /* 游客：阅读缩放控制区 */
            .doc-actions-reader { display: none; gap: 8px; align-items: center; }
            .reader-mode .doc-actions-reader { display: flex; }
            .btn-zoom { background: #f1f3f4; border: 1px solid #dadce0; padding: 6px 14px; border-radius: 6px; cursor: pointer; color: #3c4043; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
            .btn-zoom.active { background: #e8f0fe; color: #1a73e8; border-color: #1a73e8; font-weight: bold; }
            .btn-reader-close { background: #ea4335; border: none; color: #fff; padding: 6px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-left: 10px; }

            /* 仿 Google Docs 工具栏 */
            .doc-toolbar {
                display: none; flex-wrap: wrap; gap: 4px; padding: 8px 25px; 
                background: #edf2fa; border-top: 1px solid #e0e0e0; align-items: center;
            }
            .admin-mode .doc-toolbar { display: flex; }
            .doc-tool-btn {
                background: transparent; border: 1px solid transparent; color: #444746;
                width: 32px; height: 32px; border-radius: 4px; cursor: pointer; font-size: 15px;
                display: flex; justify-content: center; align-items: center; transition: all 0.2s; font-family: serif; font-weight: bold;
            }
            .doc-tool-btn:hover { background: #e0e6ed; border-color: #c7c7c7; }
            .doc-tool-select { background: transparent; border: 1px solid transparent; padding: 4px; border-radius: 4px; outline: none; cursor: pointer; color: #444746; font-size: 14px; font-weight: bold; max-width: 130px; }
            .doc-tool-select:hover { background: #e0e6ed; }
            .doc-tool-separator { width: 1px; height: 18px; background: #c7c7c7; margin: 0 6px; }
            
            .color-picker-wrap { position: relative; display: flex; align-items: center; cursor: pointer; }
            .color-picker-wrap input[type="color"] { opacity: 0; position: absolute; width: 100%; height: 100%; cursor: pointer; }
            .color-picker-icon { width: 32px; height: 32px; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-weight: bold; }
            .color-picker-icon:hover { background: #e0e6ed; }

            /* ================= 🔥 A4 纸张排版强力修正区 🔥 ================= */
            .doc-body-scroll {
                flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 40px 20px 80px 20px;
                scroll-behavior: smooth;
            }
            .doc-paper-wrapper { position: relative; width: 100%; max-width: 850px; display: none; transition: transform 0.3s ease; }
            
            /* 彻底解决居中问题，强制恢复原生纯净的富文本排版行为 */
            .doc-paper {
                background: #ffffff; color: #111111;
                width: 100%; min-height: 1100px; 
                padding: clamp(40px, 8vw, 90px) clamp(40px, 6vw, 80px);
                box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
                outline: none; font-size: 12pt; line-height: 1.8; word-wrap: break-word;
                font-family: Arial, "Microsoft YaHei", sans-serif;
                text-align: left; /* 默认左对齐，去除 !important，允许富文本编辑器和粘贴的内联样式覆盖 */
            }
            
            /* 💥核心拦截：彻底阻断 app.html 中 p { text-align-last: center } 的全局污染 */
            .doc-paper * { text-align-last: auto !important; }
            
            /* 修正内部元素的默认对齐，去除强制 justify，完美保留粘贴的原始格式 */
            .doc-paper p { margin-bottom: 15px; } 
            .doc-paper h1, .doc-paper h2, .doc-paper h3, .doc-paper h4 { margin: 20px 0 15px 0; }
            .doc-paper ul, .doc-paper ol { padding-left: 2.5em; margin-bottom: 15px; }
            .doc-paper li { margin-bottom: 5px; }
            
            .doc-paper img, .doc-paper video { max-width: 100%; height: auto; border-radius: 6px; margin: 15px 0; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .doc-paper audio { width: 100%; margin: 15px 0; outline: none; }
            .doc-paper a.doc-file-link { 
                display: inline-flex; align-items: center; background: #f8f9fa; color: #1a73e8; 
                padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; 
                border: 1px solid #dadce0; margin: 10px 0; font-size: 0.95rem; transition: background 0.2s;
            }
            .doc-paper a.doc-file-link:hover { background: #f1f3f4; border-color: #1a73e8; }
            
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
            
            .empty-state { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: #5f6368; font-size: 1.2rem; flex-direction: column; gap: 15px; font-weight: bold; text-align: center; }
            
            /* 移动端响应式侧边栏 */
            @media (max-width: 768px) {
                .doc-modal-overlay { flex-direction: column; }
                .doc-sidebar { width: 100%; height: 35vh; border-right: none; border-bottom: 2px solid #e0e0e0; }
                .doc-sidebar.collapsed { display: none; }
                .doc-main { height: 65vh; }
                .reader-mode .doc-main { height: 100vh; } 
                .doc-paper { min-height: 800px; padding: 30px 20px; }
                .doc-toolbar { overflow-x: auto; flex-wrap: nowrap; padding: 8px 10px; }
                .doc-tool-btn { flex-shrink: 0; }
                .btn-toggle-menu { display: block; } 
                .doc-actions-reader { overflow-x: auto; flex-wrap: nowrap; }
            }
        `;
        document.head.appendChild(style);
    }

    // 2. 注入文档系统的 HTML 骨架
    const docModalHTML = `
        <div class="doc-modal-overlay" id="counseling-doc-modal">
            <!-- 左侧：知识库导航 -->
            <div class="doc-sidebar" id="doc-sidebar">
                <div class="doc-sidebar-header">
                    <h2 id="kb-main-title">知识库目录</h2>
                    <button class="btn-close-kb" onclick="window.closeCounselingDoc()">退出</button>
                </div>
                <div class="doc-sidebar-content" id="kb-sidebar-content">
                    <!-- 动态分类与文章列表渲染区 -->
                </div>
                <div style="padding: 15px;">
                    <button class="btn-add-cat" onclick="window.kbAddCategory()">+ 新增分类</button>
                </div>
            </div>

            <!-- 右侧：文档编辑区 -->
            <div class="doc-main">
                <div class="doc-header-wrapper">
                    <div class="doc-header-top">
                        <div class="doc-title-group">
                            <button class="btn-toggle-menu" onclick="window.toggleDocSidebar()" title="展开/收起目录">☰</button>
                            <input type="text" class="doc-title-input" id="doc-title" placeholder="无标题文档" onblur="window.kbSaveDocMeta()">
                        </div>
                        
                        <!-- 管理员控制台 -->
                        <div class="doc-actions-admin">
                            <button class="btn-doc-save" onclick="window.saveCounselingDoc()">☁ 云端保存</button>
                        </div>

                        <!-- 游客自动全屏阅读控制台 -->
                        <div class="doc-actions-reader">
                            <span style="font-size:0.85rem; color:#5f6368; font-weight:bold;">阅读字号:</span>
                            <button class="btn-zoom" id="zoom-small" onclick="window.setDocZoom(0.85, 'small')">偏小</button>
                            <button class="btn-zoom active" id="zoom-normal" onclick="window.setDocZoom(1, 'normal')">标准</button>
                            <button class="btn-zoom" id="zoom-large" onclick="window.setDocZoom(1.15, 'large')">稍大</button>
                            <button class="btn-reader-close" onclick="window.closeCounselingDoc()">退出</button>
                        </div>
                    </div>

                    <!-- Google Docs 风格高级工具栏 -->
                    <div class="doc-toolbar" id="doc-toolbar">
                        <button class="doc-tool-btn" onclick="window.docExec('undo')" title="撤销">↩</button>
                        <button class="doc-tool-btn" onclick="window.docExec('redo')" title="重做">↪</button>
                        <div class="doc-tool-separator"></div>
                        
                        <select class="doc-tool-select" onchange="window.docExec('fontName', this.value)" title="字体集">
                            <option value="Arial">默认字体</option>
                            <option value="SimSun">宋体</option>
                            <option value="KaiTi">楷体</option>
                            <option value="Microsoft YaHei">微软雅黑</option>
                            <option value="SimHei">黑体</option>
                        </select>
                        <div class="doc-tool-separator"></div>

                        <select class="doc-tool-select" onchange="window.docExec('fontSize', this.value)" title="文章字号排版">
                            <option value="3">稍小 (Small)</option>
                            <option value="4" selected>内容大小 (Normal)</option>
                            <option value="5">偏大 (Large)</option>
                            <option value="6">小标题 (Sub-title)</option>
                            <option value="7">主标题 (Main Title)</option>
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
                        <!-- 🔥 新增：两端对齐按钮 -->
                        <button class="doc-tool-btn" onclick="window.docExec('justifyFull')" title="两端对齐" style="font-size: 14px; font-weight: 900;">⇔</button>
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
                        <div class="doc-paper" id="doc-editor" placeholder="开始撰写内容...\n\n· 支持直接从 Word/WPS 全选复制并粘贴，所有颜色、表格和排版将100%原封不动保留。\n· 支持直接将电脑的 图片、视频、音频、PDF、PPT 拖拽到此处极速上传。"></div>
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
        
        // 自动初始化安全结构
        if (!db.docSystems) db.docSystems = {};
        if (!db.docSystems[systemId]) {
            db.docSystems[systemId] = {
                title: '知识库',
                categories: [{ id: 'cat_' + Date.now(), name: '默认分类', articles: [] }]
            };
        }

        const modal = document.getElementById('counseling-doc-modal');
        const sidebar = document.getElementById('doc-sidebar');
        
        // 站长全开权限，游客强制阅读降级
        if (state.isAdmin) {
            modal.classList.add('admin-mode');
            modal.classList.remove('reader-mode');
            document.getElementById('doc-editor').setAttribute('contenteditable', 'true');
            sidebar.classList.remove('collapsed'); 
        } else {
            modal.classList.remove('admin-mode');
            modal.classList.add('reader-mode');
            document.getElementById('doc-editor').setAttribute('contenteditable', 'false');
            sidebar.classList.add('collapsed'); 
            window.setDocZoom(1, 'normal'); 
        }

        window.renderKBSidebar();
        
        // 🔥 自动展示第一篇文章逻辑
        let hasArticle = false;
        const sys = db.docSystems[currentSystemId];
        if (sys && sys.categories) {
            for (let i = 0; i < sys.categories.length; i++) {
                if (sys.categories[i].articles && sys.categories[i].articles.length > 0) {
                    window.kbSelectArticle(sys.categories[i].id, sys.categories[i].articles[0].id);
                    hasArticle = true;
                    break;
                }
            }
        }
        
        if (!hasArticle) {
            window.kbShowEmptyState(); 
        }

        modal.style.display = 'flex';
        setTimeout(() => modal.style.opacity = '1', 10);
    };

    window.closeCounselingDoc = function() {
        const modal = document.getElementById('counseling-doc-modal');
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    };

    window.toggleDocSidebar = function() {
        const sidebar = document.getElementById('doc-sidebar');
        sidebar.classList.toggle('collapsed');
    };

    // 游客沉浸式阅读字号引擎 (CSS Zoom无损缩放)
    window.setDocZoom = function(scale, btnId) {
        const wrapper = document.getElementById('doc-paper-wrapper');
        wrapper.style.zoom = scale;
        document.querySelectorAll('.btn-zoom').forEach(btn => btn.classList.remove('active'));
        document.getElementById('zoom-' + btnId).classList.add('active');
    };

    // ================== 左侧目录树渲染与 CRUD ==================
    window.renderKBSidebar = function() {
        const sysData = db.docSystems[currentSystemId];
        const sbContent = document.getElementById('kb-sidebar-content');
        sbContent.innerHTML = '';

        sysData.categories.forEach(cat => {
            const catGroup = document.createElement('div');
            catGroup.className = 'kb-category-group';
            
            const catTitle = document.createElement('div');
            catTitle.className = 'kb-category-title';
            // 🔥 新增：分类名称的重命名(✎)按钮
            catTitle.innerHTML = `
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${cat.name}</span>
                <div style="display:flex; flex-shrink:0;">
                    <button class="kb-admin-btn" onclick="window.kbAddArticle('${cat.id}')" title="添加文章">➕</button>
                    <button class="kb-admin-btn" style="color:#f59e0b;" onclick="window.kbEditCategory('${cat.id}')" title="重命名分类">✎</button>
                    <button class="kb-admin-btn del" onclick="window.kbDeleteCategory('${cat.id}')" title="删除分类">✖</button>
                </div>
            `;
            catGroup.appendChild(catTitle);

            cat.articles.forEach(art => {
                const artItem = document.createElement('div');
                artItem.className = `kb-article-item ${art.id === activeArticleId ? 'active' : ''}`;
                // 🔥 新增：文章标题的重命名(✎)按钮
                artItem.innerHTML = `
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">📄 ${art.title}</span>
                    <div style="display:flex; flex-shrink:0;">
                        <button class="kb-admin-btn" style="color:#f59e0b;" onclick="event.stopPropagation(); window.kbEditArticle('${cat.id}', '${art.id}')" title="重命名文章">✎</button>
                        <button class="kb-admin-btn del" onclick="event.stopPropagation(); window.kbDeleteArticle('${cat.id}', '${art.id}')" title="删除文章">✖</button>
                    </div>
                `;
                artItem.onclick = () => {
                    window.kbSelectArticle(cat.id, art.id);
                    if (window.innerWidth <= 768 || !state.isAdmin) {
                        document.getElementById('doc-sidebar').classList.add('collapsed');
                    }
                };
                catGroup.appendChild(artItem);
            });

            sbContent.appendChild(catGroup);
        });
    };

    window.kbAddCategory = async function() {
        const name = prompt("请输入新分类名称 (如: 夫妻沟通):", "新分类");
        if (!name) return;
        db.docSystems[currentSystemId].categories.push({ id: 'cat_' + Date.now(), name: name, articles: [] });
        await window.saveDB();
        window.renderKBSidebar();
    };

    // 🔥 新增：重命名分类功能
    window.kbEditCategory = async function(catId) {
        const sys = db.docSystems[currentSystemId];
        const cat = sys.categories.find(c => c.id === catId);
        if (!cat) return;
        const newName = prompt("请输入新的分类名称:", cat.name);
        if (newName && newName.trim() !== '') {
            cat.name = newName.trim();
            if(typeof window.saveDB === 'function') await window.saveDB();
            window.renderKBSidebar();
        }
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

    window.kbAddArticle = async function(catId) {
        const title = prompt("请输入新文章标题:", "无标题文档");
        if (!title) return;
        const newArt = { id: 'art_' + Date.now(), title: title, content: '' };
        const cat = db.docSystems[currentSystemId].categories.find(c => c.id === catId);
        cat.articles.push(newArt);
        await window.saveDB();
        window.renderKBSidebar();
        window.kbSelectArticle(catId, newArt.id);
    };

    // 🔥 新增：重命名文章功能
    window.kbEditArticle = async function(catId, artId) {
        const sys = db.docSystems[currentSystemId];
        const cat = sys.categories.find(c => c.id === catId);
        if (!cat) return;
        const art = cat.articles.find(a => a.id === artId);
        if (!art) return;
        
        const newTitle = prompt("请输入新的文章标题:", art.title);
        if (newTitle && newTitle.trim() !== '') {
            art.title = newTitle.trim();
            
            // 如果修改的是当前正在阅读的文章，同步更新右侧顶部的标题栏
            if (activeArticleId === artId) {
                const titleInput = document.getElementById('doc-title');
                if (titleInput) titleInput.value = art.title;
            }
            
            if(typeof window.saveDB === 'function') await window.saveDB();
            window.renderKBSidebar();
        }
    };

    window.kbDeleteArticle = async function(catId, artId) {
        if (!confirm("确定要彻底删除这篇文档吗？删除后无法恢复！")) return;
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
        
        window.renderKBSidebar(); 
    };

    window.kbSaveDocMeta = async function() {
        if (!activeArticleId) return;
        const newTitle = document.getElementById('doc-title').value.trim() || '无标题文档';
        let found = false;
        db.docSystems[currentSystemId].categories.forEach(c => {
            c.articles.forEach(a => { if (a.id === activeArticleId) { a.title = newTitle; found = true; } });
        });
        if(found && typeof window.saveDB === 'function') {
            await window.saveDB();
            window.renderKBSidebar();
        }
    };

    // 🔥 新增安全锁的云端保存引擎
    window.saveCounselingDoc = async function() {
        if (!activeArticleId) return window.showGlobalToast('请先选择或创建一篇文档', 'error');
        const editor = document.getElementById('doc-editor');
        if (!editor) return;
        const content = editor.innerHTML;
        
        // 核心安全防崩溃判定
        if (!db) return window.showGlobalToast('数据库未就绪', 'error');
        if (!db.docSystems) db.docSystems = {};
        if (!db.docSystems[currentSystemId]) return window.showGlobalToast('知识库异常', 'error');
        
        let found = false;
        db.docSystems[currentSystemId].categories.forEach(c => {
            c.articles.forEach(a => { 
                if (a.id === activeArticleId) {
                    a.content = content; 
                    found = true;
                } 
            });
        });
        
        if (found && typeof window.saveDB === 'function') {
            await window.saveDB();
            window.showGlobalToast('文档已安全同步至云端', 'success');
        } else {
            window.showGlobalToast('保存失败：文档被删除或同步引擎丢失', 'error');
        }
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
            html = `<br><img src="${url}" alt="${fileName}" style="max-width:100%; border-radius:6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"><br>`;
        } else if (mimeType.startsWith('video/')) {
            html = `<br><video src="${url}" controls playsinline style="max-width:100%; border-radius:6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"></video><br>`;
        } else if (mimeType.startsWith('audio/')) {
            html = `<br><audio src="${url}" controls style="width:100%;"></audio><br>`;
        } else {
            html = `<br><a href="${url}" target="_blank" class="doc-file-link">📎 下载附件：${fileName}</a><br>`;
        }
        document.execCommand('insertHTML', false, html);
    }

})();
