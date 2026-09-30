/**
 * 恒久印记 - 全端对称响应式布局与动态顶栏引擎
 * 文件名: stage-layout.js
 */

(function initFluidLayout() {
    // 1. 注入全端完美对称的弹性样式
    if (!document.getElementById('fluid-layout-style')) {
        const style = document.createElement('style');
        style.id = 'fluid-layout-style';
        style.innerHTML = `
            /* 顶部动态功能区样式 */
            .top-modules-wrapper {
                display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; 
                width: 100%; margin-bottom: 25px; position: relative; z-index: 10;
            }
            .brand-capsule-dynamic {
                display: inline-flex; align-items: center; justify-content: center; gap: 10px;
                background: var(--theme-glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid var(--theme-glass-border); border-radius: 50px; padding: 6px 20px 6px 6px;
                box-shadow: 0 8px 25px var(--theme-glass-shadow), inset 0 1px 2px var(--theme-glass-inset);
                cursor: pointer; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); color: var(--theme-text);
                position: relative;
            }
            .brand-capsule-dynamic:active { transform: scale(0.95); }
            .brand-capsule-dynamic img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
            .brand-capsule-dynamic input { 
                background: transparent; border: none; color: inherit; font-weight: bold; 
                font-size: 1.1rem; letter-spacing: 2px; font-family: var(--font-title); 
                outline: none; max-width: 120px; text-align: center; pointer-events: none; 
            }
            .edit-mode .brand-capsule-dynamic input { pointer-events: auto; border-bottom: 1px dashed var(--theme-primary); }
            .edit-mode .brand-capsule-dynamic img { cursor: pointer; }

            /* 主模块对称流体布局 */
            .stage-array-flex {
                display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start;
                gap: clamp(12px, 3vw, 25px); width: 100%; padding: 10px; max-width: 1100px; margin: 0 auto;
            }
            .stage-card-flex {
                flex: 0 1 calc(25% - 25px); /* PC端默认并排4个 */
                min-width: 105px; max-width: 150px;
                background: var(--theme-glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid var(--theme-glass-border); border-radius: 20px; padding: clamp(15px, 4vw, 25px) 5px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-shadow: 0 8px 25px var(--theme-glass-shadow), inset 0 1px 2px var(--theme-glass-inset);
                cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative;
            }
            .stage-card-flex:active { transform: translateY(2px) scale(0.96); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            
            /* 极限响应式断点 */
            @media (max-width: 850px) { .stage-card-flex { flex: 0 1 calc(33.333% - 20px); } }
            @media (max-width: 480px) { .stage-card-flex { flex: 0 1 calc(33.333% - 12px); min-width: 90px; } }

            .del-badge {
                position: absolute; top: -10px; right: -10px; width: 28px; height: 28px; border-radius: 50%;
                background: #ef4444; color: white; display: flex; justify-content: center; align-items: center;
                font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(239,68,68,0.5);
                z-index: 10; transition: transform 0.2s;
            }
            .del-badge:active { transform: scale(0.85); }
        `;
        document.head.appendChild(style);
    }

    // 2. 覆盖主程序的渲染函数，接管主页结构
    window.initStageScreen = function() {
        if (!state.isAdmin && currentUserAccount !== 'yishuyangguang') {
            const uData = db.users[currentUserAccount]; const nowTime = Date.now();
            if (!uData || !uData.expireAt || uData.expireAt < nowTime) { alert("【系统拦截】您的时空印记已到期或未激活。请联系站长获取新卡密续费。"); window.logout(); return; }
            if (uData.status === 'banned') { alert("【系统拦截】您的账号已被限制使用。"); window.logout(); return; }
        }

        document.getElementById('top-admin-controls').style.display = state.isAdmin ? 'flex' : 'none'; 
        const currentParams = state.isLightTheme ? { bg: '#f8f6f0', p: '#d99a29', s: '#f4c453' } : { bg: '#1c1d22', p: '#d4af37', s: '#ebd373' }; 
        document.documentElement.style.setProperty('--theme-bg-color', currentParams.bg); 
        document.documentElement.style.setProperty('--theme-primary', currentParams.p); 
        document.documentElement.style.setProperty('--theme-secondary', currentParams.s); 
        window.updateThemeCache(currentParams.p);

        // 渲染顶部动态模块 (如印记音律)
        const topContainer = document.getElementById('top-modules-dynamic-container');
        if (topContainer) {
            topContainer.innerHTML = '';
            (db.topModules || []).forEach((tm, idx) => {
                const capsule = document.createElement('div');
                capsule.className = 'brand-capsule-dynamic';
                capsule.onclick = (e) => {
                    if (state.isEditMode) return; // 编辑模式下阻止跳转
                    if (tm.actionType === 'music') window.openMusicTypeModal();
                    else if (tm.actionType === 'link' && tm.url) window.open(tm.url, '_blank');
                    else window.showGlobalToast('该模块暂未配置功能', 'loading');
                };

                // 图片/图标
                const imgEl = document.createElement('img');
                imgEl.src = tm.icon || 'favicon-32x32.png';
                imgEl.onerror = function() { this.src = 'favicon-32x32.png'; };
                
                // 文本输入框 (只读，编辑模式可写)
                const inputEl = document.createElement('input');
                inputEl.value = tm.name;
                
                if (state.isEditMode) {
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

        // 渲染主模块 (绝对对称排版)
        const mainContainer = document.getElementById('stage-buttons-container'); 
        if (mainContainer) {
            mainContainer.innerHTML = '';
            mainContainer.className = 'stage-array-flex'; // 注入新的对称 Flex 类

            Object.keys(db.stages).forEach((sKey) => { 
                const sData = db.stages[sKey]; const iconB64 = sData.icon; const displayName = sData.name || sKey; 
                
                const card = document.createElement('div'); 
                card.className = 'stage-card-flex'; 
                card.onclick = (e) => { if(!state.isEditMode) window.selectStage(sKey); }; 
                
                const iconDiv = document.createElement('div'); iconDiv.className = 'stage-icon-dropzone'; 
                if (iconB64) { iconDiv.innerHTML = `<img src="${iconB64}">`; } else { iconDiv.innerHTML = `<span style="font-size: clamp(16px, 5vw, 26px); color:var(--theme-text); font-family:var(--font-title); opacity:0.9;">${displayName.charAt(0)}</span>`; } 
                
                const titleInput = document.createElement('input'); titleInput.className = 'stage-card-title'; titleInput.value = displayName; 
                
                if (state.isEditMode) { 
                    iconDiv.addEventListener('click', (e) => { e.stopPropagation(); const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = ev => {if(ev.target.files[0]) window.handleIconUpload(ev.target.files[0], sKey)}; input.click(); }); 
                    titleInput.addEventListener('click', (e) => { e.stopPropagation(); }); titleInput.addEventListener('blur', (e) => { sData.name = e.target.value; window.saveDB(); }); 
                    
                    const delBtn = document.createElement('div'); delBtn.className = 'del-badge'; delBtn.innerHTML = '✖';
                    delBtn.onclick = (e) => { e.stopPropagation(); window.deleteStage(sKey); };
                    card.appendChild(delBtn);
                } 
                card.appendChild(iconDiv); card.appendChild(titleInput); 
                mainContainer.appendChild(card);
            }); 
        }
        window.navigateTo('screen-stage'); 
    };

    // 3. 注入顶部模块的管理 API
    window.addNewTopModule = async function() {
        const name = prompt("请输入顶部模块名称 (如: 小程序/音律等):", "新模块");
        if(!name) return;
        const type = prompt("请输入模块类型\n1: 音乐组件 (弹窗)\n2: 外部链接 (跳转URL)", "1");
        let actionType = 'none'; let url = '';
        if(type === '1') { actionType = 'music'; } 
        else if (type === '2') { actionType = 'link'; url = prompt("请输入外部链接 (包含 https://):", "https://"); }

        if(!db.topModules) db.topModules = [];
        db.topModules.push({ id: 'tm_' + Date.now(), name: name, icon: 'apple-touch-icon.png', actionType: actionType, url: url });
        await window.saveDB();
        window.initStageScreen();
    };

    window.deleteTopModule = async function(idx) {
        if(confirm(`确定删除顶部模块 [${db.topModules[idx].name}] 吗？`)) {
            db.topModules.splice(idx, 1);
            await window.saveDB();
            window.initStageScreen();
        }
    };

    window.handleTopModuleIconUpload = function(file, idx) {
        window.compressImageFile(file, async (base64Str) => {
            db.topModules[idx].icon = base64Str;
            await window.saveDB();
            window.initStageScreen();
        });
    };

})();
