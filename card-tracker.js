/**
 * 恒久印记 - 卡片追踪 + NEW标签 + iOS深度媒体与时长修复引擎 (极速串流无冲突版)
 * 文件名: card-tracker.js
 */
(function initTracker() {
    // =====================================================================
    // 模块一：UI 与 视觉增强 (流体呼吸感 NEW 标签 + 修复屏幕横向滑动溢出)
    // =====================================================================
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

            /* [修复BUG]: 彻底锁死音乐弹窗横向溢出，杜绝手机端左右晃动 */
            #vinyl-player-modal { overflow-x: hidden !important; width: 100vw !important; }
            .vinyl-player-container.new-layout { 
                box-sizing: border-box !important; 
                max-width: 100vw !important; 
                overflow-x: hidden !important; 
            }
            .player-main-content { max-width: 100% !important; overflow-x: hidden !important; }
            .player-right-panel { max-width: 100% !important; overflow-x: hidden !important; }
            .playlist-box { max-width: 100% !important; overflow-x: hidden !important; }
            #player-track-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% !important; }
        `;
        document.head.appendChild(style);
    }

    // =====================================================================
    // 模块二：智能探针轮询 (等待主程序释放全局变量池后接管)
    // =====================================================================
    function applyPatches() {
        if (typeof window.renderCardList === 'function' && typeof db !== 'undefined' && typeof state !== 'undefined' && !window.renderCardList.isTrackerPatched) {
            
            // ============== 核心接管 1：注入 NEW 标签渲染 ==============
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

                    let userCompleted = [];
                    if (typeof currentUserAccount !== 'undefined' && currentUserAccount && db.users[currentUserAccount]) {
                        if (!db.users[currentUserAccount].completedCards) db.users[currentUserAccount].completedCards = [];
                        userCompleted = db.users[currentUserAccount].completedCards;
                    }

                    activeCards.forEach((card) => {
                        const cardDiv = document.createElement('div');
                        cardDiv.className = 'data-card';
                        
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
            window.renderCardList.isTrackerPatched = true;

            // ============== 核心接管 2：长按结束打卡进度写入 ==============
            const originalCompleteAction = window.completeAction;
            window.completeAction = function() {
                if (typeof currentUserAccount !== 'undefined' && currentUserAccount && state.currentCard && db.users[currentUserAccount]) {
                    let user = db.users[currentUserAccount];
                    if (!user.completedCards) user.completedCards = [];
                    if (!user.completedCards.includes(state.currentCard.id)) {
                        user.completedCards.push(state.currentCard.id);
                        if(typeof window.saveDB === 'function') window.saveDB(); 
                    }
                }
                if (typeof originalCompleteAction === 'function') originalCompleteAction();
            };

            // ============== 核心接管 3：云端双向合并进度保护 ==============
            if (typeof window.deepRescueDB === 'function' && !window.deepRescueDB.isPatched) {
                const originalDeepRescueDB = window.deepRescueDB;
                window.deepRescueDB = function(target, source) {
                    target = originalDeepRescueDB(target, source);
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

            // =====================================================================
            // 模块三：系统级媒体增强与 iOS 时长畸变绝症修复 (极速直链串流模式)
            // =====================================================================
            
            // [无损拦截] 切歌事件：废除 Blob 拖慢速度的做法，让主程序继续走直链“秒播”
            const originalPlayCurrentTrack = window.playCurrentTrack;
            window.playCurrentTrack = function() {
                // 放行原生逻辑，保证音乐极速加载
                if (typeof originalPlayCurrentTrack === 'function') {
                    originalPlayCurrentTrack.apply(this, arguments);
                }
                
                // 异步挂载苹果系统底层的锁屏卡片元数据
                if (typeof musicState !== 'undefined' && musicState.playlist && musicState.playlist.length > 0) {
                    const track = musicState.playlist[musicState.currentIndex];
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: track.name || '未知曲目',
                            artist: '恒久印记',
                            album: '印记音律',
                            artwork: [
                                { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
                                { src: 'favicon-32x32.png', sizes: '32x32', type: 'image/png' }
                            ]
                        });

                        // 挂载硬件线控键回调
                        try {
                            navigator.mediaSession.setActionHandler('play', () => { if(window.togglePlayPause) window.togglePlayPause(); });
                            navigator.mediaSession.setActionHandler('pause', () => { if(window.togglePlayPause) window.togglePlayPause(); });
                            navigator.mediaSession.setActionHandler('previoustrack', () => { if(window.prevTrack) window.prevTrack(); });
                            navigator.mediaSession.setActionHandler('nexttrack', () => { if(window.nextTrack) window.nextTrack(); });
                        } catch (e) {}
                    }
                }
            };

            // [核心重构] 音频生命周期：强行破除 iOS Safari VBR MP3 时长数十分钟绝症
            const bgmPlayer = document.getElementById('bgm-player');
            if (bgmPlayer && !bgmPlayer.isDurationPatched) {
                
                // 挂载防抖锁：防止探针测算长度时触发“自动下一首”
                window.isFixingDuration = false;
                const originalHandleAudioEnded = window.handleAudioEnded;
                window.handleAudioEnded = function() {
                    // 若正处于探底修复期，死锁阻断，坚决不切歌
                    if (window.isFixingDuration) return; 
                    if (originalHandleAudioEnded) originalHandleAudioEnded.apply(this, arguments);
                };

                // 核心探测器：监听 meta 载入 和 随时爆发的时长畸变
                const fixVBRDuration = function() {
                    // 当 Safari 解析出大于 1200 秒(20分钟) 的荒诞时长时，触发自救！
                    if ((bgmPlayer.duration === Infinity || bgmPlayer.duration > 1200) && !window.isFixingDuration) {
                        window.isFixingDuration = true;
                        
                        const wasPlaying = !bgmPlayer.paused;
                        const currentTime = bgmPlayer.currentTime;
                        const wasMuted = bgmPlayer.muted;
                        
                        bgmPlayer.muted = true; // 静音掩护
                        
                        // 强制 WebKit 引擎瞬移至流末尾，逼迫其请求并计算真实字节长度
                        bgmPlayer.currentTime = 1e101; 
                        
                        const restoreTime = function() {
                            bgmPlayer.removeEventListener('seeked', restoreTime);
                            bgmPlayer.currentTime = currentTime; // 精准回归起点
                            bgmPlayer.muted = wasMuted; // 恢复系统原音量
                            
                            if (wasPlaying) {
                                bgmPlayer.play().catch(e=>{});
                            }
                            
                            // 延时解除防切歌锁，确保事件冒泡死海干涸
                            setTimeout(() => { window.isFixingDuration = false; }, 200);
                        };
                        
                        bgmPlayer.addEventListener('seeked', restoreTime);
                        
                        // 安全降级：万一网络卡死没有 seeked，强制放行
                        setTimeout(() => {
                            if (window.isFixingDuration) {
                                bgmPlayer.removeEventListener('seeked', restoreTime);
                                bgmPlayer.currentTime = currentTime;
                                bgmPlayer.muted = wasMuted;
                                if (wasPlaying) bgmPlayer.play().catch(e=>{});
                                setTimeout(() => { window.isFixingDuration = false; }, 200);
                            }
                        }, 1000);
                    }
                };

                bgmPlayer.addEventListener('loadedmetadata', fixVBRDuration);
                bgmPlayer.addEventListener('durationchange', fixVBRDuration);
                
                // 锁屏灵动岛进度条心跳同步
                bgmPlayer.addEventListener('timeupdate', () => {
                    if ('mediaSession' in navigator && !isNaN(bgmPlayer.duration) && bgmPlayer.duration !== Infinity && bgmPlayer.duration < 1200) {
                        try {
                            navigator.mediaSession.setPositionState({
                                duration: bgmPlayer.duration,
                                playbackRate: bgmPlayer.playbackRate || 1,
                                position: bgmPlayer.currentTime
                            });
                        } catch(e) {}
                    }
                });
                
                bgmPlayer.isDurationPatched = true;
            }

            // [强制激活] 刷新驻留界面的 UI
            const cardListScreen = document.getElementById('screen-card-list');
            if (cardListScreen && cardListScreen.classList.contains('active')) {
                window.renderCardList();
            }

            console.log("卡片追踪器 + iOS媒体极速修复引擎 [已无冲突接管]");

        } else if (!window.renderCardList || !window.renderCardList.isTrackerPatched) {
            // 原系统还没就绪，微秒级潜伏轮询 (50ms)，绝不遗漏
            setTimeout(applyPatches, 50);
        }
    }

    // 唤醒引擎
    applyPatches();

})();
