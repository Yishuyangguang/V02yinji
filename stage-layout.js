/**
 * 恒久印记 - 全端对称响应式布局与动态顶栏引擎
 * 文件名: stage-layout.js
 * 更新内容: 顶栏美学重构(药丸胶囊)、注入HTML5原生拖拽排序(Drag & Drop)、极速同步引擎
 */

(function initFluidLayout() {
    // 1. 注入全端完美对称的弹性样式，使用 !important 彻底阻断外部 CSS 污染
    if (!document.getElementById('fluid-layout-style')) {
        const style = document.createElement('style');
        style.id = 'fluid-layout-style';
        style.innerHTML = `
            /* ================= 🚀 顶栏动态功能区美学重构 ================= */
            .top-modules-wrapper {
                display: flex; flex-wrap: wrap; justify-content: center; gap: 20px 25px; 
                width: 100%; margin-bottom: 50px; position: relative; z-index: 10;
            }
            .brand-capsule-dynamic {
                display: inline-flex; align-items: center; justify-content: flex-start; gap: 12px;
                background: var(--theme-glass-bg); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                border: 1px solid var(--theme-glass-border); border-radius: 50px; /* 完美药丸形状 */
                padding: 6px 28px 6px 8px; height: 54px; min-width: 170px;
                box-shadow: 0 8px 25px var(--theme-glass-shadow), inset 0 1px 2px var(--theme-glass-inset);
                cursor: pointer; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); color: var(--theme-text);
                position: relative;
            }
            .brand-capsule-dynamic:active { transform: scale(0.95); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            
            .brand-capsule-dynamic img { 
                width: 40px !important; height: 40px !important; border-radius: 50% !important; 
                object-fit: cover !important; flex-shrink: 0 !important; 
                border: 1px solid rgba(255,255,255,0.2) !important; 
                margin: 0 !important; padding: 0 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            }
            .brand-capsule-dynamic input { 
                background: transparent !important; border: none !important; color: inherit !important; font-weight: bold !important; 
                font-size: 1.15rem !important; letter-spacing: 2px !important; font-family: var(--font-title) !important; 
                outline: none !important; max-width: 130px !important; text-align: center !important; pointer-events: none; 
                box-shadow: none !important; margin: 0 !important; padding: 0 !important;
            }
            .edit-mode .brand-capsule-dynamic input { pointer-events: auto; border-bottom: 1px dashed var(--theme-primary) !important; padding: 2px 5px !important; cursor: text; }
            .edit-mode .brand-capsule-dynamic img { cursor: pointer; }

            /* ================= 🚀 拖拽状态机视觉增强 ================= */
            .dragging { opacity: 0.4 !important; transform: scale(0.9) !important; }
            .drag-over-active { border: 2px dashed var(--theme-primary) !important; transform: scale(1.05) !important; z-index: 20; box-shadow: 0 0 20px rgba(99,102,241,0.4) !important; }
            .brand-capsule-dynamic.drag-over-active { background: rgba(99, 102, 241, 0.1) !important; }

            /* ================= 主模块绝对对称流体布局 ================= */
            .stage-array-flex {
                display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start;
                gap: clamp(15px, 3vw, 35px); width: 100%; padding: 10px 0; max-width: 900px; margin: 0 auto;
            }
            .stage-card-flex {
                /* PC端强制 4个一行，精确数学控制基础宽度，彻底解决 5+2 不对称问题 */
                width: calc(25% - 30px); min-width: 130px; max-width: 180px;
                background: var(--theme-glass-bg); backdrop-filter: blur(25px) saturate(150%); -webkit-backdrop-filter: blur(25px) saturate(150%);
                border: 1px solid var(--theme-glass-border); border-radius: 30px; padding: 30px 10px 25px 10px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-shadow: 0 15px 40px var(--theme-glass-shadow), inset 0 1px 2px var(--theme-glass-inset);
                cursor: pointer; transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); position: relative;
            }
            .stage-card-flex:active { transform: translateY(4px) scale(0.96); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
            
            /* 强制锁定主模块标题，拒绝背景色污染撑爆 */
            .stage-card-title { 
                background: transparent !important; border: none !important; color: var(--theme-text) !important; 
                font-weight: bold !important; font-size: clamp(0.95rem, 3.5vw, 1.15rem) !important; letter-spacing: 1px !important; 
                text-align: center !important; width: 100% !important; padding: 0 !important; margin: 0 !important; 
                outline: none !important; pointer-events: none; box-shadow: none !important; text-shadow: 0 2px 4px rgba(0,0,0,0.5) !important;
            }
            .edit-mode .stage-card-title { 
                pointer-events: auto; background: rgba(0,0,0,0.3) !important; 
                border-bottom: 1px dashed var(--theme-primary) !important; padding: 5px !important; border-radius: 8px !important; cursor: text;
            }

            /* 圆形图片容器 - 大小随屏幕动态优雅缩放 */
            .stage-icon-dropzone { 
                width: clamp(65px, 16vw, 90px) !important; height: clamp(65px, 16vw, 90px) !important; 
                border-radius: 50% !important; overflow: hidden !important; margin-bottom: 18px !important; position: relative !important;
                display: flex; justify-content: center; align-items: center; flex-shrink: 0;
                background: rgba(255,255,255,0.05); border: 2px solid var(--theme-primary); 
                box-shadow: 0 8px 25px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.4); transition: all 0.3s; 
            }
            .stage-icon-dropzone img { 
                width: 100% !important; height: 100% !important; object-fit: cover !important; 
                display: block !important; border-radius: 50% !important; margin: 0 !important; 
                padding: 0 !important; border: none !important; box-shadow: none !important; 
            }
            .edit-mode .stage-icon-dropzone { cursor: pointer; pointer-events: auto; background-color: rgba(0,0,0,0.3); }

            /* 删除按钮徽章 - 黄金比例定位 */
            .del-badge {
                position: absolute; top: -8px; right: -8px; width: 26px; height: 26px; border-radius: 50%;
                background: #ef4444; color: white; display: flex; justify-content: center; align-items: center;
                font-size: 13px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(239,68,68,0.5);
                z-index: 30; transition: transform 0.2s;
            }
            .del-badge:active { transform: scale(0.85); }

            /* ================= 🚀 响应式断点自动坍缩 ================= */
            @media (max-width: 850px) { 
                /* Pad端：强制 3个一行 */
                .stage-card-flex { width: calc(33.333% - 25px); min-width: 110px; padding: 25px 10px 20px 10px; border-radius: 26px; } 
            }
            @media (max-width: 480px) { 
                /* 手机端：极限压缩间距，严格锁定 3个一行，杜绝换行溢出 */
                .stage-array-flex { gap: 12px; padding: 5px; }
                .stage-card-flex { width: calc(33.333% - 12px); min-width: 90px; padding: 20px 5px 15px 5px; border-radius: 22px; }
                .stage-icon-dropzone { margin-bottom: 12px !important; border-width: 1px; }
                .stage-card-title { font-size: 0.9rem !important; }
                .brand-capsule-dynamic { min-width: 140px; padding: 6px 20px 6px 6px; height: 48px; }
                .brand-capsule-dynamic img { width: 34px !important; height: 34px !important; }
                .brand-capsule-dynamic input { font-size: 1rem !important; max-width: 100px !important; }
            }
        `;
        document.head.appendChild(style);
    }

    // 全局拖拽状态字典
    let dragSource = null; 

    // 2. 接管主程序的渲染函数，挂载动态顶栏与主模块
    window.initStageScreen = function() {
        if (!state.isAdmin && currentUserAccount !== 'yishuyangguang') {
            const uData = db.users[currentUserAccount]; const nowTime = Date.now();
            if (!uData || !uData.expireAt || uData.expireAt < nowTime) { alert("【系统拦截】您的时空印记已到期或未激活。请在登录界面联系站长获取新卡密续费。"); window.logout(); return; }
            if (uData.status === 'banned') { alert("【系统拦截】您的账号已被限制使用。"); window.logout(); return; }
        }

        document.getElementById('top-admin-controls').style.display = state.isAdmin ? 'flex' : 'none'; 
        const currentParams = state.isLightTheme ? { bg: '#f8f6f0', p: '#d99a29', s: '#f4c453' } : { bg: '#1c1d22', p: '#d4af37', s: '#ebd373' }; 
        document.documentElement.style.setProperty('--theme-bg-color', currentParams.bg); 
        document.documentElement.style.setProperty('--theme-primary', currentParams.p); 
        document.documentElement.style.setProperty('--theme-secondary', currentParams.s); 
        window.updateThemeCache(currentParams.p);

        // ================= 渲染顶部动态模块 =================
        const topContainer = document.getElementById('top-modules-dynamic-container');
        if (topContainer) {
            topContainer.innerHTML = '';
            (db.topModules || []).forEach((tm, idx) => {
                const capsule = document.createElement('div');
                capsule.className = 'brand-capsule-dynamic';
                
                capsule.onclick = (e) => {
                    if (state.isEditMode) return; 
                    if (tm.actionType === 'music') { if(typeof window.openMusicTypeModal === 'function') window.openMusicTypeModal(); } 
                    else if (tm.actionType === 'link' && tm.url) { window.open(tm.url, '_blank'); } 
                    else if (tm.actionType === 'doc') {
                        if(typeof window.openCounselingDoc === 'function') window.openCounselingDoc(tm.url); 
                        else window.showGlobalToast('文档引擎加载中...', 'loading');
                    } else { window.showGlobalToast('该模块暂未配置功能', 'loading'); }
                };

                const imgEl = document.createElement('img');
                imgEl.src = tm.icon || 'favicon-32x32.png';
                imgEl.onerror = function() { this.src = 'favicon-32x32.png'; };
                
                const inputEl = document.createElement('input');
                inputEl.value = tm.name;
                
                // 🚀 开启深度编辑时的拖拽与修改引擎
                if (state.isEditMode) {
                    capsule.draggable = true;
                    
                    // 防护盾：防止在输入文字时触发拖拽
                    inputEl.onmousedown = (e) => e.stopPropagation();
                    inputEl.ontouchstart = (e) => e.stopPropagation();
                    
                    capsule.ondragstart = (e) => {
                        dragSource = { type: 'top', id: idx };
                        e.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => capsule.classList.add('dragging'), 0);
                    };
                    capsule.ondragover = (e) => {
                        if (dragSource && dragSource.type === 'top') { e.preventDefault(); capsule.classList.add('drag-over-active'); }
                    };
                    capsule.ondragleave = () => capsule.classList.remove('drag-over-active');
                    capsule.ondrop = async (e) => {
                        e.stopPropagation();
                        capsule.classList.remove('drag-over-active');
                        if (dragSource && dragSource.type === 'top' && dragSource.id !== idx) {
                            const arr = db.topModules;
                            const item = arr.splice(dragSource.id, 1)[0];
                            arr.splice(idx, 0, item);
                            await window.saveDB(); // 极速落盘
                            window.initStageScreen(); // 无感刷新 UI
                        }
                    };
                    capsule.ondragend = () => capsule.classList.remove('dragging');

                    imgEl.onclick = (e) => {
                        e.stopPropagation();
                        const fileIpt = document.createElement('input'); fileIpt.type = 'file'; fileIpt.accept = 'image/*';
                        fileIpt.onchange = ev => { if(ev.target.files[0]) window.handleTopModuleIconUpload(ev.target.files[0], idx); };
                        fileIpt.click();
                    };
                    inputEl.onclick = (e) => e.stopPropagation();
                    inputEl.onblur = async (e) => { tm.name = e.target.value; await window.saveDB(); };

                    const delBtn = document.createElement('div');
                    delBtn.className = 'del-badge'; delBtn.innerHTML = '✖';
                    delBtn.onclick = (e) => { e.stopPropagation(); window.deleteTopModule(idx); };
                    capsule.appendChild(delBtn);
                }

                capsule.appendChild(imgEl);
                capsule.appendChild(inputEl);
                topContainer.appendChild(capsule);
            });
        }

        // ================= 渲染主模块 (含极速拖拽引擎) =================
        const mainContainer = document.getElementById('stage-buttons-container'); 
        if (mainContainer) {
            mainContainer.innerHTML = ''; 
            mainContainer.className = 'stage-array-flex'; 
            
            Object.keys(db.stages).forEach((sKey) => { 
                const sData = db.stages[sKey]; 
                const iconB64 = sData.icon; 
                const displayName = sData.name || sKey; 
                
                const card = document.createElement('div'); 
                card.className = 'stage-card-flex'; 
                card.onclick = (e) => { if(!state.isEditMode) window.selectStage(sKey); }; 
                
                const iconDiv = document.createElement('div'); 
                iconDiv.className = 'stage-icon-dropzone'; 
                
                if (iconB64) { 
                    iconDiv.innerHTML = `<img src="${iconB64}" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:50%; margin:0; padding:0; border:none; box-shadow:none;">`; 
                } else { 
                    iconDiv.innerHTML = `<span style="font-size: clamp(16px, 5vw, 26px); color:var(--theme-text); font-family:var(--font-title); opacity:0.9;">${displayName.charAt(0)}</span>`; 
                } 
                
                const titleInput = document.createElement('input'); 
                titleInput.className = 'stage-card-title'; 
                titleInput.value = displayName; 
                
                // 🚀 开启深度编辑时的拖拽与修改引擎
                if (state.isEditMode) { 
                    card.draggable = true;

                    // 防护盾
                    titleInput.onmousedown = (e) => e.stopPropagation();
                    titleInput.ontouchstart = (e) => e.stopPropagation();

                    card.ondragstart = (e) => {
                        dragSource = { type: 'stage', id: sKey };
                        e.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => card.classList.add('dragging'), 0);
                    };
                    card.ondragover = (e) => {
                        if (dragSource && dragSource.type === 'stage') { e.preventDefault(); card.classList.add('drag-over-active'); }
                    };
                    card.ondragleave = () => card.classList.remove('drag-over-active');
                    card.ondrop = async (e) => {
                        e.stopPropagation();
                        card.classList.remove('drag-over-active');
                        if (dragSource && dragSource.type === 'stage' && dragSource.id !== sKey) {
                            const keys = Object.keys(db.stages);
                            const fromIdx = keys.indexOf(dragSource.id);
                            const toIdx = keys.indexOf(sKey);
                            
                            // 内存键值对重排
                            keys.splice(fromIdx, 1);
                            keys.splice(toIdx, 0, dragSource.id);

                            const newStagesObj = {};
                            keys.forEach(k => newStagesObj[k] = db.stages[k]);
                            db.stages = newStagesObj; // 完美覆盖

                            await window.saveDB(); // 极速落盘
                            window.initStageScreen(); // 无感刷新 UI
                        }
                    };
                    card.ondragend = () => card.classList.remove('dragging');

                    iconDiv.addEventListener('click', (e) => { 
                        e.stopPropagation(); 
                        const input = document.createElement('input'); 
                        input.type = 'file'; 
                        input.accept = 'image/*'; 
                        input.onchange = ev => {if(ev.target.files[0]) window.handleIconUpload(ev.target.files[0], sKey)}; 
                        input.click(); 
                    }); 
                    titleInput.addEventListener('click', (e) => { e.stopPropagation(); }); 
                    titleInput.addEventListener('blur', (e) => { sData.name = e.target.value; window.saveDB(); }); 
                    
                    const delBtn = document.createElement('div');
                    delBtn.className = 'del-badge';
                    delBtn.innerHTML = '✖';
                    delBtn.onclick = (e) => { e.stopPropagation(); window.deleteStage(sKey); };
                    card.appendChild(delBtn);
                } 
                card.appendChild(iconDiv); 
                card.appendChild(titleInput); 
                mainContainer.appendChild(card);
            }); 
        }
        window.navigateTo('screen-stage'); 
    };

    // ================= 全局动态功能 API =================

    // 动态新增顶部模块
    window.addNewTopModule = async function() {
        const name = prompt("请输入顶部模块名称 (如: 婚前辅导/印记音律):", "新模块");
        if(!name) return;
        
        const type = prompt("请输入模块类型\n1: 音乐组件 (弹窗)\n2: 外部链接 (跳转URL)\n3: 云端富文本辅导文档 (多媒体版)", "3");
        
        let actionType = 'none'; let url = '';
        if(type === '1') { 
            actionType = 'music'; 
        } else if (type === '2') { 
            actionType = 'link'; 
            url = prompt("请输入外部链接 (包含 https://):", "https://"); 
        } else if (type === '3') { 
            actionType = 'doc'; 
            url = 'doc_' + Date.now(); // 自动生成全球唯一的文档识别码 
        }

        if(!db.topModules) db.topModules = [];
        db.topModules.push({ 
            id: 'tm_' + Date.now(), 
            name: name, 
            icon: 'apple-touch-icon.png', 
            actionType: actionType, 
            url: url 
        });
        
        await window.saveDB();
        window.initStageScreen();
    };

    // 删除顶部模块
    window.deleteTopModule = async function(idx) {
        if(confirm(`确定彻底删除顶部模块 [${db.topModules[idx].name}] 吗？\n(关联的文档内容也将无法访问)`)) {
            db.topModules.splice(idx, 1);
            await window.saveDB();
            window.initStageScreen();
        }
    };

    // 顶部模块图标极速上传
    window.handleTopModuleIconUpload = function(file, idx) {
        if(typeof window.compressImageFile === 'function') {
            window.compressImageFile(file, async (base64Str) => {
                db.topModules[idx].icon = base64Str;
                await window.saveDB();
                window.initStageScreen();
            });
        }
    };

    // 主模块图片极速上传
    window.handleIconUpload = function(file, stageKey) { 
        if(typeof window.compressImageFile === 'function') {
            window.compressImageFile(file, async (base64Str) => { 
                db.stages[stageKey].icon = base64Str; 
                await window.saveDB(); 
                window.initStageScreen(); 
            }); 
        }
    };

    // 动态新增主阶段模块
    window.addNewStage = async function() {
        const stageName = prompt("请输入新主模块的名称 (如: 晚年期):");
        if(!stageName) return;
        const newKey = 'stage_' + Date.now();
        db.stages[newKey] = {
            name: stageName, 
            icon: '', 
            themeParams: { dark: { bg: '#16171b', p: '#6366f1', s: '#818cf8' }, light: { bg: '#f0f4f8', p: '#4f46e5', s: '#818cf8' } },
            prepText: '请准备，预备进入内心的探索。', 
            categories: [{ id: 'cat_default_' + Date.now(), name: '核心印记' }], 
            cards: []
        };
        await window.saveDB(); 
        window.initStageScreen();
    };

    // 删除主阶段模块
    window.deleteStage = async function(sKey) {
        if(confirm(`确定要彻底删除大模块 [${db.stages[sKey].name}] 吗？\n删除后内部所有卡片将不可恢复！`)) {
            delete db.stages[sKey]; 
            await window.saveDB(); 
            window.initStageScreen();
        }
    };

})();
