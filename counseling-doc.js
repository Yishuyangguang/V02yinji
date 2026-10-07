/**
 * 恒久印记 - 极速云端知识库与富文本引擎 (Google Docs + Wiki Style)
 * 文件名: counseling-doc.js
 * 更新内容: 完美修复手机端退回目录时只有半屏的 BUG，保留上下分屏阅读体验
 */

(function initCounselingDocEngine() {
    console.log("🚀 成功加载知识库引擎 V8.5 (手机端全屏目录修复版)");

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
            
            /* 🚀 核心修复：彻底解决半屏问题，强制 100% 高度和宽度 */
            .doc-sidebar.full-screen { 
                width: 100% !important; max-width: none !important; 
                height: 100% !important; flex: 1 !important;
                border-right: none !important; border-bottom: none !important; 
            }
            
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
            
            /* 彻底隐藏右侧区域 */
            .doc-main.hidden { display: none !important; }

            .doc-header-wrapper { background: #ffffff; border-bottom: 1px solid #e0e0e0; display: flex; flex-direction: column; flex-shrink: 0; }
            .doc-header-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 25px; gap: 15px; }
            
            .doc-title-group { display: flex; align-items: center; gap: 10px; flex: 1; }
            
            /* 汉堡菜单：电脑端隐藏，手机端显示 */
            .btn-toggle-menu { display: none; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #5f6368; padding: 5px 10px; border-radius: 4px; }
            .btn-toggle-menu:hover { background: #f1f3f4; }

            .doc-title-input {
                background: transparent; border: none; color: #202124; font-size: 1.4rem; 
                font-weight: bold; outline: none; width: 100%; max-width: 500px; pointer-events: none; padding: 4px 8px; border-radius: 4px;
            }
            .admin-mode .doc-title-input { pointer-events: auto; }
            .admin-mode .doc-title-input:focus { background: #f1f3f4; border-bottom: 2px solid #1a73e8; }
            
            /* 站长：保存按钮区 */
            .doc-actions-admin { display: none; gap: 10px; align-items: center; }
            .btn-doc-save { background: #1a73e8; border: none; color: #fff; padding: 8px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.2); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
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
            .doc-tool-select { background: transparent; border: 1px solid transparent; padding: 4px; border-radius: 4px; outline: none; cursor: pointer; color: #444746; font-size: 14px; font-weight: bold; max-width: 140px; }
            .doc-tool-select:hover { background: #e0e6ed; }
            .doc-tool-separator { width: 1px; height: 18px; background: #c7c7c7; margin: 0 6px; }
            
            /* ================= 🚀 极简高级下拉四色取色器 ================= */
            .color-dropdown-wrap { position: relative; display: flex; align-items: center; cursor: pointer; }
            .color-picker-icon { width: 32px; height: 32px; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-weight: bold; transition: background 0.2s; }
            .color-picker-icon:hover { background: #e0e6ed; }
            
            .color-dropdown-menu {
                position: absolute; top: calc(100% + 5px); left: 50%; transform: translateX(-50%);
                background: #ffffff; border: 1px solid #dadce0; border-radius: 8px; padding: 12px;
                display: none; gap: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); z-index: 100;
                cursor: default; flex-wrap: wrap; width: 100px; justify-content: center;
            }
            .color-dropdown-menu.show { display: flex; }
            
            .color-option {
                width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
                border: 1px solid rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;
            }
            .color-option:hover { transform: scale(1.2); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            
            .color-clear-btn {
                width: 100%; font-size: 12px; text-align: center; color: #5f6368; cursor: pointer; 
                padding-top: 8px; border-top: 1px solid #f1f3f4; margin-top: -4px; transition: 0.2s;
            }
            .color-clear-btn:hover { color: #ea4335; font-weight: bold; }

            /* ================= 🔥 A4 纸张排版强力修正区 🔥 ================= */
            .doc-body-scroll {
                flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 40px 20px 80px 20px;
                scroll-behavior: smooth;
            }
            .doc-paper-wrapper { position: relative; width: 100%; max-width: 850px; display: none; transition: transform 0.3s ease; }
            
            .doc-paper {
                background: #ffffff; color: #111111;
                width: 100%; min-height: 1100px; 
                padding: clamp(40px, 8vw, 90px) clamp(40px, 6vw, 80px);
                box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
                outline: none; font-size: 12pt; line-height: 1.8; word-wrap: break-word;
                font-family: Arial, "Microsoft YaHei", sans-serif;
                text-align: left;
            }
            
            .doc-paper * { text-align-last: auto !important; }
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
            
            .doc-drag-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(26, 115, 232, 0.9); backdrop-filter: blur(5px);
                color: white; font-size: 1.8rem; font-weight: bold;
                display: none; justify-content: center; align-items: center; z-index: 100;
                border: 4px dashed rgba(255,255,255,0.8); pointer-events: none;
            }
            .doc-paper-wrapper.drag-over .doc-drag-overlay { display: flex; }
            
            [contenteditable="true"]:empty:before { content: attr(placeholder); opacity: 0.4; pointer-events: none; display: block; }
            .empty-state { width: 100%; height: 100%; display: none; justify-content: center; align-items: center; color: #5f6368; font-size: 1.2rem; flex-direction: column; gap: 15px; font-weight: bold; text-align: center; }
            
            /* ================= 🚀 6D 玻璃悬浮返回顶部按钮 ================= */
            .btn-back-to-top {
                position: absolute; right: 25px; bottom: 35px;
                width: 42px; height: 42px; border-radius: 50%;
                background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 100%);
                backdrop-filter: blur(15px) saturate(150%); -webkit-backdrop-filter: blur(15px) saturate(150%);
                border: 1px solid rgba(255,255,255,0.6);
                box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15), inset 0 2px 3px rgba(255,255,255,0.8);
                color: #1a73e8; display: flex; justify-content: center; align-items: center;
                cursor: pointer; z-index: 1000; opacity: 0; pointer-events: none;
                transform: translateY(20px); transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .btn-back-to-top.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
            .btn-back-to-top:hover {
                background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 100%);
                box-shadow: 0 12px 40px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,1);
                transform: translateY(-4px);
            }
            .btn-back-to-top:active { transform: translateY(2px) scale(0.95); }

            /* 响应式调整 (手机端) */
            @media (max-width: 768px) {
                .doc-modal-overlay { flex-direction: column; }
                .doc-sidebar { width: 100%; height: 40vh; border-right: none; border-bottom: 1px solid #e0e0e0; flex-shrink: 0; }
                .doc-sidebar.collapsed { display: none; }
                
                /* 🚀 核心修复：全屏目录强制覆盖 40vh 设定 */
                .doc-sidebar.full-screen { height: 100% !important; flex: 1 !important; max-height: none !important; border-bottom: none !important; }
                
                .doc-main { height: auto; flex: 1; min-height: 0; }
                .doc-paper { min-height: 800px; padding: 30px 20px; }
                .doc-toolbar { overflow-x: auto; flex-wrap: nowrap; padding: 8px 10px; }
                .doc-tool-btn { flex-shrink: 0; }
                .btn-toggle-menu { display: block; }
                .doc-actions-reader { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; }
                .btn-back-to-top { right: 15px; bottom: 85px; width: 38px; height: 38px; }
            }
        `;
        document.head.appendChild(style);
    }

    // ================== 核心修复：富文本选区追踪引擎 ==================
    window.docSavedRange = null;
    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        const editor = document.getElementById('doc-editor');
        if (sel.rangeCount > 0 && editor && editor.contains(sel.anchorNode)) {
            window.docSavedRange = sel.getRangeAt(0);
        }
    });

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

            <!-- 右侧：文档编辑区 (通过 id=doc-main 控制物理隐藏) -->
            <div class="doc-main" id="doc-main">
                <div class="doc-header-wrapper">
                    <div class="doc-header-top">
                        <div class="doc-title-group">
                            <button class="btn-toggle-menu" onclick="window.toggleDocSidebar()" title="展开/收起目录">☰</button>
                            <input type="text" class="doc-title-input" id="doc-title" placeholder="无标题文档" onblur="window.kbSaveDocMeta()">
                        </div>
                        
                        <div class="doc-actions-admin">
                            <button class="btn-doc-save" id="btn-doc-save" onclick="window.saveCounselingDoc()">☁ 云端保存</button>
                        </div>

                        <div class="doc-actions-reader">
                            <button class="btn-zoom" id="zoom-small" onclick="window.setDocZoom(0.85, 'small')">偏小</button>
                            <button class="btn-zoom active" id="zoom-normal" onclick="window.setDocZoom(1, 'normal')">标准</button>
                            <button class="btn-zoom" id="zoom-large" onclick="window.setDocZoom(1.15, 'large')">稍大</button>
                            <!-- 退回目录模式 -->
                            <button class="btn-reader-close" onclick="window.backToDirectory()">退出</button>
                        </div>
                    </div>

                    <!-- Google Docs 风格高级工具栏 -->
                    <div class="doc-toolbar" id="doc-toolbar">
                        <button class="doc-tool-btn" onclick="window.docExec('undo')" title="撤销">↩</button>
                        <button class="doc-tool-btn" onclick="window.docExec('redo')" title="重做">↪</button>
                        <div class="doc-tool-separator"></div>
                        
                        <select class="doc-tool-select" onchange="window.docExec('fontName', this.value); this.selectedIndex=0;" title="字体集" style="width: 110px;">
                            <option value="" disabled selected hidden>修改字体</option>
                            <option value="system-ui, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif">系统默认</option>
                            <option value="Kaiti SC, STKaiti, KaiTi, 楷体, serif">楷体 (优雅)</option>
                            <option value="Songti SC, STSong, SimSun, 宋体, serif">宋体 (传统)</option>
                            <option value="PingFang SC, Microsoft YaHei, 黑体, sans-serif">雅黑 / 黑体</option>
                        </select>
                        <div class="doc-tool-separator"></div>

                        <select class="doc-tool-select" onchange="window.docExec('fontSize', this.value); this.selectedIndex=0;" title="文章字号排版">
                            <option value="" disabled selected hidden>修改字号</option>
                            <option value="3">稍小 (Small)</option>
                            <option value="4">标准 (Normal)</option>
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

                        <!-- 极简高级四色下拉取色器 -->
                        <div class="color-dropdown-wrap" title="文本颜色">
                            <div class="color-picker-icon" style="color: #ea4335; border-bottom: 3px solid #ea4335;" onclick="window.toggleColorMenu(event, 'menu-forecolor')">A</div>
                            <div class="color-dropdown-menu" id="menu-forecolor">
                                <div class="color-option" style="background: #111111;" onclick="window.docExec('foreColor', '#111111')" title="纯黑色"></div>
                                <div class="color-option" style="background: #1a73e8;" onclick="window.docExec('foreColor', '#1a73e8')" title="深水蓝"></div>
                                <div class="color-option" style="background: #ea4335;" onclick="window.docExec('foreColor', '#ea4335')" title="樱桃红"></div>
                                <div class="color-option" style="background: #9333ea;" onclick="window.docExec('foreColor', '#9333ea')" title="葡萄紫"></div>
                            </div>
                        </div>

                        <div class="color-dropdown-wrap" title="背景高亮">
                            <div class="color-picker-icon" style="background: #fbbc04; color: #fff;" onclick="window.toggleColorMenu(event, 'menu-hilitecolor')">✎</div>
                            <div class="color-dropdown-menu" id="menu-hilitecolor">
                                <div class="color-option" style="background: #111111;" onclick="window.docExec('hiliteColor', '#111111')" title="纯黑色"></div>
                                <div class="color-option" style="background: #1a73e8;" onclick="window.docExec('hiliteColor', '#1a73e8')" title="深水蓝"></div>
                                <div class="color-option" style="background: #ea4335;" onclick="window.docExec('hiliteColor', '#ea4335')" title="樱桃红"></div>
                                <div class="color-option" style="background: #9333ea;" onclick="window.docExec('hiliteColor', '#9333ea')" title="葡萄紫"></div>
                                <div class="color-clear-btn" onclick="window.docExec('hiliteColor', 'transparent')">清除高亮</div>
                            </div>
                        </div>
                        <div class="doc-tool-separator"></div>

                        <button class="doc-tool-btn" onclick="window.docExec('justifyLeft')" title="左对齐">⇦</button>
                        <button class="doc-tool-btn" onclick="window.docExec('justifyCenter')" title="居中">⇨⇦</button>
                        <button class="doc-tool-btn" onclick="window.docExec('justifyRight')" title="右对齐">⇨</button>
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
                        <!-- 这个被完全物理隐藏后不会显示，保留DOM仅为兼容 -->
                    </div>
                    <div class="doc-paper-wrapper" id="doc-paper-wrapper">
                        <div class="doc-paper" id="doc-editor" placeholder="开始撰写内容...\n\n· 支持直接从 Word/WPS 全选复制并粘贴，所有颜色、表格和排版将100%原封不动保留。\n· 支持直接将电脑的 图片、视频、音频、PDF、PPT 拖拽到此处极速上传。"></div>
                        <div class="doc-drag-overlay">松开鼠标，极速上传并插入到文档中</div>
                    </div>
                </div>
                
                <!-- 🚀 高级 6D 玻璃一键返回顶部按钮 -->
                <div class="btn-back-to-top" id="btn-back-to-top" onclick="window.docScrollToTop()" title="回到顶部">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', docModalHTML);

    // ================== 🚀 新增：滚动监听与回到顶部引擎 ==================
    setTimeout(() => {
        const scrollArea = document.querySelector('.doc-body-scroll');
        const topBtn = document.getElementById('btn-back-to-top');
        if (scrollArea && topBtn) {
            scrollArea.addEventListener('scroll', () => {
                if (scrollArea.scrollTop > 300) {
                    topBtn.classList.add('show');
                } else {
                    topBtn.classList.remove('show');
                }
            });
        }
    }, 500);

    window.docScrollToTop = function() {
        const scrollArea = document.querySelector('.doc-body-scroll');
        if (scrollArea) {
            scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // ================== 数据结构与状态 ==================
    let currentSystemId = null; 
    let activeArticleId = null;

    // 🚀 全局状态快照引擎
    window.flushDocToDB = function() {
        if (!activeArticleId || !currentSystemId || !db || !db.docSystems || !db.docSystems[currentSystemId]) return;
        
        const editor = document.getElementById('doc-editor');
        const titleInput = document.getElementById('doc-title');
        if (!editor) return;

        const currentContent = editor.innerHTML;
        const currentTitle = titleInput ? (titleInput.value.trim() || '无标题文档') : '无标题文档';
        
        db.docSystems[currentSystemId].categories.forEach(c => {
            c.articles.forEach(a => { 
                if (a.id === activeArticleId) {
                    a.content = currentContent; 
                    a.title = currentTitle;
                } 
            });
        });
    };

    // 3. 核心 API: 打开整个知识库系统
    window.openCounselingDoc = function(systemId) {
        if (!systemId) systemId = 'sys_default_doc';
        currentSystemId = systemId;
        activeArticleId = null;
        
        if (!db.docSystems) db.docSystems = {};
        if (!db.docSystems[systemId]) {
            db.docSystems[systemId] = {
                title: '知识库',
                categories: [{ id: 'cat_' + Date.now(), name: '默认分类', articles: [] }]
            };
        }

        const modal = document.getElementById('counseling-doc-modal');
        const sidebar = document.getElementById('doc-sidebar');
        
        if (state.isAdmin) {
            modal.classList.add('admin-mode');
            modal.classList.remove('reader-mode');
            document.getElementById('doc-editor').setAttribute('contenteditable', 'true');
        } else {
            modal.classList.remove('admin-mode');
            modal.classList.add('reader-mode');
            document.getElementById('doc-editor').setAttribute('contenteditable', 'false');
            window.setDocZoom(1, 'normal'); 
        }

        // 默认取消目录收起状态，保持双栏或分屏显示
        sidebar.classList.remove('collapsed');

        window.renderKBSidebar();
        
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

    // 🚀 核心保留：彻底退出系统，回到登录主页
    window.closeCounselingDoc = function() {
        window.flushDocToDB();

        const modal = document.getElementById('counseling-doc-modal');
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    };

    // 🚀 核心重构：退回目录 -> 彻底隐藏右侧编辑区，让目录全屏无干扰
    window.backToDirectory = function() {
        window.flushDocToDB(); // 离开前先默默保存一下用户的阅读状态
        window.kbShowEmptyState(); // 触发全屏目录模式
    };

    window.toggleDocSidebar = function() {
        const sidebar = document.getElementById('doc-sidebar');
        sidebar.classList.toggle('collapsed');
    };

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
                artItem.innerHTML = `
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">📄 ${art.title}</span>
                    <div style="display:flex; flex-shrink:0;">
                        <button class="kb-admin-btn" style="color:#f59e0b;" onclick="event.stopPropagation(); window.kbEditArticle('${cat.id}', '${art.id}')" title="重命名文章">✎</button>
                        <button class="kb-admin-btn del" onclick="event.stopPropagation(); window.kbDeleteArticle('${cat.id}', '${art.id}')" title="删除文章">✖</button>
                    </div>
                `;
                artItem.onclick = () => {
                    window.kbSelectArticle(cat.id, art.id);
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

    window.kbEditArticle = async function(catId, artId) {
        const sys = db.docSystems[currentSystemId];
        const cat = sys.categories.find(c => c.id === catId);
        if (!cat) return;
        const art = cat.articles.find(a => a.id === artId);
        if (!art) return;
        
        const newTitle = prompt("请输入新的文章标题:", art.title);
        if (newTitle && newTitle.trim() !== '') {
            art.title = newTitle.trim();
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

    // ================== 🚀 右侧文档与全屏目录引擎重构 ==================
    window.kbShowEmptyState = function() {
        activeArticleId = null;
        
        // 核心修改：让右侧文章区完全物理隐藏，让左侧目录区100%宽高度全屏展示！
        document.getElementById('doc-main').classList.add('hidden');
        const sidebar = document.getElementById('doc-sidebar');
        sidebar.classList.add('full-screen');
        sidebar.classList.remove('collapsed'); // 确保从手机端退回时，菜单是展开的
        
        document.getElementById('doc-paper-wrapper').style.display = 'none';
        document.getElementById('doc-title').value = '';
    };

    window.kbSelectArticle = function(catId, artId) {
        window.flushDocToDB();

        activeArticleId = artId;
        const cat = db.docSystems[currentSystemId].categories.find(c => c.id === catId);
        const art = cat.articles.find(a => a.id === artId);
        
        // 核心修改：当点击文章时，解除目录的全屏锁定，恢复右侧文章区显示
        document.getElementById('doc-main').classList.remove('hidden');
        document.getElementById('doc-sidebar').classList.remove('full-screen');
        
        document.getElementById('doc-paper-wrapper').style.display = 'block';
        
        document.getElementById('doc-title').value = art.title;
        document.getElementById('doc-editor').innerHTML = art.content;
        
        window.renderKBSidebar(); 
    };

    window.kbSaveDocMeta = async function() {
        if (!activeArticleId) return;
        window.flushDocToDB();
        if(typeof window.saveDB === 'function') {
            await window.saveDB();
            window.renderKBSidebar();
        }
    };

    window.saveCounselingDoc = async function() {
        if (!activeArticleId) return window.showGlobalToast('请先选择或创建一篇文档', 'error');
        
        const saveBtn = document.getElementById('btn-doc-save'); 
        if (saveBtn) {
            saveBtn.innerHTML = '⏳ 全局保存中...';
            saveBtn.style.pointerEvents = 'none';
            saveBtn.style.opacity = '0.8';
        }

        const resetBtn = () => {
            if (saveBtn) {
                saveBtn.innerHTML = '☁ 云端保存';
                saveBtn.style.pointerEvents = 'auto';
                saveBtn.style.opacity = '1';
                saveBtn.style.backgroundColor = '';
                saveBtn.style.boxShadow = '';
            }
        };

        window.flushDocToDB();
        
        if (typeof window.saveDB === 'function') {
            await window.saveDB();
            window.showGlobalToast('✅ 全局所有数据已安全同步', 'success');
            
            if (saveBtn) {
                saveBtn.innerHTML = '✅ 全局已同步';
                saveBtn.style.backgroundColor = '#10b981';
                saveBtn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                saveBtn.style.opacity = '1';
                
                setTimeout(() => { resetBtn(); }, 2000);
            }
        } else {
            resetBtn();
            window.showGlobalToast('保存失败：全局同步引擎丢失', 'error');
        }
    };

    // ================== R2 富文本与多媒体引擎 ==================
    
    // 面板开关与全局事件监听
    window.closeColorMenus = function() {
        document.querySelectorAll('.color-dropdown-menu').forEach(m => m.classList.remove('show'));
    };

    window.toggleColorMenu = function(e, menuId) {
        e.stopPropagation(); 
        
        const editor = document.getElementById('doc-editor');
        if (window.docSavedRange && editor) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(window.docSavedRange);
        }

        document.querySelectorAll('.color-dropdown-menu').forEach(m => {
            if (m.id !== menuId) m.classList.remove('show');
        });
        
        const target = document.getElementById(menuId);
        if (target) target.classList.toggle('show');
    };

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.color-dropdown-wrap')) {
            window.closeColorMenus();
        }
    });

    window.docExec = function(command, value = null) {
        window.closeColorMenus(); 
        const editor = document.getElementById('doc-editor');
        editor.focus();
        
        if (window.docSavedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(window.docSavedRange);
        }
        
        try { document.execCommand('styleWithCSS', false, true); } catch(e) {}
        document.execCommand(command, false, value);
    };

    const editorWrapper = document.getElementById('doc-paper-wrapper');
    const editor = document.getElementById('doc-editor');

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
