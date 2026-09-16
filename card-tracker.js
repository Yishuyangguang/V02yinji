/**
 * 恒久印记 - 卡片追踪 + NEW标签 + iOS深度媒体与时长探针修复引擎 (极速版)
 * 文件名: card-tracker.js
 */
(function initTracker() {
    // =====================================================================
    // 模块一：UI 与 视觉增强 (流体呼吸感 NEW 标签 + 彻底防爆破锁死横向滑动)
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

            /* [终极防线]: 彻底切断超长文本导致的 Flex 容器爆破与屏幕横向滑动 */
            html, body { max-width: 100vw !important; overflow-x: hidden !important; }
            .modal-overlay { max-width: 100vw !important; overflow-x: hidden !important; }
            .vinyl-player-container.new-layout { 
                max-width: 100vw !important; 
                overflow-x: hidden !important; 
                box-sizing: border-box !important; 
            }
            .player-main-content, .player-right-panel, .playlist-box { 
                max-width: 100% !important; 
                overflow-x: hidden !important; 
                box-sizing: border-box !important;
            }
            .netease-item { max-width: 100% !important; box-sizing: border-box !important; overflow: hidden !important; }
            /* Flex 核心修复：必须加 min-width: 0 才能让 text-overflow 生效，防止被子元素撑大 */
            .netease-info { min-width: 0 !important; flex: 1 !important; } 
            .netease-title { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; max-width: 100% !important; }
            #player-track-name { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; max-width: 100% !important; display: block !important; }
        `;
        document.head.appendChild(style);
    }

    // =====================================================================
    // 模块二：智能探针轮询 (等待主程序释放全局变量池后无缝接管)
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
            // 模块三：彻底重构播放核心 (引入“幽灵探针”修复 iOS 畸变，且保住秒播)
            // =====================================================================
            
            window.realTrackDurations = window.realTrackDurations || {};
            window.probeController = null;

            // [无损接管] 切歌事件
            const originalPlayCurrentTrack = window.playCurrentTrack;
            window.playCurrentTrack = function() {
                const audioPlayer = document.getElementById('bgm-player');
                if (!audioPlayer || typeof musicState === 'undefined' || musicState.playlist.length === 0) return;

                const track = musicState.playlist[musicState.currentIndex];
                const url = track.url;

                // 给音频打上原始 URL 烙印，防止跨层级寻找错误
                audioPlayer.dataset.originalUrl = url;

                // 1. 放行原生函数，让音频“秒播”启动，绝对不卡顿！
                if (typeof originalPlayCurrentTrack === 'function') {
                    originalPlayCurrentTrack.apply(this, arguments);
                }
                
                // 2. 向 iOS 锁屏/灵动岛 推送真实歌曲信息
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

                    try {
                        navigator.mediaSession.setActionHandler('play', () => { if(window.togglePlayPause) window.togglePlayPause(); });
                        navigator.mediaSession.setActionHandler('pause', () => { if(window.togglePlayPause) window.togglePlayPause(); });
                        navigator.mediaSession.setActionHandler('previoustrack', () => { if(window.prevTrack) window.prevTrack(); });
                        navigator.mediaSession.setActionHandler('nexttrack', () => { if(window.nextTrack) window.nextTrack(); });
                    } catch (e) {}
                }

                // 3. 【幽灵探针引擎】修复 iOS 几十分钟乱码问题
                // 如果用户切歌过快，立刻取消上一次没完成的探针任务，省流量省电
                if (window.probeController) {
                    window.probeController.abort();
                    window.probeController = null;
                }

                const triggerGhostProbe = () => {
                    // 如果切歌了，探针作废
                    if (audioPlayer.dataset.originalUrl !== url) return; 
                    
                    const reportedDuration = audioPlayer.duration;
                    
                    // 如果苹果浏览器爆出了荒诞的时长（大于 15 分钟，即 900 秒），且我们还没计算过这首歌：
                    if ((reportedDuration === Infinity || reportedDuration > 900) && !window.realTrackDurations[url]) {
                        
                        window.probeController = new AbortController();
                        // 秘密在后台获取该文件的真实 Blob 数据结构（不影响前端正在秒播的音乐）
                        fetch(url, { signal: window.probeController.signal })
                            .then(res => res.blob())
                            .then(blob => {
                                const blobUrl = URL.createObjectURL(blob);
                                const probe = new Audio(blobUrl);
                                
                                // 让探针去解析，探针拥有完整的 Blob 数据，苹果引擎算出的必定是 100% 准确的时长
                                probe.onloadedmetadata = () => {
                                    if (probe.duration && probe.duration !== Infinity) {
                                        // 记录真实时长！
                                        window.realTrackDurations[url] = probe.duration;
                                        
                                        // 强制唤醒 UI 更新，几十分钟的错误时间瞬间被修复为准确的 03:XX
                                        if (typeof window.updateProgress === 'function') window.updateProgress(); 
                                        
                                        // 同步矫正苹果锁屏的进度条刻度
                                        if ('mediaSession' in navigator && audioPlayer.dataset.originalUrl === url) {
                                            try {
                                                navigator.mediaSession.setPositionState({
                                                    duration: probe.duration,
                                                    playbackRate: 1,
                                                    position: audioPlayer.currentTime
                                                });
                                            } catch(e) {}
                                        }
                                    }
                                    // 功成身退，销毁内存
                                    URL.revokeObjectURL(blobUrl);
                                };
                            }).catch(e => { /* 如果用户切歌了或网络被中止，静默忽略 */ }); 
                    }
                };
                
                // 给苹果一点反应时间，延时 800 毫秒后去探测其计算的时长是否正常
                setTimeout(triggerGhostProbe, 800);
            };

            // =====================================================================
            // 模块四：UI 渲染劫持层 (全面使用探针算出的准确时长替换错乱的系统时长)
            // =====================================================================

            // 劫持并重绘 UI 进度条
            if (!window.updateProgress.isPatched) {
                window.lastTimeUpdate = 0; 
                window.updateProgress = function() {
                    if (window.isDraggingProgress) return;
                    
                    const now = Date.now();
                    if (now - window.lastTimeUpdate < 100) return;
                    window.lastTimeUpdate = now;

                    const audio = document.getElementById('bgm-player');
                    if (!audio || isNaN(audio.duration)) return;

                    const url = audio.dataset.originalUrl || audio.src;
                    
                    // 【核心替换】：如果探针算出了真实时长，强制使用真实时长；否则使用系统的
                    const realDur = (window.realTrackDurations && window.realTrackDurations[url]) ? window.realTrackDurations[url] : audio.duration;

                    if (!isFinite(realDur) || realDur === 0) return;

                    const currentTime = audio.currentTime;
                    const percent = (currentTime / realDur) * 100;

                    const fill = document.getElementById('progress-fill');
                    const thumb = document.getElementById('progress-thumb');
                    if(fill) fill.style.width = `${percent}%`;
                    if(thumb) thumb.style.left = `${percent}%`;

                    const timeCurEl = document.getElementById('player-time-current');
                    const timeTotEl = document.getElementById('player-time-total');
                    if(timeCurEl) timeCurEl.innerText = window.formatTime(currentTime);
                    if(timeTotEl) timeTotEl.innerText = window.formatTime(realDur);
                };
                window.updateProgress.isPatched = true;
            }

            // 劫持拖动点击进度条事件，确保点哪跳哪绝对准确
            if (!window.seekAudio.isPatched) {
                window.seekAudio = function(e) {
                    const track = document.getElementById('progress-track');
                    const audio = document.getElementById('bgm-player');
                    if (!track || !audio) return;

                    const url = audio.dataset.originalUrl || audio.src;
                    
                    // 【核心替换】：采用真实的准确时长来计算拖拽百分比
                    const realDur = (window.realTrackDurations && window.realTrackDurations[url]) ? window.realTrackDurations[url] : audio.duration;
                    
                    if (isNaN(realDur) || !isFinite(realDur)) return;

                    const rect = track.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    let percent = clickX / rect.width;
                    if(percent < 0) percent = 0;
                    if(percent > 1) percent = 1;
                    
                    audio.currentTime = percent * realDur;
                };
                window.seekAudio.isPatched = true;
            }

            // [强制激活] 刷新驻留界面的 UI
            const cardListScreen = document.getElementById('screen-card-list');
            if (cardListScreen && cardListScreen.classList.contains('active')) {
                window.renderCardList();
            }

            console.log("卡片追踪器 + iOS幽灵探针防滑动引擎 [已无冲突接管]");

        } else if (!window.renderCardList || !window.renderCardList.isTrackerPatched) {
            // 原系统还没就绪，微秒级潜伏轮询 (50ms)，绝不遗漏
            setTimeout(applyPatches, 50);
        }
    }

    // 唤醒引擎
    applyPatches();

})();
