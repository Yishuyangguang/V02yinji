/**
 * 恒久印记 - 卡片追踪 + NEW标签 + iOS深度媒体与时长修复引擎 (纯净无冲突版)
 * 文件名: card-tracker.js
 */
(function initTracker() {
    // =====================================================================
    // 模块一：UI 与 视觉增强 (流体呼吸感 NEW 标签)
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
            // 模块三：彻底重构播放核心 (破除 iOS 时长畸变 + 苹果锁屏映射)
            // =====================================================================
            
            // 彻底废除原系统可能引起冲突的直链请求，引入安全的 Blob 缓冲桥接
            window.playCurrentTrack = async function() { 
                const audioPlayer = document.getElementById('bgm-player'); 
                if(!musicState || musicState.playlist.length === 0 || !audioPlayer) return; 
                
                const track = musicState.playlist[musicState.currentIndex]; 
                const trackNameEl = document.getElementById('player-track-name');
                
                // 1. 爱心 UI 更新
                if (typeof currentUserAccount !== 'undefined' && currentUserAccount && db.users[currentUserAccount].favorites) { 
                    const isFav = db.users[currentUserAccount].favorites.findIndex(f => f.url === track.url) > -1; 
                    document.getElementById('btn-favorite').innerText = isFav ? '❤️' : '🤍'; 
                } else { 
                    document.getElementById('btn-favorite').innerText = '🤍'; 
                } 
                
                // 2. Blob 解析引擎 (强迫苹果 iOS 准确拿到文件体积，断绝49分钟错乱乱象)
                if (audioPlayer.dataset.originalUrl !== track.url) {
                    audioPlayer.pause();
                    trackNameEl.innerText = "音律解析重载中..."; // 缓冲提示
                    
                    try {
                        const res = await fetch(track.url);
                        if (!res.ok) throw new Error('流媒体解析阻断');
                        const blob = await res.blob();
                        
                        // 防并发竞争：如果用户手速极快切了另一首歌，丢弃这个包
                        if (musicState.playlist[musicState.currentIndex].url !== track.url) return;

                        // 销毁上个内存地址，彻底杜绝切歌导致手机内存溢出（OOM）发热
                        if (audioPlayer.dataset.blobUrl) URL.revokeObjectURL(audioPlayer.dataset.blobUrl);
                        const blobUrl = URL.createObjectURL(blob);
                        
                        audioPlayer.src = blobUrl;
                        audioPlayer.dataset.blobUrl = blobUrl;
                        audioPlayer.dataset.originalUrl = track.url;
                    } catch(e) {
                        // 兜底方案：如果跨域或者获取失败，优雅降级走直链播放
                        audioPlayer.src = track.url;
                        audioPlayer.dataset.originalUrl = track.url;
                    }
                    
                    audioPlayer.load(); 
                    const fill = document.getElementById('progress-fill'); 
                    const thumb = document.getElementById('progress-thumb');
                    if(fill) fill.style.width = `0%`; 
                    if(thumb) thumb.style.left = `0%`;
                    document.getElementById('player-time-current').innerText = "00:00";
                } 
                
                trackNameEl.innerText = track.name; 
                audioPlayer.volume = 1; 
                audioPlayer.play().then(() => { 
                    document.getElementById('vinyl-disc-ui').classList.add('playing'); 
                    document.getElementById('btn-play-pause').innerText = '⏸️'; 
                    document.getElementById('apple-music-box').classList.add('playing'); 
                    
                    // 3. Apple MediaSession API (灵动岛及锁屏后台信息映射)
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
                            // 将手机系统级后台按键，打通到我们网页的原生函数上！
                            navigator.mediaSession.setActionHandler('play', () => { window.togglePlayPause(); });
                            navigator.mediaSession.setActionHandler('pause', () => { window.togglePlayPause(); });
                            navigator.mediaSession.setActionHandler('previoustrack', () => { window.prevTrack(); });
                            navigator.mediaSession.setActionHandler('nexttrack', () => { window.nextTrack(); });
                        } catch (e) {}
                    }
                }).catch(e=>{}); 
                
                // 4. 列表滚动归位
                window.renderVinylPlaylist(); 
                const activeItem = document.getElementById(`track-item-${musicState.currentIndex}`); 
                if(activeItem) { activeItem.scrollIntoView({ behavior: "smooth", block: "center" }); } 
            };

            // 挂载时间状态到系统锁屏进度条 (防止息屏时进度条卡死不动)
            const bgmPlayer = document.getElementById('bgm-player');
            if (bgmPlayer && !bgmPlayer.isMediaSessionPatched) {
                bgmPlayer.addEventListener('timeupdate', () => {
                    if ('mediaSession' in navigator && !isNaN(bgmPlayer.duration) && isFinite(bgmPlayer.duration)) {
                        try {
                            navigator.mediaSession.setPositionState({
                                duration: bgmPlayer.duration,
                                playbackRate: bgmPlayer.playbackRate,
                                position: bgmPlayer.currentTime
                            });
                        } catch(e) {}
                    }
                });
                bgmPlayer.isMediaSessionPatched = true;
            }

            // [强制激活] 刷新驻留界面的 UI
            const cardListScreen = document.getElementById('screen-card-list');
            if (cardListScreen && cardListScreen.classList.contains('active')) {
                window.renderCardList();
            }

            console.log("卡片追踪与 iOS 媒体解析引擎 [已挂载并激活]");

        } else if (!window.renderCardList || !window.renderCardList.isTrackerPatched) {
            // 原系统还没就绪，微秒级潜伏轮询 (50ms)，绝不遗漏
            setTimeout(applyPatches, 50);
        }
    }

    // 唤醒引擎
    applyPatches();

})();
