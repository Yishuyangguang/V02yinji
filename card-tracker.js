/**
 * 恒久印记 - 卡片进度追踪与 NEW 标签扩展引擎 (精准变量穿透打通版)
 * 文件名: card-tracker.js
 * 说明: 通过在 index.html 的 </body> 前引入 <script src="card-tracker.js"></script> 即可激活。
 */
(function initTracker() {
    // 1. 动态植入高级流体呼吸感 NEW 标签的 CSS
    if (!document.getElementById('tracker-style')) {
        const style = document.createElement('style');
        style.id = 'tracker-style';
        style.innerHTML = `
            .card-new-badge {
                position: absolute;
                top: -6px;
                right: -6px;
                background: linear-gradient(135deg, #ff4757, #ff6b81);
                color: white;
                font-size: 0.75rem;
                font-weight: 900;
                padding: 4px 10px;
                border-radius: 12px 12px 12px 0;
                box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4), inset 0 1px 2px rgba(255,255,255,0.4);
                z-index: 10;
                pointer-events: none;
                letter-spacing: 1px;
                animation: pulse-badge 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
            }
            .light-theme .card-new-badge {
                box-shadow: 0 4px 10px rgba(255, 71, 87, 0.3), inset 0 1px 2px rgba(255,255,255,0.8);
            }
            @keyframes pulse-badge {
                0% { transform: scale(1); box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4); }
                50% { transform: scale(1.08); box-shadow: 0 6px 15px rgba(255, 71, 87, 0.6); }
                100% { transform: scale(1); box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4); }
            }
        `;
        document.head.appendChild(style);
    }

    // 2. 智能轮询探针：等待主程序的全局 let 变量彻底释放到内存池
    function applyPatches() {
        // 修复暗病：使用全局变量名本身探测，而不是 window.db (因为 index.html 中是用 let 块级声明在顶层的)
        if (typeof window.renderCardList === 'function' && typeof db !== 'undefined' && typeof state !== 'undefined' && !window.renderCardList.isTrackerPatched) {
            
            // ============== 核心拦截 1：注入 NEW 标签渲染 ==============
            window.renderCardList = function() {
                const cats = db.stages[state.stage].categories || [];
                const tabContainer = document.getElementById('cat-tabs-container');
                if(tabContainer) tabContainer.innerHTML = '';
                
                if (cats.length > 1 || state.isEditMode) {
                    cats.forEach(cat => {
                        const tab = document.createElement('div');
                        tab.className = `cat-tab ${cat.id === state.activeCategoryId ? 'active' : ''}`;
                        tab.innerText = cat.name;
                        tab.onclick = () => { state.activeCategoryId = cat.id; window.renderCardList(); };
                        if(tabContainer) tabContainer.appendChild(tab);
                    });
                }
                
                const container = document.getElementById('card-list-container');
                if(container) container.innerHTML = '';
                const activeCards = db.stages[state.stage].cards.filter(c => c.categoryId === state.activeCategoryId); 

                if (activeCards.length > 0 || state.isEditMode) {
                    const grid = document.createElement('div');
                    grid.className = 'content-grid';

                    // 提取当前用户的已完成进度雷达
                    let userCompleted = [];
                    if (typeof currentUserAccount !== 'undefined' && currentUserAccount && db.users[currentUserAccount]) {
                        if (!db.users[currentUserAccount].completedCards) {
                            db.users[currentUserAccount].completedCards = [];
                        }
                        userCompleted = db.users[currentUserAccount].completedCards;
                    }

                    activeCards.forEach((card) => {
                        const cardDiv = document.createElement('div');
                        cardDiv.className = 'data-card';
                        
                        // 【核心触发逻辑】：若未在此用户的记录薄中找到该卡片ID，且不在深度编辑模式，挂载NEW红点
                        let badgeHtml = '';
                        if (!userCompleted.includes(card.id) && !state.isEditMode) {
                            badgeHtml = `<div class="card-new-badge">NEW</div>`;
                        }

                        cardDiv.innerHTML = `${badgeHtml}<h3 class="card-inner-title">${card.title}</h3>`;
                        
                        if (state.isEditMode) {
                            const globalIndex = db.stages[state.stage].cards.findIndex(c => c.id === card.id);
                            const actDiv = document.createElement('div');
                            actDiv.className = 'card-edit-badge';
                            actDiv.innerHTML = `<div class="action-icon" onclick="event.stopPropagation(); window.openEditModal(${globalIndex})">✎</div><div class="action-icon del" onclick="event.stopPropagation(); window.deleteCard(${globalIndex})">✖</div>`;
                            cardDiv.appendChild(actDiv);
                        }
                        cardDiv.onclick = () => { if(!state.isEditMode) window.startCardFlow(card); };
                        grid.appendChild(cardDiv);
                    });
                    
                    if (activeCards.length === 0 && state.isEditMode) { 
                        grid.innerHTML = `<p style="opacity:0.4; font-size:0.85rem; text-align:center; width:100%; grid-column: 1 / -1; padding: 20px;">该板块暂无卡片</p>`; 
                    }
                    
                    const section = document.createElement('div');
                    section.className = 'module-section';
                    section.appendChild(grid);
                    if(container) container.appendChild(section);
                } else {
                    if(container) container.innerHTML = '<p style="opacity:0.5; margin-top:30px; text-align:center;">当前分类暂无内容</p>';
                }
            };
            // 打上防冲突印记，避免重复套娃接管
            window.renderCardList.isTrackerPatched = true;

            // ============== 核心拦截 2：长按结束打卡写入 ==============
            const originalCompleteAction = window.completeAction;
            window.completeAction = function() {
                // 记录完成状态：只有当动画抵达 100% 触发此函数时，打入印记
                if (typeof currentUserAccount !== 'undefined' && currentUserAccount && state.currentCard && db.users[currentUserAccount]) {
                    let user = db.users[currentUserAccount];
                    if (!user.completedCards) user.completedCards = [];
                    
                    if (!user.completedCards.includes(state.currentCard.id)) {
                        user.completedCards.push(state.currentCard.id);
                        if(typeof window.saveDB === 'function') window.saveDB(); 
                    }
                }
                
                // 放行：执行主程序原有的重置 UI 与跳转返回逻辑
                if (typeof originalCompleteAction === 'function') {
                    originalCompleteAction();
                }
            };

            // ============== 核心拦截 3：深层云端合并规则扩展 ==============
            if (typeof window.deepRescueDB === 'function' && !window.deepRescueDB.isPatched) {
                const originalDeepRescueDB = window.deepRescueDB;
                window.deepRescueDB = function(target, source) {
                    target = originalDeepRescueDB(target, source);
                    // 在云端向下覆盖时，保护并向下融合同步用户的 completedCards 数组
                    if (source && source.users) {
                        for (let u in source.users) {
                            if (target.users[u] && source.users[u].completedCards) {
                                if (!target.users[u].completedCards) target.users[u].completedCards = [];
                                source.users[u].completedCards.forEach(cardId => {
                                    if (!target.users[u].completedCards.includes(cardId)) {
                                        target.users[u].completedCards.push(cardId);
                                    }
                                });
                            }
                        }
                    }
                    return target;
                };
                window.deepRescueDB.isPatched = true;
            }

            // ============== 探针清零：如果用户已在界面停留，强制重渲染激活标签 ==============
            const cardListScreen = document.getElementById('screen-card-list');
            if (cardListScreen && cardListScreen.classList.contains('active')) {
                window.renderCardList();
            }

            console.log("卡片生命周期追踪引擎 [已挂载并激活]");

        } else {
            // 原系统还没就绪，微秒级潜伏轮询 (50ms)，绝不遗漏
            setTimeout(applyPatches, 50);
        }
    }

    // 唤醒引擎
    applyPatches();

})();
