/**
 * 恒久印记 - 卡片进度追踪与 NEW 标签扩展引擎
 * 文件名: card-tracker.js
 * 说明: 通过在根目录引入此文件，不修改原核心逻辑即可实现“新卡片提示与阅后消失”功能。
 */
(function() {
    // 1. 动态植入高级流体呼吸感 NEW 标签的 CSS
    const style = document.createElement('style');
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
        @keyframes pulse-badge {
            0% { transform: scale(1); box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4); }
            50% { transform: scale(1.08); box-shadow: 0 6px 15px rgba(255, 71, 87, 0.6); }
            100% { transform: scale(1); box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4); }
        }
    `;
    document.head.appendChild(style);

    // 2. 劫持并加固云端数据搜救引擎，确保已完成记录跨设备无损同步
    const originalDeepRescueDB = window.deepRescueDB;
    window.deepRescueDB = function(target, source) {
        // 先走原有的搜救合并逻辑
        target = originalDeepRescueDB(target, source);
        // 补充搜救：用户的卡片完成进度
        if (source.users) {
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

    // 3. 拦截并重写卡片瀑布流渲染引擎，注入 NEW 标签
    window.renderCardList = function() {
        const cats = db.stages[state.stage].categories || [];
        const tabContainer = document.getElementById('cat-tabs-container');
        tabContainer.innerHTML = '';
        
        if (cats.length > 1 || state.isEditMode) {
            cats.forEach(cat => {
                const tab = document.createElement('div');
                tab.className = `cat-tab ${cat.id === state.activeCategoryId ? 'active' : ''}`;
                tab.innerText = cat.name;
                tab.onclick = () => { state.activeCategoryId = cat.id; window.renderCardList(); };
                tabContainer.appendChild(tab);
            });
        }
        
        const container = document.getElementById('card-list-container');
        container.innerHTML = '';
        const activeCards = db.stages[state.stage].cards.filter(c => c.categoryId === state.activeCategoryId); 

        if (activeCards.length > 0 || state.isEditMode) {
            const grid = document.createElement('div');
            grid.className = 'content-grid';

            // 获取当前用户的已完成记录数组
            let userCompleted = [];
            if (currentUserAccount && db.users[currentUserAccount]) {
                if (!db.users[currentUserAccount].completedCards) {
                    db.users[currentUserAccount].completedCards = [];
                }
                userCompleted = db.users[currentUserAccount].completedCards;
            }

            activeCards.forEach((card) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'data-card';
                
                // 【核心变动】：判断当前卡片是否完成，未完成则赋予 NEW 标签
                let badgeHtml = '';
                if (!userCompleted.includes(card.id)) {
                    badgeHtml = `<div class="card-new-badge">New</div>`;
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
            container.appendChild(section);
        } else {
            container.innerHTML = '<p style="opacity:0.5; margin-top:30px; text-align:center;">当前分类暂无内容</p>';
        }
    };

    // 4. 拦截并补丁核心长按完成引擎，写入进度并极速保存
    const originalCompleteAction = window.completeAction;
    window.completeAction = function() {
        // 记录：只要长按动画走完，即判定为已体验完成
        if (currentUserAccount && state.currentCard && db.users[currentUserAccount]) {
            let user = db.users[currentUserAccount];
            if (!user.completedCards) user.completedCards = [];
            
            // 如果此卡片还没记录，打入记录并推上云端
            if (!user.completedCards.includes(state.currentCard.id)) {
                user.completedCards.push(state.currentCard.id);
                window.saveDB(); // 极速自动存入云端
            }
        }
        
        // 唤起原生的清理定时器和跳跃界面的方法，确保流程不中断
        if (typeof originalCompleteAction === 'function') {
            originalCompleteAction();
        }
    };

})();
