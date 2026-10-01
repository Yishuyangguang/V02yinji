/**
 * 恒久印记 - UI交互与视觉渲染核心引擎
 * 文件名: app.js
 * 更新内容: 完全展开标准排版、修复路由冲突脱节报错、补充全局防空指针保护机制
 */

/* ================= 1. 静态配置与基础状态中枢 ================= */
const stagesList = ['单身期', '恋爱期', '定婚期', '结婚', '备孕期', '孕后初期', '婚后进阶'];

const defaultDB = {
    users: { 
        'yishuyangguang': { 
            nickname: '站长', 
            avatar: '', 
            favorites: [], 
            expireAt: 4102444800000, 
            status: 'normal' 
        } 
    }, 
    licenseKeys: {},
    topModules: [
        { id: 'tm_music', name: '印记音律', icon: 'apple-touch-icon.png', actionType: 'music', url: '' }
    ],
    globalMusicConfig: { 
        categories: [
            { id: 'mcat_1', name: '纯乐伴奏' }, 
            { id: 'mcat_2', name: '歌曲演唱' }
        ], 
        library: { 'mcat_1': [], 'mcat_2': [] } 
    },
    stages: {
        '单身期': { 
            themeParams: { dark: { bg: '#16171b', p: '#6366f1', s: '#818cf8' }, light: { bg: '#f0f4f8', p: '#4f46e5', s: '#818cf8' } }, 
            icon: '', name: '单身期', prepText: '静心安息，在独处的时光中沉淀自我。请找一个安静的地方，深呼吸，预备进入内心的探索。', 
            categories: [{ id: 'cat_s1', name: '不想进入婚姻' }, { id: 'cat_s2', name: '我想进入婚姻' }], 
            cards: [{ id: 'c_s_1', categoryId: 'cat_s1', title: '拥抱此刻的完整', steps: [{title:'认知',text:'单身本身即是完整，非过渡期。'},{title:'操练',text:'今日为自己做一顿精美的晚餐。'},{title:'宣告',text:'我在爱中富足，不因外在状态而匮乏。'}] }] 
        },
        '恋爱期': { 
            themeParams: { dark: { bg: '#1a1114', p: '#d4af37', s: '#ec4899' }, light: { bg: '#fcf2f5', p: '#d97706', s: '#f472b6' } }, 
            icon: '', name: '恋爱期', prepText: '相对而坐，保持一臂距离，深呼吸两次，放下外界的喧嚣，预备心灵进入交流。', 
            categories: [{ id: 'cat_l1', name: '核心操练' }], 
            cards: [{ id: 'c_l_1', categoryId: 'cat_l1', title: '倾听的艺术', steps: [{title:'行为意义',text:'倾听是心灵的交融。'},{title:'具体操练',text:'注视对方眼睛，放下手机。'},{title:'同心宣告',text:'我愿将你放在心上如印记。'}] }] 
        },
        '定婚期': { 
            themeParams: { dark: { bg: '#1a1610', p: '#d4af37', s: '#f59e0b' }, light: { bg: '#fcfaf5', p: '#d97706', s: '#fcd34d' } }, 
            icon: '', name: '定婚期', prepText: '即将步入婚姻殿堂，回想决定携手的初心。', 
            categories: [{id:'cat_e1',name:'盟约预备'}], cards: [] 
        },
        '结婚': { 
            themeParams: { dark: { bg: '#1c1012', p: '#d4af37', s: '#ef4444' }, light: { bg: '#fdf5f5', p: '#dc2626', s: '#fca5a5' } }, 
            icon: '', name: '结婚初阶', prepText: '爱意要在日常点滴中活出。请拥抱彼此。', 
            categories: [{id:'cat_m1',name:'合二为一'}], cards: [] 
        },
        '备孕期': { 
            themeParams: { dark: { bg: '#101c17', p: '#d4af37', s: '#10b981' }, light: { bg: '#f4fbf7', p: '#059669', s: '#6ee7b7' } }, 
            icon: '', name: '备孕时期', prepText: '滋养爱情，把手放在对方的肩上。', 
            categories: [{id:'cat_p1',name:'孕育之爱'}], cards: [] 
        },
        '孕后初期': { 
            themeParams: { dark: { bg: '#10171c', p: '#d4af37', s: '#0ea5e9' }, light: { bg: '#f4f9fd', p: '#0284c7', s: '#7dd3fc' } }, 
            icon: '', name: '孕后初期', prepText: '疲惫需要温柔承托，轻揉肩膀放松。', 
            categories: [{id:'cat_ep1',name:'温柔承托'}], cards: [] 
        },
        '婚后进阶': { 
            themeParams: { dark: { bg: '#16121c', p: '#d4af37', s: '#8b5cf6' }, light: { bg: '#faf5ff', p: '#7c3aed', s: '#c4b5fd' } }, 
            icon: '', name: '婚后进阶', prepText: '全然接纳此刻真实的彼此。', 
            categories: [{id:'cat_a1',name:'平淡坚守'}], cards: [] 
        }
    }
};

let db = null;
let lastParticleTime = 0; 
const particleFPS = 30; 
const particleInterval = 1000 / particleFPS;
let isPressing = false; 
let pressProgress = 0; 
let pressFrame = null;

let state = { 
    isLoggedIn: false, 
    isAdmin: false, 
    isEditMode: false, 
    stage: '', 
    activeCategoryId: '', 
    currentCard: null, 
    role: '', 
    currentStep: 0, 
    isLightTheme: true, 
    isModalOpen: false 
};

let toastTimeout; 
let currentUserAccount = null; 
let uploadQueue = []; 
let isUploading = false; 
let selectedAudioFiles = []; 
let musicState = { type: 'instrumental', playlist: [], currentIndex: 0, mode: 'sequence', tracksLimit: -1 }; 
let favDebounce = null; 
let particles = []; 
let animationId; 
window.isDraggingProgress = false;
let cachedPrimaryColorStr = '212,175,55';

window.updateThemeCache = function(hexColor) {
    if (!hexColor) return;
    let r = parseInt(hexColor.slice(1, 3), 16), g = parseInt(hexColor.slice(3, 5), 16), b = parseInt(hexColor.slice(5, 7), 16);
    if (!isNaN(r)) cachedPrimaryColorStr = `${r},${g},${b}`;
}

/* ================= 2. 核心交互事件监听与挂载 ================= */
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) { 
        window.ctx = canvas.getContext('2d'); 
        window.resizeCanvas(); 
        window.addEventListener('resize', window.resizeCanvas); 
        window.initParticles(); 
        window.animateParticles(); 
    }

    const audioPlayer = document.getElementById('bgm-player');
    if (audioPlayer) { 
        audioPlayer.addEventListener('ended', (e) => { 
            if (typeof window.handleAudioEnded === 'function') window.handleAudioEnded(e); 
        });
        audioPlayer.addEventListener('timeupdate', () => { 
            if (typeof window.updateProgress === 'function') window.updateProgress(); 
        });
        audioPlayer.addEventListener('loadedmetadata', () => { 
            if (typeof window.updateProgress === 'function') window.updateProgress(); 
        });
        audioPlayer.addEventListener('durationchange', () => { 
            if (typeof window.updateProgress === 'function') window.updateProgress(); 
        });
    }

    const longPressBtn = document.getElementById('btn-long-press');
    if (longPressBtn) {
        longPressBtn.addEventListener('mousedown', window.startPress); 
        longPressBtn.addEventListener('mouseup', window.endPress); 
        longPressBtn.addEventListener('mouseleave', window.endPress);
        longPressBtn.addEventListener('touchstart', window.startPress, {passive: false}); 
        longPressBtn.addEventListener('touchend', window.endPress, {passive: false}); 
        longPressBtn.addEventListener('touchcancel', window.endPress, {passive: false});
        longPressBtn.addEventListener('contextmenu', e => e.preventDefault());
    }

    state.isLightTheme = true; 
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) themeBtn.innerText = '☀️';
    window.updateThemeCache('#d99a29');
    
    // 🛡️ 严格锁死熄屏与挂后台时的渲染引擎，防止发热
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (animationId) { 
                cancelAnimationFrame(animationId); 
                animationId = null; 
            }
        } else {
            if (!state.isModalOpen && !animationId) {
                lastParticleTime = performance.now();
                if(typeof window.animateParticles === 'function') {
                    window.animateParticles();
                }
            }
        }
    });
    
    // 初始化同步与鉴权由 auth-sync-engine.js 接管
    if(typeof window.initDB === 'function') window.initDB(); 
    window.initProgressDrag();
});


/* ================= 3. 基础工具类与弹窗调度 ================= */
window.showModal = function(id) { 
    const el = document.getElementById(id); 
    if(!el) return;
    el.style.display = 'flex'; 
    state.isModalOpen = true; 
    if(animationId) { 
        cancelAnimationFrame(animationId); 
        animationId = null; 
    } 
}

window.hideModal = function(id) { 
    const el = document.getElementById(id); 
    if(!el) return;
    el.style.display = 'none'; 
    let anyOpen = false; 
    document.querySelectorAll('.modal-overlay').forEach(m => { 
        if(window.getComputedStyle(m).display !== 'none') anyOpen = true; 
    }); 
    state.isModalOpen = anyOpen; 
    
    if (!state.isModalOpen && !document.hidden && !animationId) { 
        lastParticleTime = performance.now(); 
        if(typeof window.animateParticles === 'function') {
            window.animateParticles(); 
        }
    } 
}

window.cleanupOldLocalStorage = function() { 
    const currentVersion = 'sealOfLoveDB_v80'; 
    for (let i = 0; i < localStorage.length; i++) { 
        const key = localStorage.key(i); 
        if (key && key.startsWith('sealOfLoveDB_') && key !== currentVersion) { 
            localStorage.removeItem(key); 
        } 
    } 
}

window.showGlobalToast = function(text, type = 'loading') { 
    const toast = document.getElementById('global-toast'); 
    const icon = document.getElementById('toast-icon'); 
    const msg = document.getElementById('toast-text'); 
    if(!toast) return; 
    
    toast.className = `global-toast show ${type}`; 
    msg.innerText = text; 
    
    if(type === 'loading') icon.innerText = '⏳'; 
    if(type === 'success') icon.innerText = '✓'; 
    if(type === 'error') icon.innerText = '✖'; 
    
    clearTimeout(toastTimeout); 
    if(type !== 'loading') { 
        toastTimeout = setTimeout(() => { 
            toast.classList.remove('show'); 
        }, 3000); 
    } 
}

window.compressImageFile = function(file, callback) { 
    const reader = new FileReader(); 
    reader.onload = function(e) { 
        const img = new Image(); 
        img.onload = function() { 
            const canvas = document.createElement('canvas'); 
            const MAX_SIZE = 240; 
            let width = img.width; 
            let height = img.height; 
            
            if (width > height) { 
                if (width > MAX_SIZE) { 
                    height *= MAX_SIZE / width; 
                    width = MAX_SIZE; 
                } 
            } else { 
                if (height > MAX_SIZE) { 
                    width *= MAX_SIZE / height; 
                    height = MAX_SIZE; 
                } 
            } 
            canvas.width = width; 
            canvas.height = height; 
            const ctx = canvas.getContext('2d'); 
            ctx.drawImage(img, 0, 0, width, height); 
            callback(canvas.toDataURL('image/webp', 0.75)); 
        }; 
        img.src = e.target.result; 
    }; 
    reader.readAsDataURL(file); 
}

window.toggleTheme = function() { 
    state.isLightTheme = !state.isLightTheme; 
    const btn = document.getElementById('btn-theme'); 
    if(btn) btn.innerText = state.isLightTheme ? '☀️' : '🌙'; 
    
    if (!state.isLightTheme) { 
        document.body.classList.add('dark-theme'); 
        document.body.classList.remove('light-theme'); 
    } else { 
        document.body.classList.remove('dark-theme'); 
        document.body.classList.add('light-theme'); 
    } 
    
    if(state.stage) { 
        if(typeof window.applyStageTheme === 'function') {
            window.applyStageTheme(state.stage); 
        }
    } else { 
        const currentParams = state.isLightTheme ? { bg: '#f8f6f0', p: '#d99a29', s: '#f4c453' } : { bg: '#1c1d22', p: '#d4af37', s: '#ebd373' }; 
        document.documentElement.style.setProperty('--theme-bg-color', currentParams.bg); 
        document.documentElement.style.setProperty('--theme-primary', currentParams.p); 
        document.documentElement.style.setProperty('--theme-secondary', currentParams.s); 
        window.updateThemeCache(currentParams.p); 
    } 
}

// 🔥 坚决阻断 `window.animateParticles is not a function` 报错的终极保护锁！
window.navigateTo = function(screenId) { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.add('active'); 
        target.scrollTop = 0; 
    }
    
    if(!state.isModalOpen) { 
        lastParticleTime = performance.now(); 
        // 关键防御：即便缓存错乱，只要找不到动画函数，就静默跳过，绝不红字卡死！
        if(typeof window.animateParticles === 'function') {
            window.animateParticles(); 
        }
    } 
}


/* ================= 4. GPU降频粒子系统 ================= */
window.resizeCanvas = function() { 
    const canvas = document.getElementById('particle-canvas'); 
    if(!canvas) return; 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
}

class Particle { 
    constructor() { 
        const canvas = document.getElementById('particle-canvas'); 
        this.x = Math.random() * (canvas ? canvas.width : 600); 
        this.y = Math.random() * (canvas ? canvas.height : 600); 
        this.size = Math.random() * 1.5 + 0.5; 
        this.speedY = Math.random() * 0.4 - 0.2; 
        this.speedX = Math.random() * 0.2 - 0.1; 
        this.baseAlpha = Math.random() * 0.3 + 0.1; 
        this.pulse = Math.random() * Math.PI; 
    } 
    update() { 
        const canvas = document.getElementById('particle-canvas'); 
        if(!canvas) return; 
        if (state.isLightTheme) { 
            this.y -= Math.abs(this.speedY) + 0.3; 
            this.x += Math.sin(this.pulse) * 0.5; 
            if (this.y < -20) { 
                this.y = canvas.height + 20; 
                this.x = Math.random() * (canvas.width / 2); 
            } 
        } else { 
            this.y += this.speedY * 0.6; 
            this.x += this.speedX + (Math.random() * 0.4 - 0.2); 
            if (this.y < 0) this.y = canvas.height; 
            if (this.y > canvas.height) this.y = 0; 
            if (this.x < 0) this.x = canvas.width / 2; 
            if (this.x > canvas.width / 2) this.x = 0; 
        } 
        this.pulse += 0.02; 
    } 
    draw() { 
        if(!window.ctx) return; 
        const canvas = document.getElementById('particle-canvas'); 
        const alpha = Math.max(0, this.baseAlpha + Math.sin(this.pulse) * 0.2); 
        
        window.ctx.save(); 
        window.ctx.globalAlpha = alpha; 
        window.ctx.fillStyle = state.isLightTheme ? `rgb(${cachedPrimaryColorStr})` : '#b4ff64'; 
        
        window.ctx.beginPath(); 
        window.ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2); 
        window.ctx.fill(); 
        
        window.ctx.beginPath(); 
        window.ctx.arc(canvas.width - this.x, this.y, this.size * 2, 0, Math.PI * 2); 
        window.ctx.fill(); 
        
        window.ctx.restore(); 
    } 
}

window.initParticles = function() { 
    particles = []; 
    const count = window.innerWidth < 600 ? 10 : 25; 
    for (let i = 0; i < count; i++) { 
        particles.push(new Particle()); 
    } 
}

window.animateParticles = function(timestamp) { 
    const activeScreen = document.querySelector('.screen.active');
    const isLightWeightScreen = activeScreen && (activeScreen.id === 'screen-card-list' || activeScreen.id === 'screen-content' || activeScreen.id === 'screen-finish' || activeScreen.id === 'screen-prep');
    
    if (document.hidden || state.isModalOpen || isLightWeightScreen) { 
        animationId = null; 
        return; 
    }
    
    animationId = requestAnimationFrame(window.animateParticles); 
    if (!timestamp) timestamp = performance.now();
    
    const elapsed = timestamp - lastParticleTime;
    if (elapsed > particleInterval) {
        lastParticleTime = timestamp - (elapsed % particleInterval);
        const canvas = document.getElementById('particle-canvas'); 
        if(!canvas || !window.ctx) return; 
        
        window.ctx.clearRect(0, 0, canvas.width, canvas.height); 
        particles.forEach(p => { 
            p.update(); 
            p.draw(); 
        }); 
    }
}


/* ================= 5. 用户中心与控制台入口 ================= */
window.openUserProfile = function() { 
    if(!currentUserAccount) return; 
    if (typeof db === 'undefined' || !db) return;
    if (!db.users[currentUserAccount]) { 
        db.users[currentUserAccount] = { nickname: '', avatar: '', favorites: [], expireAt: 0, status: 'normal' }; 
    }
    const userData = db.users[currentUserAccount]; 
    const imgEl = document.getElementById('profile-avatar-img'); 
    const svgEl = document.getElementById('profile-svg-placeholder'); 
    
    if(userData && userData.avatar) { 
        imgEl.src = userData.avatar; 
        imgEl.style.display = 'block'; 
        svgEl.style.display = 'none'; 
    } else { 
        imgEl.style.display = 'none'; 
        svgEl.style.display = 'block'; 
    } 
    
    document.getElementById('profile-nickname-input').value = userData.nickname || ''; 
    const daysLeftEl = document.getElementById('user-days-left');
    
    if (currentUserAccount === 'yishuyangguang') { 
        daysLeftEl.innerText = '永久 (特权)'; 
        daysLeftEl.style.color = '#fde68a'; 
    } else { 
        const now = Date.now(); 
        let days = Math.ceil(((userData.expireAt || 0) - now) / (1000 * 60 * 60 * 24)); 
        if (days < 0) days = 0; 
        
        if (userData.status === 'banned') { 
            daysLeftEl.innerText = '被封禁'; 
            daysLeftEl.style.color = '#ef4444'; 
        } else { 
            daysLeftEl.innerText = days; 
            daysLeftEl.style.color = days <= 7 ? '#ef4444' : '#fde68a'; 
        } 
    }
    
    const recoveryWrap = document.getElementById('admin-recovery-btn-wrap'); 
    if (state.isAdmin) { 
        recoveryWrap.style.display = 'block'; 
    } else { 
        recoveryWrap.style.display = 'none'; 
    }
    window.showModal('user-profile-modal'); 
}

window.handleProfileAvatar = function(inputEl) { 
    if(inputEl.files.length > 0) { 
        window.compressImageFile(inputEl.files[0], (base64) => { 
            const imgEl = document.getElementById('profile-avatar-img'); 
            imgEl.src = base64; 
            imgEl.style.display = 'block'; 
            document.getElementById('profile-svg-placeholder').style.display = 'none'; 
        }); 
    } 
}

window.saveUserProfile = async function() { 
    if(!currentUserAccount || !db) return; 
    const nick = document.getElementById('profile-nickname-input').value.trim(); 
    const imgEl = document.getElementById('profile-avatar-img'); 
    
    for(let key in db.users) { 
        if(key !== currentUserAccount && db.users[key].nickname && db.users[key].nickname === nick) {
            return alert('该昵称已被使用'); 
        }
    } 
    
    if (!db.users[currentUserAccount]) { 
        db.users[currentUserAccount] = { nickname: '', avatar: '', favorites: [], expireAt: 0, status: 'normal' }; 
    }
    
    db.users[currentUserAccount].nickname = nick; 
    if(imgEl.style.display === 'block') { 
        db.users[currentUserAccount].avatar = imgEl.src; 
    }
    
    if(typeof window.saveDB === 'function') await window.saveDB(); 
    if(typeof window.updateUserWidgetIcon === 'function') window.updateUserWidgetIcon(); 
    window.hideModal('user-profile-modal'); 
}

window.openAuthAdmin = function() { 
    if (!state.isAdmin) return; 
    window.open('admin-dashboard.html', '_blank'); 
}

window.updateUserWidgetIcon = function() { 
    if(!currentUserAccount || !db) return; 
    if (!db.users[currentUserAccount]) { 
        db.users[currentUserAccount] = { nickname: '', avatar: '', favorites: [] }; 
    }
    const userData = db.users[currentUserAccount]; 
    const imgEl = document.getElementById('user-widget-avatar'); 
    const svgEl = document.getElementById('user-widget-svg'); 
    
    if(userData && userData.avatar) { 
        imgEl.src = userData.avatar; 
        imgEl.style.display = 'block'; 
        svgEl.style.display = 'none'; 
    } else { 
        imgEl.style.display = 'none'; 
        svgEl.style.display = 'block'; 
    } 
}

window.toggleEditMode = function() { 
    state.isEditMode = !state.isEditMode; 
    document.getElementById('btn-edit-toggle').innerText = state.isEditMode ? '关闭深度编辑' : '开启深度编辑'; 
    
    if(state.isEditMode) { 
        document.body.classList.add('edit-mode'); 
    } else { 
        document.body.classList.remove('edit-mode'); 
    }
    
    if (document.getElementById('screen-stage').classList.contains('active')) { 
        if(typeof window.initStageScreen === 'function') window.initStageScreen(); 
    } else if (document.getElementById('screen-card-list').classList.contains('active')) { 
        if(typeof window.renderCardList === 'function') window.renderCardList(); 
    }
}


/* ================= 6. 首页流体网格与动态模块管理 ================= */
window.applyStageTheme = function(stageName) { 
    if (!stageName || !db || !db.stages[stageName]) return; 
    const t = db.stages[stageName].themeParams; 
    const currentParams = state.isLightTheme ? t.light : t.dark; 
    
    document.documentElement.style.setProperty('--theme-bg-color', currentParams.bg); 
    document.documentElement.style.setProperty('--theme-primary', currentParams.p); 
    document.documentElement.style.setProperty('--theme-secondary', currentParams.s); 
    
    if(typeof window.updateThemeCache === 'function') {
        window.updateThemeCache(currentParams.p); 
    }
}

window.initStageScreen = function() { 
    if (!db) return;
    
    if (!state.isAdmin && currentUserAccount !== 'yishuyangguang') {
        const uData = db.users[currentUserAccount]; 
        const nowTime = Date.now();
        if (!uData || !uData.expireAt || uData.expireAt < nowTime) { 
            alert("【系统拦截】您的时空印记已到期或未激活。请在登录界面直接输入新卡密激活。"); 
            if(typeof window.logout === 'function') window.logout(); 
            return; 
        }
        if (uData.status === 'banned') { 
            alert("【系统拦截】您的账号已被限制使用。"); 
            if(typeof window.logout === 'function') window.logout(); 
            return; 
        }
    }

    const topAdminControls = document.getElementById('top-admin-controls');
    if(topAdminControls) topAdminControls.style.display = state.isAdmin ? 'flex' : 'none'; 
    
    const currentParams = state.isLightTheme ? { bg: '#f8f6f0', p: '#d99a29', s: '#f4c453' } : { bg: '#1c1d22', p: '#d4af37', s: '#ebd373' }; 
    document.documentElement.style.setProperty('--theme-bg-color', currentParams.bg); 
    document.documentElement.style.setProperty('--theme-primary', currentParams.p); 
    document.documentElement.style.setProperty('--theme-secondary', currentParams.s); 
    
    if(typeof window.updateThemeCache === 'function') {
        window.updateThemeCache(currentParams.p);
    }

    // 渲染动态顶部模块
    const topContainer = document.getElementById('top-modules-dynamic-container');
    if (topContainer) {
        topContainer.innerHTML = '';
        (db.topModules || []).forEach((tm, idx) => {
            const capsule = document.createElement('div');
            capsule.className = 'brand-capsule-dynamic';
            
            capsule.onclick = (e) => {
                if (state.isEditMode) return;
                
                if (tm.actionType === 'music') {
                    if(typeof window.openMusicTypeModal === 'function') window.openMusicTypeModal();
                } else if (tm.actionType === 'link' && tm.url) {
                    window.open(tm.url, '_blank');
                } else if (tm.actionType === 'doc') {
                    if(typeof window.openCounselingDoc === 'function') {
                        window.openCounselingDoc(tm.url); 
                    } else {
                        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('文档引擎加载中...', 'loading');
                    }
                } else {
                    if(typeof window.showGlobalToast === 'function') window.showGlobalToast('该模块暂未配置功能', 'loading');
                }
            };

            const imgEl = document.createElement('img');
            imgEl.src = tm.icon || 'favicon-32x32.png';
            imgEl.onerror = function() { this.src = 'favicon-32x32.png'; };
            
            const inputEl = document.createElement('input');
            inputEl.value = tm.name;
            
            if (state.isEditMode) {
                imgEl.onclick = (e) => {
                    e.stopPropagation();
                    const fileIpt = document.createElement('input'); 
                    fileIpt.type = 'file'; fileIpt.accept = 'image/*';
                    fileIpt.onchange = ev => { 
                        if(ev.target.files[0]) {
                            if(typeof window.handleTopModuleIconUpload === 'function') {
                                window.handleTopModuleIconUpload(ev.target.files[0], idx); 
                            }
                        }
                    };
                    fileIpt.click();
                };
                inputEl.onclick = (e) => e.stopPropagation();
                inputEl.onblur = async (e) => { 
                    tm.name = e.target.value; 
                    if(typeof window.saveDB === 'function') await window.saveDB(); 
                };

                const delBtn = document.createElement('div');
                delBtn.className = 'del-badge'; 
                delBtn.innerHTML = '✖';
                delBtn.onclick = (e) => { 
                    e.stopPropagation(); 
                    if(typeof window.deleteTopModule === 'function') window.deleteTopModule(idx); 
                };
                capsule.appendChild(delBtn);
            }

            capsule.appendChild(imgEl); 
            capsule.appendChild(inputEl); 
            topContainer.appendChild(capsule);
        });
    }

    // 渲染主模块 (全端弹性网格)
    const mainContainer = document.getElementById('stage-buttons-container'); 
    if (mainContainer) {
        mainContainer.innerHTML = ''; 
        
        Object.keys(db.stages).forEach((sKey) => { 
            const sData = db.stages[sKey]; 
            const iconB64 = sData.icon; 
            const displayName = sData.name || sKey; 
            
            const card = document.createElement('div'); 
            card.className = 'stage-card-flex'; 
            card.onclick = (e) => { 
                if(!state.isEditMode && typeof window.selectStage === 'function') {
                    window.selectStage(sKey); 
                }
            }; 
            
            const iconDiv = document.createElement('div'); 
            iconDiv.className = 'stage-icon-dropzone'; 
            
            if (iconB64) { 
                iconDiv.innerHTML = `<img src="${iconB64}">`; 
            } else { 
                iconDiv.innerHTML = `<span style="font-size: clamp(16px, 5vw, 26px); color:var(--theme-text); font-family:var(--font-title); opacity:0.9;">${displayName.charAt(0)}</span>`; 
            } 
            
            const titleInput = document.createElement('input'); 
            titleInput.className = 'stage-card-title'; 
            titleInput.value = displayName; 
            
            if (state.isEditMode) { 
                iconDiv.addEventListener('click', (e) => { 
                    e.stopPropagation(); 
                    const input = document.createElement('input'); 
                    input.type = 'file'; input.accept = 'image/*'; 
                    input.onchange = ev => {
                        if(ev.target.files[0]) {
                            if(typeof window.handleIconUpload === 'function') window.handleIconUpload(ev.target.files[0], sKey);
                        }
                    }; 
                    input.click(); 
                }); 
                titleInput.addEventListener('click', (e) => { e.stopPropagation(); }); 
                titleInput.addEventListener('blur', (e) => { 
                    sData.name = e.target.value; 
                    if(typeof window.saveDB === 'function') window.saveDB(); 
                }); 
                
                const delBtn = document.createElement('div');
                delBtn.className = 'del-badge'; 
                delBtn.innerHTML = '✖';
                delBtn.onclick = (e) => { 
                    e.stopPropagation(); 
                    if(typeof window.deleteStage === 'function') window.deleteStage(sKey); 
                };
                card.appendChild(delBtn);
            } 
            
            card.appendChild(iconDiv); 
            card.appendChild(titleInput); 
            mainContainer.appendChild(card);
        }); 
    }
    
    if(typeof window.navigateTo === 'function') window.navigateTo('screen-stage'); 
}

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
        url = 'doc_' + Date.now(); 
    }

    if(!db.topModules) db.topModules = [];
    db.topModules.push({ id: 'tm_' + Date.now(), name: name, icon: 'apple-touch-icon.png', actionType: actionType, url: url });
    
    if(typeof window.saveDB === 'function') await window.saveDB();
    if(typeof window.initStageScreen === 'function') window.initStageScreen();
};

window.deleteTopModule = async function(idx) {
    if(confirm(`确定彻底删除顶部模块 [${db.topModules[idx].name}] 吗？`)) {
        db.topModules.splice(idx, 1); 
        if(typeof window.saveDB === 'function') await window.saveDB(); 
        if(typeof window.initStageScreen === 'function') window.initStageScreen();
    }
};

window.handleTopModuleIconUpload = function(file, idx) {
    if(typeof window.compressImageFile === 'function') {
        window.compressImageFile(file, async (base64Str) => {
            db.topModules[idx].icon = base64Str; 
            if(typeof window.saveDB === 'function') await window.saveDB(); 
            if(typeof window.initStageScreen === 'function') window.initStageScreen();
        });
    }
};

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
    
    if(typeof window.saveDB === 'function') await window.saveDB(); 
    if(typeof window.initStageScreen === 'function') window.initStageScreen();
};

window.deleteStage = async function(sKey) {
    if(confirm(`确定要彻底删除大模块 [${db.stages[sKey].name}] 吗？\n删除后内部所有卡片将不可恢复！`)) {
        delete db.stages[sKey]; 
        if(typeof window.saveDB === 'function') await window.saveDB(); 
        if(typeof window.initStageScreen === 'function') window.initStageScreen();
    }
};

window.handleIconUpload = function(file, stageKey) { 
    if(typeof window.compressImageFile === 'function') {
        window.compressImageFile(file, async (base64Str) => { 
            db.stages[stageKey].icon = base64Str; 
            if(typeof window.saveDB === 'function') await window.saveDB(); 
            if(typeof window.initStageScreen === 'function') window.initStageScreen(); 
        }); 
    }
}


/* ================= 7. 卡片分类与编辑引擎 ================= */
window.selectStage = function(sKey) { 
    if(state.isEditMode || !db) return; 
    state.stage = sKey; 
    
    if(typeof window.applyStageTheme === 'function') window.applyStageTheme(sKey); 
    
    const titleEl = document.getElementById('list-stage-title');
    if(titleEl) titleEl.innerText = `${db.stages[sKey].name}`; 
    
    const cats = db.stages[sKey].categories || []; 
    if(cats.length > 0) { 
        state.activeCategoryId = cats[0].id; 
    } else { 
        state.activeCategoryId = ''; 
    }
    
    if(typeof window.renderCardList === 'function') window.renderCardList(); 
    if(typeof window.navigateTo === 'function') window.navigateTo('screen-card-list'); 
}

window.renderCardList = function() { 
    if(!db) return;
    
    const cats = db.stages[state.stage].categories || []; 
    const tabContainer = document.getElementById('cat-tabs-container'); 
    if(tabContainer) tabContainer.innerHTML = ''; 
    
    if (cats.length > 1 || state.isEditMode) { 
        cats.forEach(cat => { 
            const tab = document.createElement('div'); 
            tab.className = `cat-tab ${cat.id === state.activeCategoryId ? 'active' : ''}`; 
            tab.innerText = cat.name; 
            tab.onclick = () => { 
                state.activeCategoryId = cat.id; 
                if(typeof window.renderCardList === 'function') window.renderCardList(); 
            }; 
            if(tabContainer) tabContainer.appendChild(tab); 
        }); 
    } 
    
    const container = document.getElementById('card-list-container'); 
    if(container) container.innerHTML = ''; 
    
    const activeCards = db.stages[state.stage].cards.filter(c => c.categoryId === state.activeCategoryId); 
    
    if (activeCards.length > 0 || state.isEditMode) {
        const grid = document.createElement('div'); 
        grid.className = 'content-grid';
        
        activeCards.forEach((card) => {
            const cardDiv = document.createElement('div'); 
            cardDiv.className = 'data-card';
            cardDiv.innerHTML = `<h3 class="card-inner-title">${card.title}</h3>`;
            
            if (state.isEditMode) {
                const globalIndex = db.stages[state.stage].cards.findIndex(c => c.id === card.id);
                const actDiv = document.createElement('div'); 
                actDiv.className = 'card-edit-badge';
                actDiv.innerHTML = `<div class="action-icon" onclick="event.stopPropagation(); window.openEditModal(${globalIndex})">✎</div><div class="action-icon del" onclick="event.stopPropagation(); window.deleteCard(${globalIndex})">✖</div>`;
                cardDiv.appendChild(actDiv);
            }
            
            cardDiv.onclick = () => { 
                if(!state.isEditMode && typeof window.startCardFlow === 'function') {
                    window.startCardFlow(card); 
                }
            };
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
}

window.manageCategories = async function() { 
    const listDiv = document.getElementById('cat-list-edit'); 
    if(listDiv) listDiv.innerHTML = ''; 
    const cats = db.stages[state.stage].categories || []; 
    
    cats.forEach((cat, idx) => { 
        const div = document.createElement('div'); 
        div.style.display = 'flex'; 
        div.style.gap = '10px'; 
        div.style.alignItems = 'center'; 
        div.innerHTML = `<input type="text" style="margin:0; flex:1;" id="cat_input_${idx}" value="${cat.name}"><button class="btn-glass" style="width:45px; height:45px; margin:0; color:#ef4444; padding:0; border-radius:12px;" onclick="window.removeCat(${idx})">✖</button>`; 
        if(listDiv) listDiv.appendChild(div); 
    }); 
    
    if(typeof window.showModal === 'function') window.showModal('cat-modal'); 
}

window.addNewCategory = function() { 
    if(!db.stages[state.stage].categories) db.stages[state.stage].categories = []; 
    db.stages[state.stage].categories.push({ id: 'cat_' + Date.now(), name: '新建大选项' }); 
    if(typeof window.manageCategories === 'function') window.manageCategories(); 
}

window.removeCat = async function(idx) { 
    const catId = db.stages[state.stage].categories[idx].id; 
    const linkedCards = db.stages[state.stage].cards.filter(c => c.categoryId === catId); 
    if(linkedCards.length > 0 && !confirm(`该分类下有 ${linkedCards.length} 张卡片，确定删除吗？`)) return; 
    
    db.stages[state.stage].categories.splice(idx, 1); 
    if(typeof window.manageCategories === 'function') window.manageCategories(); 
}

window.saveCategories = async function() { 
    const cats = db.stages[state.stage].categories || []; 
    cats.forEach((cat, idx) => { 
        const input = document.getElementById(`cat_input_${idx}`); 
        if(input) cat.name = input.value; 
    }); 
    
    if(typeof window.saveDB === 'function') await window.saveDB(); 
    if(typeof window.hideModal === 'function') window.hideModal('cat-modal'); 
    
    if(!cats.find(c => c.id === state.activeCategoryId) && cats.length > 0) { 
        state.activeCategoryId = cats[0].id; 
    }
    
    if(typeof window.renderCardList === 'function') window.renderCardList(); 
}

window.editPrepText = async function() { 
    const t = prompt("预备提醒文本：", db.stages[state.stage].prepText); 
    if (t !== null) { 
        db.stages[state.stage].prepText = t; 
        if(typeof window.saveDB === 'function') await window.saveDB(); 
    } 
}

window.deleteCard = async function(index) { 
    if(confirm('确认彻底删除本卡片吗？')) { 
        db.stages[state.stage].cards.splice(index, 1); 
        if(typeof window.saveDB === 'function') await window.saveDB(); 
        if(typeof window.renderCardList === 'function') window.renderCardList(); 
    } 
}

window.openEditModal = function(index) { 
    const isNew = (index === null); 
    const titleEl = document.getElementById('modal-title');
    if(titleEl) titleEl.innerText = isNew ? '新增卡片' : '编辑卡片'; 
    
    const catSelect = document.getElementById('edit-card-category'); 
    if(catSelect) catSelect.innerHTML = ''; 
    const cats = db.stages[state.stage].categories || []; 
    
    cats.forEach(c => { 
        if(catSelect) catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`; 
    }); 
    
    let c = isNew ? { 
        id: 'c_'+Date.now(), 
        categoryId: state.activeCategoryId, 
        title:'', 
        steps:[{title:'', text:''},{title:'', text:''},{title:'', text:''}] 
    } : db.stages[state.stage].cards[index]; 
    
    document.getElementById('edit-card-id').value = index === null ? 'new' : index; 
    document.getElementById('edit-card-category').value = c.categoryId || (cats[0]?cats[0].id:''); 
    document.getElementById('edit-card-title').value = c.title; 
    
    for(let i=1; i<=3; i++) { 
        const sTitle = document.getElementById(`edit-s${i}-title`);
        const sText = document.getElementById(`edit-s${i}-text`);
        if(sTitle) sTitle.value = c.steps[i-1] ? c.steps[i-1].title : ''; 
        if(sText) sText.value = c.steps[i-1] ? c.steps[i-1].text : ''; 
    } 
    
    if(typeof window.showModal === 'function') window.showModal('edit-modal'); 
}

window.saveCard = async function() { 
    const idxStr = document.getElementById('edit-card-id').value; 
    const c = { 
        id: idxStr === 'new' ? 'c_' + Date.now() : db.stages[state.stage].cards[parseInt(idxStr)].id, 
        categoryId: document.getElementById('edit-card-category').value, 
        title: document.getElementById('edit-card-title').value || '未命名', 
        steps: [] 
    }; 
    
    for(let i=1; i<=3; i++) { 
        c.steps.push({ 
            title: document.getElementById(`edit-s${i}-title`).value, 
            text: document.getElementById(`edit-s${i}-text`).value 
        }); 
    }
    
    if(idxStr === 'new') { 
        db.stages[state.stage].cards.push(c); 
    } else { 
        db.stages[state.stage].cards[parseInt(idxStr)] = c; 
    }
    
    if(typeof window.saveDB === 'function') await window.saveDB(); 
    if(typeof window.hideModal === 'function') window.hideModal('edit-modal'); 
    if(typeof window.renderCardList === 'function') window.renderCardList(); 
}


/* ================= 8. 全局音律库与云端R2管理 ================= */
window.processUploadQueue = async function() { 
    if(isUploading || uploadQueue.length === 0) return; 
    isUploading = true; 
    const capsule = document.getElementById('upload-capsule'); 
    const capsuleText = document.getElementById('upload-capsule-text'); 
    const capsuleProgress = document.getElementById('upload-capsule-fill'); 
    if(capsule) capsule.classList.add('show'); 
    
    const totalTasks = uploadQueue.length; 
    let completedTasks = 0; 
    
    while(uploadQueue.length > 0) { 
        const task = uploadQueue.shift(); 
        completedTasks++; 
        try { 
            const url = await new Promise((resolve, reject) => { 
                const xhr = new XMLHttpRequest(); 
                xhr.open('POST', '/api/upload'); 
                xhr.upload.onprogress = (e) => { 
                    if(e.lengthComputable) { 
                        const percent = (e.loaded / e.total) * 100; 
                        if(capsuleText) capsuleText.innerText = `正在云传 (${completedTasks}/${totalTasks}) ${Math.round(percent)}%`; 
                        if(capsuleProgress) capsuleProgress.style.width = `${percent}%`; 
                    } 
                }; 
                xhr.onload = () => { 
                    if(xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText).url); 
                    } else { 
                        reject(new Error('Upload failed')); 
                    } 
                }; 
                xhr.onerror = () => reject(new Error('Network error')); 
                const formData = new FormData(); 
                formData.append('file', task.file); 
                xhr.send(formData); 
            }); 
            
            if(!db.globalMusicConfig.library[task.catId]) { 
                db.globalMusicConfig.library[task.catId] = []; 
            }
            db.globalMusicConfig.library[task.catId].push({name: task.name, url: url}); 
        } catch(e) { 
            if(typeof window.showGlobalToast === 'function') window.showGlobalToast(`[${task.name}] 上传失败`, 'error'); 
        } 
    } 
    
    if(typeof window.saveDB === 'function') await window.saveDB(); 
    if(typeof window.renderAdminMusicList === 'function') window.renderAdminMusicList(); 
    
    if(capsuleText) capsuleText.innerText = "全部极速上传完成"; 
    if(capsuleProgress) capsuleProgress.style.width = "100%"; 
    setTimeout(() => { 
        if(capsule) capsule.classList.remove('show'); 
        if(capsuleProgress) capsuleProgress.style.width = "0%"; 
    }, 2000); 
    
    isUploading = false; 
}

window.initAdminMusicCatSelect = function() { 
    const catSel = document.getElementById('admin-music-cat'); 
    if(!catSel) return; 
    catSel.innerHTML = ''; 
    const cats = db.globalMusicConfig.categories || []; 
    cats.forEach(c => { 
        catSel.innerHTML += `<option value="${c.id}">${c.name}</option>`; 
    }); 
}

window.manageMusicCategories = function() { 
    const listDiv = document.getElementById('music-cat-list-edit'); 
    if(listDiv) listDiv.innerHTML = ''; 
    const cats = db.globalMusicConfig.categories || []; 
    cats.forEach((cat, idx) => { 
        const div = document.createElement('div'); 
        div.style.display = 'flex'; 
        div.style.gap = '10px'; 
        div.style.alignItems = 'center'; 
        div.innerHTML = `<input type="text" style="margin:0; flex:1;" id="mcat_input_${idx}" value="${cat.name}"><button class="btn-glass" style="width:45px; height:45px; margin:0; color:#ef4444; padding:0; border-radius:12px;" onclick="window.removeMusicCategory(${idx})">✖</button>`; 
        if(listDiv) listDiv.appendChild(div); 
    }); 
    if(typeof window.showModal === 'function') window.showModal('music-cat-modal'); 
}

window.addMusicCategory = function() { 
    if(!db.globalMusicConfig.categories) db.globalMusicConfig.categories = []; 
    const newId = 'mcat_' + Date.now(); 
    db.globalMusicConfig.categories.push({ id: newId, name: '新建音乐类' }); 
    db.globalMusicConfig.library[newId] = []; 
    if(typeof window.manageMusicCategories === 'function') window.manageMusicCategories(); 
}

window.removeMusicCategory = async function(idx) { 
    const catId = db.globalMusicConfig.categories[idx].id; 
    const linkedMusic = db.globalMusicConfig.library[catId] || []; 
    if(linkedMusic.length > 0 && !confirm(`该分类下有 ${linkedMusic.length} 首音乐，确定删除分类并清空它们吗？`)) return; 
    
    db.globalMusicConfig.categories.splice(idx, 1); 
    delete db.globalMusicConfig.library[catId]; 
    if(typeof window.manageMusicCategories === 'function') window.manageMusicCategories(); 
}

window.saveMusicCategories = async function() { 
    const cats = db.globalMusicConfig.categories || []; 
    cats.forEach((cat, idx) => { 
        const input = document.getElementById(`mcat_input_${idx}`); 
        if(input) cat.name = input.value; 
    }); 
    
    if(typeof window.saveDB === 'function') await window.saveDB(); 
    if(typeof window.hideModal === 'function') window.hideModal('music-cat-modal'); 
    if(typeof window.initAdminMusicCatSelect === 'function') window.initAdminMusicCatSelect(); 
}

window.manageMusicLibrary = function() { 
    if(typeof window.initAdminMusicCatSelect === 'function') window.initAdminMusicCatSelect(); 
    const searchEl = document.getElementById('admin-music-search');
    if(searchEl) searchEl.value = ''; 
    if(typeof window.resetMusicEdit === 'function') window.resetMusicEdit(); 
    if(typeof window.renderAdminMusicList === 'function') window.renderAdminMusicList(); 
    if(typeof window.showModal === 'function') window.showModal('music-admin-modal'); 
    if(typeof window.bindAudioDragDrop === 'function') window.bindAudioDragDrop(); 
}

window.filterAdminMusicList = function() { 
    if(typeof window.renderAdminMusicList === 'function') window.renderAdminMusicList(); 
}

window.renderAdminMusicList = function() { 
    const catId = document.getElementById('admin-music-cat')?.value; 
    const searchEl = document.getElementById('admin-music-search');
    const query = searchEl ? searchEl.value.trim().toLowerCase() : ''; 
    const listDiv = document.getElementById('admin-music-list'); 
    if(!listDiv) return;
    
    listDiv.innerHTML = ''; 
    if(!catId) { 
        listDiv.innerHTML = `<div style="padding:15px; opacity:0.5; text-align:center;">请先添加分类</div>`; 
        return; 
    } 
    
    const list = db.globalMusicConfig.library[catId] || []; 
    let matchCount = 0; 
    
    list.forEach((m, idx) => { 
        if (query && !m.name.toLowerCase().includes(query)) return; 
        matchCount++; 
        const div = document.createElement('div'); 
        div.style.display='flex'; 
        div.style.background='var(--theme-glass-bg)'; 
        div.style.padding='15px'; 
        div.style.borderRadius='16px'; 
        div.style.alignItems='center'; 
        div.style.justifyContent='space-between'; 
        div.style.border='1px solid var(--theme-glass-border)'; 
        div.style.boxShadow='0 4px 10px rgba(0,0,0,0.1)'; 
        
        div.innerHTML = `<div style="display:flex; flex-direction:column; width:65%; overflow:hidden;"><span style="font-weight:bold; color:var(--theme-text); font-size:1.05rem; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</span><span style="font-size:0.75rem; opacity:0.6; word-break:break-all; color:var(--theme-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.url}</span></div><div style="display:flex; gap:8px;"><div class="action-icon" style="background:#4f46e5;" onclick="window.editAdminMusic('${catId}', ${idx})">✎</div><div class="action-icon del" onclick="window.deleteAdminMusic('${catId}', ${idx})">✖</div></div>`; 
        listDiv.appendChild(div); 
    }); 
    
    if (matchCount === 0) { 
        listDiv.innerHTML = `<div style="padding:15px; opacity:0.5; text-align:center;">暂无匹配曲目</div>`; 
    } 
}

window.bindAudioDragDrop = function() { 
    const zone = document.getElementById('music-upload-zone'); 
    const fileInput = document.getElementById('new-music-file'); 
    const text = document.getElementById('music-upload-text'); 
    if(!zone || !fileInput) return;
    
    zone.onclick = () => fileInput.click(); 
    zone.ondragover = (e) => { e.preventDefault(); zone.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'; }; 
    zone.ondragleave = (e) => { e.preventDefault(); zone.style.backgroundColor = 'transparent'; }; 
    zone.ondrop = (e) => { 
        e.preventDefault(); 
        zone.style.backgroundColor = 'transparent'; 
        if(e.dataTransfer.files.length>0) handleSelectedAudios(e.dataTransfer.files); 
    }; 
    
    fileInput.onchange = (e) => { 
        if(e.target.files.length>0) handleSelectedAudios(e.target.files); 
    }; 
    
    function handleSelectedAudios(files) { 
        selectedAudioFiles = Array.from(files).filter(f => f.type.startsWith('audio/')); 
        if(selectedAudioFiles.length === 0) return alert('请选择有效的音频文件'); 
        
        if (selectedAudioFiles.length === 1) { 
            if(text) text.innerText = `已选择: ${selectedAudioFiles[0].name} (${(selectedAudioFiles[0].size/1024/1024).toFixed(2)}MB)`; 
            const nameInput = document.getElementById('new-music-name'); 
            if(!nameInput.value) nameInput.value = selectedAudioFiles[0].name.replace(/\.[^/.]+$/, ""); 
        } else { 
            if(text) text.innerText = `已选择 ${selectedAudioFiles.length} 个音频，批量直传中...`; 
            const nameInput = document.getElementById('new-music-name');
            if(nameInput) {
                nameInput.value = "自动取名模式"; 
                nameInput.disabled = true; 
            }
        } 
    } 
}

window.editAdminMusic = function(catId, idx) { 
    const m = db.globalMusicConfig.library[catId][idx]; 
    document.getElementById('new-music-name').value = m.name; 
    document.getElementById('new-music-url').value = m.url; 
    document.getElementById('edit-music-idx').value = idx; 
    document.getElementById('admin-music-action-title').innerText = "✎ 修改曲目"; 
    document.getElementById('btn-admin-music-save').innerText = "保 存 修 改"; 
    document.getElementById('btn-admin-music-cancel').style.display = "block"; 
    document.getElementById('music-upload-zone').style.display = "none"; 
}

window.resetMusicEdit = function() { 
    const nameInput = document.getElementById('new-music-name');
    if(nameInput) { nameInput.value = ''; nameInput.disabled = false; }
    const urlInput = document.getElementById('new-music-url');
    if(urlInput) urlInput.value = '';
    const idxInput = document.getElementById('edit-music-idx');
    if(idxInput) idxInput.value = '';
    
    const title = document.getElementById('admin-music-action-title');
    if(title) title.innerText = "+ 新增曲目"; 
    
    const saveBtn = document.getElementById('btn-admin-music-save');
    if(saveBtn) saveBtn.innerText = "添 加 到 库"; 
    
    const cancelBtn = document.getElementById('btn-admin-music-cancel');
    if(cancelBtn) cancelBtn.style.display = "none"; 
    
    const zone = document.getElementById('music-upload-zone');
    if(zone) zone.style.display = "block"; 
    
    selectedAudioFiles = []; 
    const text = document.getElementById('music-upload-text');
    if(text) text.innerText = '点击或拖拽音频文件 (支持多选直传)'; 
}

window.saveMusicToLibrary = async function() { 
    const name = document.getElementById('new-music-name').value.trim(); 
    let url = document.getElementById('new-music-url').value.trim(); 
    const catId = document.getElementById('admin-music-cat').value; 
    const editIdx = document.getElementById('edit-music-idx').value; 
    
    if(!catId) return alert('请先创建分类'); 
    
    if (editIdx !== '' || (url && selectedAudioFiles.length === 0)) { 
        if(!name) return alert('请输入曲目名称'); 
        if(!db.globalMusicConfig.library[catId]) db.globalMusicConfig.library[catId] = []; 
        
        if (editIdx !== '') { 
            db.globalMusicConfig.library[catId][parseInt(editIdx)] = { name, url }; 
        } else { 
            db.globalMusicConfig.library[catId].push({name, url}); 
        }
        
        if(typeof window.saveDB === 'function') await window.saveDB(); 
        if(typeof window.resetMusicEdit === 'function') window.resetMusicEdit(); 
        if(typeof window.renderAdminMusicList === 'function') window.renderAdminMusicList(); 
        return; 
    } 
    
    if(selectedAudioFiles.length > 0) { 
        selectedAudioFiles.forEach(file => { 
            let taskName = name === "自动取名模式" || !name ? file.name.replace(/\.[^/.]+$/, "") : name; 
            uploadQueue.push({ file: file, catId: catId, name: taskName }); 
        }); 
        if(typeof window.resetMusicEdit === 'function') window.resetMusicEdit(); 
        if(typeof window.hideModal === 'function') window.hideModal('music-admin-modal'); 
        if(typeof window.processUploadQueue === 'function') window.processUploadQueue(); 
    } else { 
        alert('请拖入音频或填写链接'); 
    } 
}

window.deleteAdminMusic = async function(catId, idx) { 
    if(confirm('确认彻底删除此曲（将同时从云端物理移除）？')) { 
        const track = db.globalMusicConfig.library[catId][idx];
        if (track && track.url) { 
            try { await fetch(track.url, { method: 'DELETE' }); } catch (e) {} 
        }
        db.globalMusicConfig.library[catId].splice(idx, 1); 
        
        if(typeof window.saveDB === 'function') await window.saveDB(); 
        if(typeof window.renderAdminMusicList === 'function') window.renderAdminMusicList(); 
    } 
}


/* ================= 9. 黑胶唱片机播放器引擎 ================= */
window.initProgressDrag = function() {
    const track = document.getElementById('progress-track'); 
    if (!track) return;
    
    const updatePos = (clientX) => { 
        const rect = track.getBoundingClientRect(); 
        let percent = (clientX - rect.left) / rect.width; 
        percent = Math.max(0, Math.min(1, percent)); 
        
        const fill = document.getElementById('progress-fill'); 
        const thumb = document.getElementById('progress-thumb'); 
        if(fill) fill.style.width = `${percent * 100}%`; 
        if(thumb) thumb.style.left = `${percent * 100}%`; 
        return percent; 
    };
    
    const finalizeDrag = (clientX) => { 
        const audio = document.getElementById('bgm-player'); 
        if (audio && !isNaN(audio.duration) && audio.duration > 0 && isFinite(audio.duration)) { 
            audio.currentTime = updatePos(clientX) * audio.duration; 
        } 
    };
    
    track.addEventListener('touchstart', (e) => { window.isDraggingProgress = true; updatePos(e.touches[0].clientX); }, {passive: false});
    track.addEventListener('touchmove', (e) => { if(window.isDraggingProgress) { e.preventDefault(); updatePos(e.touches[0].clientX); } }, {passive: false});
    track.addEventListener('touchend', (e) => { if(window.isDraggingProgress) { finalizeDrag(e.changedTouches[0].clientX); window.isDraggingProgress = false; } });
    track.addEventListener('mousedown', (e) => { window.isDraggingProgress = true; updatePos(e.clientX); });
    document.addEventListener('mousemove', (e) => { if(window.isDraggingProgress) { e.preventDefault(); updatePos(e.clientX); } });
    document.addEventListener('mouseup', (e) => { if(window.isDraggingProgress) { finalizeDrag(e.clientX); window.isDraggingProgress = false; } });
};

window.formatTime = function(seconds) { 
    if(isNaN(seconds) || !isFinite(seconds)) return "00:00"; 
    const m = Math.floor(seconds / 60).toString().padStart(2, '0'); 
    const s = Math.floor(seconds % 60).toString().padStart(2, '0'); 
    return `${m}:${s}`; 
}

window.updateProgress = function() {
    if(window.isDraggingProgress) return; 
    const now = Date.now(); 
    if (now - (window.lastTimeUpdate || 0) < 100) return; 
    window.lastTimeUpdate = now;
    
    const audio = document.getElementById('bgm-player'); 
    if (!audio || isNaN(audio.duration) || !isFinite(audio.duration)) return;
    
    const currentTime = audio.currentTime; 
    const duration = audio.duration; 
    const percent = (currentTime / duration) * 100;
    
    const fill = document.getElementById('progress-fill'); 
    const thumb = document.getElementById('progress-thumb');
    if(fill) fill.style.width = `${percent}%`; 
    if(thumb) thumb.style.left = `${percent}%`;
    
    const timeCur = document.getElementById('player-time-current');
    const timeTot = document.getElementById('player-time-total');
    if(timeCur) timeCur.innerText = window.formatTime(currentTime);
    if(timeTot) timeTot.innerText = window.formatTime(duration);
}

window.seekAudio = function(e) {
    const track = document.getElementById('progress-track'); 
    const audio = document.getElementById('bgm-player');
    if (!track || !audio || isNaN(audio.duration) || !isFinite(audio.duration)) return;
    
    const rect = track.getBoundingClientRect(); 
    const clickX = e.clientX - rect.left;
    let percent = clickX / rect.width; 
    if(percent < 0) percent = 0; 
    if(percent > 1) percent = 1;
    audio.currentTime = percent * audio.duration;
}

window.openMusicTypeModal = function() { 
    const container = document.getElementById('music-type-btn-container'); 
    if(container) container.innerHTML = ''; 
    
    const favBtn = document.createElement('button'); 
    favBtn.className = 'btn-glass btn-type-blue btn-favorite-cat'; 
    favBtn.style.margin = '0'; 
    favBtn.style.width = '100%'; 
    favBtn.style.padding = '1.2rem'; 
    favBtn.style.fontSize = '1.15rem'; 
    favBtn.innerText = '⭐ 我 的 收 藏'; 
    favBtn.onclick = () => { if(typeof window.openVinylPlayer === 'function') window.openVinylPlayer('favorites'); }; 
    if(container) container.appendChild(favBtn);
    
    const cats = db.globalMusicConfig.categories || []; 
    if(cats.length === 0) { 
        if(container) container.innerHTML += '<p style="opacity:0.5; font-size:0.9rem; margin-top:10px;">暂无其他音律分类，请联系管理员添加。</p>'; 
    } else { 
        cats.forEach((cat, index) => { 
            const btn = document.createElement('button'); 
            btn.className = 'btn-glass btn-type-dark'; 
            btn.style.margin = '0'; 
            btn.style.width = '100%'; 
            btn.style.padding = '1.2rem'; 
            btn.style.fontSize = '1.15rem'; 
            btn.innerText = cat.name; 
            btn.onclick = () => { if(typeof window.openVinylPlayer === 'function') window.openVinylPlayer(cat.id); }; 
            if(container) container.appendChild(btn); 
        }); 
    } 
    if(typeof window.showModal === 'function') window.showModal('music-type-modal'); 
}

window.openVinylPlayer = function(catId) { 
    if(typeof window.hideModal === 'function') window.hideModal('music-type-modal'); 
    musicState.type = catId; 
    
    if (catId === 'favorites') { 
        if(!currentUserAccount || !db.users[currentUserAccount].favorites) { 
            musicState.playlist = []; 
        } else { 
            musicState.playlist = db.users[currentUserAccount].favorites; 
        } 
    } else { 
        musicState.playlist = db.globalMusicConfig.library[catId] || []; 
    } 
    
    musicState.currentIndex = 0; 
    musicState.mode = 'sequence'; 
    musicState.tracksLimit = -1; 
    
    const modeBtn = document.getElementById('btn-play-mode'); 
    if(modeBtn) modeBtn.innerText = '🔁';
    
    const limitBtn = document.getElementById('btn-timer'); 
    if(limitBtn) limitBtn.style.color = '#fff';
    
    const searchEl = document.getElementById('vinyl-search');
    if(searchEl) searchEl.value = ''; 
    
    if(typeof window.renderVinylPlaylist === 'function') window.renderVinylPlaylist(); 
    if(typeof window.showModal === 'function') window.showModal('vinyl-player-modal'); 
    
    if(musicState.playlist.length > 0) { 
        if(typeof window.playCurrentTrack === 'function') window.playCurrentTrack(); 
    } else { 
        if(typeof window.pauseTrack === 'function') window.pauseTrack(); 
    }
}

window.filterVinylPlaylist = function() { 
    if(typeof window.renderVinylPlaylist === 'function') window.renderVinylPlaylist(); 
}

window.renderVinylPlaylist = function() { 
    const box = document.getElementById('playlist-ui'); 
    if(!box) return;
    box.innerHTML = ''; 
    
    if(musicState.playlist.length === 0) { 
        box.innerHTML = '<p style="padding:15px; opacity:0.5; text-align:center;">这里空空如也...</p>'; 
        return; 
    } 
    
    const searchEl = document.getElementById('vinyl-search');
    const query = searchEl ? searchEl.value.toLowerCase().trim() : ''; 
    
    musicState.playlist.forEach((track, idx) => { 
        const item = document.createElement('div'); 
        item.className = `netease-item ${idx === musicState.currentIndex ? 'active' : ''}`; 
        item.id = `track-item-${idx}`; 
        
        if(query && !track.name.toLowerCase().includes(query)) { 
            item.style.display = 'none'; 
        } 
        
        const numPad = (idx + 1).toString().padStart(2, '0'); 
        item.innerHTML = ` <div class="netease-index">${numPad}</div> <div class="netease-info"><div class="netease-title">${track.name}</div></div> <div class="netease-action">▶</div> `; 
        item.onclick = () => { 
            musicState.currentIndex = idx; 
            if(typeof window.playCurrentTrack === 'function') window.playCurrentTrack(); 
        }; 
        box.appendChild(item); 
    }); 
}

window.toggleFavorite = async function() { 
    if(!currentUserAccount || musicState.playlist.length === 0) {
        if(typeof window.showGlobalToast === 'function') return window.showGlobalToast('请先登录即可收藏', 'error'); 
        return;
    }
    
    if(favDebounce) clearTimeout(favDebounce); 
    const track = musicState.playlist[musicState.currentIndex]; 
    
    if(!db.users[currentUserAccount].favorites) db.users[currentUserAccount].favorites = []; 
    const favs = db.users[currentUserAccount].favorites; 
    const index = favs.findIndex(f => f.url === track.url); 
    
    const favBtn = document.getElementById('btn-favorite');
    
    if(index > -1) { 
        favs.splice(index, 1); 
        if(favBtn) favBtn.innerText = '🤍'; 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('已取消收藏', 'success'); 
    } else { 
        favs.push({name: track.name, url: track.url}); 
        if(favBtn) favBtn.innerText = '❤️'; 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('已存入云端收藏', 'success'); 
    } 
    
    favDebounce = setTimeout(async () => { 
        if(typeof window.saveDB === 'function') await window.saveDB(); 
        if (musicState.type === 'favorites') { 
            musicState.playlist = db.users[currentUserAccount].favorites; 
            if(typeof window.renderVinylPlaylist === 'function') window.renderVinylPlaylist(); 
        } 
    }, 1000); 
}

window.playCurrentTrack = function() { 
    const audioPlayer = document.getElementById('bgm-player'); 
    if(musicState.playlist.length === 0 || !audioPlayer) return; 
    
    const track = musicState.playlist[musicState.currentIndex]; 
    const nameEl = document.getElementById('player-track-name');
    if(nameEl) nameEl.innerText = track.name; 
    
    const favBtn = document.getElementById('btn-favorite');
    if (currentUserAccount && db.users[currentUserAccount].favorites) { 
        const isFav = db.users[currentUserAccount].favorites.findIndex(f => f.url === track.url) > -1; 
        if(favBtn) favBtn.innerText = isFav ? '❤️' : '🤍'; 
    } else { 
        if(favBtn) favBtn.innerText = '🤍'; 
    } 
    
    if(audioPlayer.src !== track.url) {
        audioPlayer.src = track.url; 
        audioPlayer.load(); 
        const fill = document.getElementById('progress-fill'); 
        const thumb = document.getElementById('progress-thumb');
        if(fill) fill.style.width = `0%`; 
        if(thumb) thumb.style.left = `0%`;
        const timeCur = document.getElementById('player-time-current');
        if(timeCur) timeCur.innerText = "00:00";
    } 
    
    audioPlayer.volume = 1; 
    audioPlayer.play().then(() => { 
        const discUI = document.getElementById('vinyl-disc-ui');
        if(discUI) discUI.classList.add('playing'); 
        
        const btnPlay = document.getElementById('btn-play-pause');
        if(btnPlay) btnPlay.innerText = '⏸️'; 
        
        const appleBox = document.getElementById('apple-music-box');
        if(appleBox) appleBox.classList.add('playing'); 
    }).catch(e=>{}); 
    
    if(typeof window.renderVinylPlaylist === 'function') window.renderVinylPlaylist(); 
    
    const activeItem = document.getElementById(`track-item-${musicState.currentIndex}`); 
    if(activeItem) { 
        activeItem.scrollIntoView({ behavior: "smooth", block: "center" }); 
    } 
}

window.pauseTrack = function() { 
    const audioPlayer = document.getElementById('bgm-player'); 
    if(!audioPlayer) return; 
    
    audioPlayer.pause(); 
    const discUI = document.getElementById('vinyl-disc-ui');
    if(discUI) discUI.classList.remove('playing'); 
    
    const btnPlay = document.getElementById('btn-play-pause');
    if(btnPlay) btnPlay.innerText = '▶️'; 
}

window.togglePlayPause = function() { 
    const audioPlayer = document.getElementById('bgm-player'); 
    if(!audioPlayer) return; 
    if(audioPlayer.paused) {
        if(typeof window.playCurrentTrack === 'function') window.playCurrentTrack(); 
    } else {
        if(typeof window.pauseTrack === 'function') window.pauseTrack(); 
    }
}

window.prevTrack = function() { 
    if(musicState.playlist.length===0) return; 
    if(musicState.mode === 'random') { 
        musicState.currentIndex = Math.floor(Math.random() * musicState.playlist.length); 
    } else { 
        musicState.currentIndex = (musicState.currentIndex - 1 + musicState.playlist.length) % musicState.playlist.length; 
    } 
    if(typeof window.playCurrentTrack === 'function') window.playCurrentTrack(); 
}

window.nextTrack = function() { 
    if(musicState.playlist.length===0) return; 
    if(musicState.mode === 'random') { 
        musicState.currentIndex = Math.floor(Math.random() * musicState.playlist.length); 
    } else { 
        musicState.currentIndex = (musicState.currentIndex + 1) % musicState.playlist.length; 
    } 
    if(typeof window.playCurrentTrack === 'function') window.playCurrentTrack(); 
}

window.changePlayMode = function() { 
    const btn = document.getElementById('btn-play-mode'); 
    if(musicState.mode === 'sequence') { 
        musicState.mode = 'random'; 
        if(btn) btn.innerText = '🔀'; 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('随机播放', 'success'); 
    } else if(musicState.mode === 'random') { 
        musicState.mode = 'single'; 
        if(btn) btn.innerText = '🔂'; 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('单曲循环', 'success'); 
    } else { 
        musicState.mode = 'sequence'; 
        if(btn) btn.innerText = '🔁'; 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('顺序播放', 'success'); 
    } 
}

window.handleAudioEnded = function() { 
    const audioPlayer = document.getElementById('bgm-player'); 
    if(musicState.playlist.length === 0) return; 
    
    if (musicState.tracksLimit > 0) { 
        musicState.tracksLimit--; 
        if (musicState.tracksLimit === 0) { 
            if(typeof window.pauseTrack === 'function') window.pauseTrack(); 
            musicState.tracksLimit = -1; 
            const timerBtn = document.getElementById('btn-timer'); 
            if(timerBtn) timerBtn.style.color = '#fff'; 
            if(typeof window.showGlobalToast === 'function') window.showGlobalToast('定时结束，已暂停', 'success'); 
            return; 
        } 
    } 
    
    if(musicState.mode === 'single') { 
        if(audioPlayer) { 
            audioPlayer.currentTime = 0; 
            audioPlayer.play().catch(e=>{}); 
        } 
    } else if(musicState.mode === 'random') { 
        musicState.currentIndex = Math.floor(Math.random() * musicState.playlist.length); 
        if(typeof window.playCurrentTrack === 'function') window.playCurrentTrack(); 
    } else { 
        musicState.currentIndex = (musicState.currentIndex + 1) % musicState.playlist.length; 
        if(typeof window.playCurrentTrack === 'function') window.playCurrentTrack(); 
    } 
}

window.setTrackLimit = function() { 
    const inputEl = document.getElementById('timer-input-val');
    if(inputEl) inputEl.value = ''; 
    if(typeof window.showModal === 'function') window.showModal('music-timer-modal'); 
}

window.confirmTrackLimit = function() { 
    const inputEl = document.getElementById('timer-input-val');
    let val = inputEl ? parseInt(inputEl.value) : NaN; 
    
    const timerBtn = document.getElementById('btn-timer');
    if (isNaN(val) || val <= 0) { 
        musicState.tracksLimit = -1; 
        if(timerBtn) timerBtn.style.color = '#fff'; 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('已取消定时', 'success'); 
    } else { 
        musicState.tracksLimit = val; 
        if(timerBtn) timerBtn.style.color = 'var(--theme-primary)'; 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast(`定时: ${val} 首后停止`, 'success'); 
    } 
    if(typeof window.hideModal === 'function') window.hideModal('music-timer-modal'); 
}

window.closeVinylPlayer = function() { 
    if(typeof window.hideModal === 'function') window.hideModal('vinyl-player-modal'); 
}

window.showPlayerFromFloat = function() { 
    if(state.isLoggedIn && !state.isEditMode) {
        const modal = document.getElementById('vinyl-player-modal');
        if (modal && modal.style.display !== 'flex') {
            if(typeof window.showModal === 'function') window.showModal('vinyl-player-modal'); 
        }
    } 
}


/* ================= 10. 双向奔赴长按打卡流程引擎 ================= */
window.startCardFlow = function(card) { 
    state.currentCard = card; 
    const prepTextEl = document.getElementById('prep-text');
    if(prepTextEl) prepTextEl.innerText = db.stages[state.stage].prepText; 
    
    const prepBtn = document.getElementById('btn-prep-confirm'); 
    if(prepBtn) {
        if (state.stage === '单身期') { 
            prepBtn.innerText = '我已准备好'; 
        } else { 
            prepBtn.innerText = '我们已预备好'; 
        } 
    }
    
    if(typeof window.navigateTo === 'function') window.navigateTo('screen-prep'); 
}

window.confirmPrepAndNavigate = function() { 
    if (state.stage === '单身期') { 
        const syncBox = document.getElementById('sync-animation-box'); 
        if(syncBox) syncBox.classList.remove('merged'); 
        
        const iconB64 = db.stages[state.stage].icon; 
        const bgStyle = iconB64 ? `background-image: url(${iconB64});` : `background: var(--theme-primary);`; 
        
        const syncTitle = document.getElementById('sync-title');
        if(syncTitle) syncTitle.innerText = "抬头仰望"; 
        
        const catName = db.stages[state.stage].categories.find(c => c.id === state.activeCategoryId)?.name || ''; 
        let subText = "愿你在静谧中得着内心的力量与安宁。"; 
        if (catName.includes('不想') || catName.includes('单身')) {
            subText = "在独处中享受生命的丰盈与自由，愿你拥有前行的勇气与光芒。"; 
        } else if (catName.includes('想') || catName.includes('进入婚姻')) {
            subText = "愿你在等待的时光里被温柔以待，美好的遇见正在路上。"; 
        }
        
        const subtitleEl = document.getElementById('sync-subtitle');
        if(subtitleEl) subtitleEl.innerText = subText; 
        
        const confirmBtn = document.getElementById('btn-sync-confirm');
        if(confirmBtn) confirmBtn.innerText = "抬 头 仰 望"; 
        
        const labelEl = document.getElementById('press-text-label');
        if(labelEl) labelEl.innerHTML = "内心宣告<br>(长按)"; 
        
        if(syncBox) syncBox.innerHTML = `<div class="sync-half single-up" style="${bgStyle} background-size: cover; border-radius: 50%;"></div>`; 
        
        if(typeof window.navigateTo === 'function') window.navigateTo('screen-sync'); 
    } else { 
        const syncTitle = document.getElementById('sync-title');
        if(syncTitle) syncTitle.innerText = "双向奔赴"; 
        
        const subtitleEl = document.getElementById('sync-subtitle');
        if(subtitleEl) subtitleEl.innerText = "确认手机贴合后，点击合并"; 
        
        const confirmBtn = document.getElementById('btn-sync-confirm');
        if(confirmBtn) confirmBtn.innerText = "确 认 合 并"; 
        
        const labelEl = document.getElementById('press-text-label');
        if(labelEl) labelEl.innerHTML = "同心宣告<br>(长按)"; 
        
        if(typeof window.navigateTo === 'function') window.navigateTo('screen-role'); 
    } 
}

window.selectRole = function(role) { 
    state.role = role; 
    const syncBox = document.getElementById('sync-animation-box'); 
    if(syncBox) syncBox.classList.remove('merged'); 
    
    const iconB64 = db.stages[state.stage].icon; 
    const bgStyle = iconB64 ? `background-image: url(${iconB64});` : `background: var(--theme-primary);`; 
    
    if(syncBox) {
        if (role === 'boy') {
            syncBox.innerHTML = `<div class="sync-half boy" style="${bgStyle} background-size: cover;"></div>`; 
        } else {
            syncBox.innerHTML = `<div class="sync-half girl" style="${bgStyle} background-size: cover;"></div>`; 
        }
    }
    
    if(typeof window.navigateTo === 'function') window.navigateTo('screen-sync'); 
}

window.triggerSync = function() { 
    const syncBox = document.getElementById('sync-animation-box');
    if(syncBox) syncBox.classList.add('merged'); 
    
    state.currentStep = 0; 
    
    setTimeout(() => { 
        if(typeof window.renderContentStep === 'function') window.renderContentStep(); 
        if(typeof window.navigateTo === 'function') window.navigateTo('screen-content'); 
    }, 1800); 
}

window.renderContentStep = function() { 
    const stepData = state.currentCard.steps[state.currentStep]; 
    
    const titleEl = document.getElementById('content-type-title');
    if(titleEl) {
        titleEl.innerText = `【${db.stages[state.stage].categories.find(c => c.id === state.currentCard.categoryId)?.name || '印记'}】的连结`; 
    }
    
    const stepTitle = document.getElementById('step-title');
    if(stepTitle) stepTitle.innerText = stepData.title; 
    
    const stepText = document.getElementById('step-text');
    if(stepText) stepText.innerHTML = stepData.text.replace(/\n/g, '<br><br>'); 
    
    for(let i=1; i<=3; i++) { 
        const dot = document.getElementById(`dot-${i}`); 
        if(dot) {
            if (i - 1 === state.currentStep) {
                dot.classList.add('active'); 
            } else {
                dot.classList.remove('active'); 
            }
        }
    } 
    
    const nextBtn = document.getElementById('btn-next-step'); 
    const longPressBtn = document.getElementById('btn-long-press'); 
    
    if (state.currentStep < 2) { 
        if(nextBtn) nextBtn.style.display = 'flex'; 
        if(longPressBtn) longPressBtn.style.display = 'none'; 
    } else { 
        if(nextBtn) nextBtn.style.display = 'none'; 
        if(longPressBtn) longPressBtn.style.display = 'flex'; 
    } 
}

window.nextContentStep = function() { 
    if (state.currentStep < 2) { 
        state.currentStep++; 
        const t = document.getElementById('step-title'); 
        const p = document.getElementById('step-text'); 
        
        if(t) t.style.opacity = 0; 
        if(p) p.style.opacity = 0; 
        
        setTimeout(() => { 
            if(typeof window.renderContentStep === 'function') window.renderContentStep(); 
            if(t) {
                t.style.transition = 'opacity 0.5s'; 
                t.style.opacity = 1; 
            }
            if(p) {
                p.style.transition = 'opacity 0.5s'; 
                p.style.opacity = 1; 
            }
        }, 300); 
    } 
}

window.startPress = function(e) { 
    if(e && e.type === 'touchstart') e.preventDefault(); 
    if(isPressing) return; 
    
    const pressArea = document.getElementById('btn-long-press'); 
    const pressFill = document.getElementById('press-fill'); 
    
    isPressing = true; 
    pressProgress = 0; 
    
    if (pressArea) pressArea.classList.add('pressing');
    if(pressFill) { 
        pressFill.style.transition = 'none'; 
        pressFill.style.height = '0%'; 
    }
    
    if(pressFrame) cancelAnimationFrame(pressFrame); 
    
    let startTime = null; 
    const duration = 1500; 
    
    function up(timestamp) { 
        if(!isPressing) return; 
        if(!startTime) startTime = timestamp; 
        
        const elapsed = timestamp - startTime; 
        pressProgress = Math.min((elapsed / duration) * 100, 100); 
        
        if(pressFill) pressFill.style.height = `${pressProgress}%`; 
        
        if (pressProgress >= 100) { 
            isPressing = false; 
            if (pressArea) pressArea.classList.remove('pressing'); 
            if(typeof window.completeAction === 'function') window.completeAction(); 
        } else { 
            pressFrame = requestAnimationFrame(up); 
        } 
    } 
    
    pressFrame = requestAnimationFrame(up); 
}

window.endPress = function(e) { 
    if(e && e.type === 'touchend') e.preventDefault(); 
    isPressing = false; 
    
    const pressArea = document.getElementById('btn-long-press'); 
    if (pressArea) pressArea.classList.remove('pressing');
    
    if(pressFrame) cancelAnimationFrame(pressFrame); 
    
    if (pressProgress < 100) { 
        pressProgress = 0; 
        const pressFill = document.getElementById('press-fill'); 
        if(pressFill) { 
            pressFill.style.transition = 'height 0.3s ease-out'; 
            pressFill.style.height = `0%`; 
            setTimeout(() => { 
                if(!isPressing) pressFill.style.transition = ''; 
            }, 300); 
        }
    } 
}

window.completeAction = function() { 
    if(pressFrame) cancelAnimationFrame(pressFrame); 
    if(typeof window.navigateTo === 'function') window.navigateTo('screen-finish'); 
}

window.resetToStage = function() { 
    const pressFill = document.getElementById('press-fill'); 
    if(pressFill) { 
        pressFill.style.transition = ''; 
        pressFill.style.height = `0%`; 
    }
    
    state.currentCard = null; 
    state.role = ''; 
    state.currentStep = 0; 
    
    if(typeof window.initStageScreen === 'function') window.initStageScreen(); 
}
