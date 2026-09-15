/* ================= 1. 高级数据中枢与全栈同步架构 ================= */
const stagesList = ['单身期', '恋爱期', '定婚期', '结婚', '备孕期', '孕后初期', '婚后进阶'];

const defaultDB = {
    users: {}, 
    globalMusicConfig: {
        categories: [
            { id: 'mcat_1', name: '纯乐伴奏' },
            { id: 'mcat_2', name: '歌曲演唱' }
        ],
        library: { 'mcat_1': [], 'mcat_2': [] }
    },
    stages: {
        '单身期': { themeParams: { dark: { bg: '#16171b', p: '#6366f1', s: '#818cf8' }, light: { bg: '#f0f4f8', p: '#4f46e5', s: '#818cf8' } }, icon: '', name: '单身期', prepText: '静心安息，在独处的时光中沉淀自我。请找一个安静的地方，深呼吸，预备进入内心的探索。', categories: [{ id: 'cat_s1', name: '不想进入婚姻' }, { id: 'cat_s2', name: '我想进入婚姻' }], cards: [{ id: 'c_s_1', categoryId: 'cat_s1', title: '拥抱此刻的完整', type: '心', steps: [{title:'认知',text:'单身本身即是完整，非过渡期。'},{title:'操练',text:'今日为自己做一顿精美的晚餐。'},{title:'宣告',text:'我在爱中富足，不因外在状态而匮乏。'}] }] },
        '恋爱期': { themeParams: { dark: { bg: '#1a1114', p: '#d4af37', s: '#ec4899' }, light: { bg: '#fcf2f5', p: '#d97706', s: '#f472b6' } }, icon: '', name: '恋爱期', prepText: '相对而坐，保持一臂距离，深呼吸两次，放下外界的喧嚣，预备心灵进入交流。', categories: [{ id: 'cat_l1', name: '核心操练' }], cards: [{ id: 'c_l_1', categoryId: 'cat_l1', title: '倾听的艺术', type: '脑', steps: [{title:'行为意义',text:'倾听是心灵的交融。'},{title:'具体操练',text:'注视对方眼睛，放下手机。'},{title:'同心宣告',text:'我愿将你放在心上如印记。'}] }] },
        '定婚期': { themeParams: { dark: { bg: '#1a1610', p: '#d4af37', s: '#f59e0b' }, light: { bg: '#fcfaf5', p: '#d97706', s: '#fcd34d' } }, icon: '', name: '定婚期', prepText: '即将步入婚姻殿堂，回想决定携手的初心。', categories: [{id:'cat_e1',name:'盟约预备'}], cards: [] },
        '结婚': { themeParams: { dark: { bg: '#1c1012', p: '#d4af37', s: '#ef4444' }, light: { bg: '#fdf5f5', p: '#dc2626', s: '#fca5a5' } }, icon: '', name: '结婚初阶', prepText: '爱意要在日常点滴中活出。请拥抱彼此。', categories: [{id:'cat_m1',name:'合二为一'}], cards: [] },
        '备孕期': { themeParams: { dark: { bg: '#101c17', p: '#d4af37', s: '#10b981' }, light: { bg: '#f4fbf7', p: '#059669', s: '#6ee7b7' } }, icon: '', name: '备孕时期', prepText: '滋养爱情，把手放在对方的肩上。', categories: [{id:'cat_p1',name:'孕育之爱'}], cards: [] },
        '孕后初期': { themeParams: { dark: { bg: '#10171c', p: '#d4af37', s: '#0ea5e9' }, light: { bg: '#f4f9fd', p: '#0284c7', s: '#7dd3fc' } }, icon: '', name: '孕后初期', prepText: '疲惫需要温柔承托，轻揉肩膀放松。', categories: [{id:'cat_ep1',name:'温柔承托'}], cards: [] },
        '婚后进阶': { themeParams: { dark: { bg: '#16121c', p: '#d4af37', s: '#8b5cf6' }, light: { bg: '#faf5ff', p: '#7c3aed', s: '#c4b5fd' } }, icon: '', name: '婚后进阶', prepText: '全然接纳此刻真实的彼此。', categories: [{id:'cat_a1',name:'平淡坚守'}], cards: [] }
    }
};

let db = defaultDB;
let toastTimeout;
let currentUserAccount = null; 
// 挂载全局音频对象 (HTML中定义)
let audioPlayer;

/* ================= 0. 核心依赖防崩溃包装 (Defensive Init) ================= */
document.addEventListener("DOMContentLoaded", () => {
    // 1. 初始化 Canvas
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        window.ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        initParticles();
        animateParticles();
    }

    // 2. 初始化 Audio (防止因 DOM 未加载导致的 null crash)
    audioPlayer = document.getElementById('bgm-player');
    if (audioPlayer) {
        audioPlayer.removeEventListener('ended', window.handleAudioEnded);
        audioPlayer.addEventListener('ended', window.handleAudioEnded);
    }

    // 3. 初始化长按事件
    const longPressBtn = document.getElementById('btn-long-press');
    if (longPressBtn) {
        longPressBtn.addEventListener('mousedown', window.startPress);
        longPressBtn.addEventListener('mouseup', window.endPress);
        longPressBtn.addEventListener('mouseleave', window.endPress);
        longPressBtn.addEventListener('touchstart', window.startPress, {passive: false});
        longPressBtn.addEventListener('touchend', window.endPress, {passive: false});
        longPressBtn.addEventListener('touchcancel', window.endPress, {passive: false});
    }

    // 4. 启动数据引擎
    initDB();
});


function cleanupOldLocalStorage() {
    const currentVersion = 'sealOfLoveDB_v16';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sealOfLoveDB_') && key !== currentVersion) {
            localStorage.removeItem(key);
        }
    }
}

window.showGlobalToast = function(text, type = 'loading') {
    const toast = document.getElementById('global-toast'); const icon = document.getElementById('toast-icon'); const msg = document.getElementById('toast-text');
    if(!toast) return;
    toast.className = `global-toast show ${type}`; msg.innerText = text;
    if(type === 'loading') icon.innerText = '⏳'; if(type === 'success') icon.innerText = '✓'; if(type === 'error') icon.innerText = '✖';
    clearTimeout(toastTimeout);
    if(type !== 'loading') { toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3000); }
}

function compressImageFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas'); const MAX_SIZE = 240; 
            let width = img.width; let height = img.height;
            if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
            canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/webp', 0.75));
        }; img.src = e.target.result;
    }; reader.readAsDataURL(file);
}

window.saveDB = async function() {
    let localSaved = false;
    try { cleanupOldLocalStorage(); localStorage.setItem('sealOfLoveDB_v16', JSON.stringify(db)); localSaved = true; } catch (e) {}
    try {
        window.showGlobalToast('正在同步至云端...', 'loading');
        const res = await fetch('/api/db', { method: 'POST', body: JSON.stringify(db), headers: { 'Content-Type': 'application/json' }});
        if(res.ok) { window.showGlobalToast(localSaved ? '已极速同步至云端' : '云端同步成功', 'success'); } 
        else { window.showGlobalToast('云端同步异常', 'error'); }
    } catch(e) { window.showGlobalToast('网络异常，数据未保存至云端', 'error'); }
}

function upgradeDBStructure(tempDb) {
    if (!tempDb) return defaultDB;
    // 升级用户数据，添加 favorites 数组
    for (let key in tempDb.users) {
        if (typeof tempDb.users[key] === 'string') { tempDb.users[key] = { password: tempDb.users[key], nickname: '', avatar: '', favorites: [] }; }
        if (!tempDb.users[key].favorites) tempDb.users[key].favorites = [];
    }
    stagesList.forEach(s => { if(!tempDb.stages[s]) tempDb.stages[s] = JSON.parse(JSON.stringify(defaultDB.stages[s])); });
    
    // 全局动态音乐库升级
    if (!tempDb.globalMusicConfig) {
        tempDb.globalMusicConfig = { categories: [ { id: 'mcat_1', name: '纯乐伴奏' }, { id: 'mcat_2', name: '歌曲演唱' } ], library: { 'mcat_1': [], 'mcat_2': [] } };
        const tryMigrate = (list, targetCat) => { if(Array.isArray(list)) list.forEach(m => { if(!tempDb.globalMusicConfig.library[targetCat].find(x => x.url === m.url)) tempDb.globalMusicConfig.library[targetCat].push(m); }); };
        if(tempDb.musicLibrary) { tryMigrate(tempDb.musicLibrary.instrumental, 'mcat_1'); tryMigrate(tempDb.musicLibrary.vocal, 'mcat_2'); delete tempDb.musicLibrary; }
        stagesList.forEach(s => { if (tempDb.stages[s].musicLibrary) { tryMigrate(tempDb.stages[s].musicLibrary.instrumental, 'mcat_1'); tryMigrate(tempDb.stages[s].musicLibrary.vocal, 'mcat_2'); delete tempDb.stages[s].musicLibrary; } });
    }
    return tempDb;
}

async function initDB() {
    try {
        const res = await fetch('/api/db'); 
        if (res.ok) {
            const remoteDb = await res.json();
            if (remoteDb && remoteDb.stages) {
                db = upgradeDBStructure(remoteDb); 
                if (currentUserAccount && !db.users[currentUserAccount]) db.users[currentUserAccount] = { password: '云端验证', nickname: '', avatar: '', favorites: [] };
                try { cleanupOldLocalStorage(); localStorage.setItem('sealOfLoveDB_v16', JSON.stringify(db)); } catch(e){} 
                initStageScreen();
                return;
            }
        }
    } catch (e) {}
    const local = JSON.parse(localStorage.getItem('sealOfLoveDB_v16'));
    if (local && local.stages) { db = upgradeDBStructure(local); initStageScreen(); }
    else window.saveDB();
}


/* ================= 2. 状态机与双轨主题引擎 ================= */
let state = { isLoggedIn: false, isAdmin: false, isEditMode: false, stage: '', activeCategoryId: '', currentCard: null, role: '', currentStep: 0, isLightTheme: false };

window.toggleTheme = function() {
    state.isLightTheme = !state.isLightTheme; document.getElementById('btn-theme').innerText = state.isLightTheme ? '☀️' : '🌙';
    if (state.isLightTheme) document.body.classList.add('light-theme'); else document.body.classList.remove('light-theme');
    if(state.stage) applyStageTheme(state.stage);
}

/* ================= 3. 对称粒子系统 ================= */
let particles = []; 
let animationId;
function resizeCanvas() { 
    const canvas = document.getElementById('particle-canvas');
    if(!canvas) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight; 
} 
class Particle {
    constructor() { 
        const canvas = document.getElementById('particle-canvas');
        this.x = Math.random() * (canvas ? canvas.width / 2 : 300); this.y = Math.random() * (canvas ? canvas.height : 600); this.size = Math.random() * 1.5 + 0.5; this.speedY = Math.random() * 0.4 - 0.2; this.speedX = Math.random() * 0.2 - 0.1; this.baseAlpha = Math.random() * 0.4 + 0.1; this.pulse = Math.random() * Math.PI; 
    }
    update() { 
        const canvas = document.getElementById('particle-canvas'); if(!canvas) return;
        this.y += this.speedY; this.x += this.speedX; if (this.y < 0) this.y = canvas.height; if (this.y > canvas.height) this.y = 0; if (this.x < 0) this.x = canvas.width / 2; if (this.x > canvas.width / 2) this.x = 0; this.pulse += 0.02; 
    }
    draw(colorStr) { 
        if(!window.ctx) return;
        const canvas = document.getElementById('particle-canvas');
        const alpha = this.baseAlpha + Math.sin(this.pulse) * 0.2; window.ctx.fillStyle = colorStr.replace(')', `, ${alpha})`).replace('rgb', 'rgba'); window.ctx.beginPath(); window.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); window.ctx.fill(); window.ctx.beginPath(); window.ctx.arc(canvas.width - this.x, this.y, this.size, 0, Math.PI * 2); window.ctx.fill(); 
    }
}
function initParticles() { particles = []; const count = window.innerWidth < 600 ? 25 : 50; for (let i = 0; i < count; i++) particles.push(new Particle()); }
function animateParticles() {
    const canvas = document.getElementById('particle-canvas');
    if(!canvas || !window.ctx) return;
    window.ctx.clearRect(0, 0, canvas.width, canvas.height);
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim();
    const hexToRgb = hex => { let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return isNaN(r) ? 'rgb(212,175,55)' : `rgb(${r},${g},${b})`; };
    const colorStr = primaryColor.startsWith('#') ? hexToRgb(primaryColor) : 'rgb(212,175,55)';
    particles.forEach(p => { p.update(); p.draw(colorStr); }); animationId = requestAnimationFrame(animateParticles);
}


/* ================= 4. 安全鉴权引擎与多态登录映射 ================= */
window.handleLogin = async function() {
    const inputU = document.getElementById('ipt-username').value.trim(); 
    const p = document.getElementById('ipt-pwd').value.trim();
    if(!inputU || !p) return alert('请输入账号/昵称和密码');

    let baseUsername = inputU; 
    if (!db.users[inputU]) { for (let key in db.users) { if (db.users[key].nickname === inputU) { baseUsername = key; break; } } }

    try {
        const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: baseUsername, password: p }) });
        if (response.ok) { const result = await response.json(); if(result.success) { loginSuccess(baseUsername, true); return; } }
    } catch (error) { console.log("后端鉴权降级至本地"); }

    if(db.users[baseUsername] && db.users[baseUsername].password === p) { loginSuccess(baseUsername, false); } else alert('账号或密码错误。');
}

function loginSuccess(baseUser, isAdmin) {
    state.isLoggedIn = true; state.isAdmin = isAdmin; currentUserAccount = baseUser;
    document.getElementById('user-widget').style.display = 'flex'; updateUserWidgetIcon(); initStageScreen();
}

window.handleRegister = async function() {
    const u = document.getElementById('ipt-username').value.trim(); const p = document.getElementById('ipt-pwd').value.trim();
    if(!u || !p) return alert('请填写完整'); if (!/^[a-zA-Z0-9]+$/.test(u)) return alert('原生账号仅限英文数字组合');
    if(db.users[u]) return alert('账号已存在'); 
    db.users[u] = { password: p, nickname: '', avatar: '', favorites: [] }; await window.saveDB(); loginSuccess(u, false);
}

window.logout = function() {
    state.isLoggedIn = false; state.isAdmin = false; state.isEditMode = false; currentUserAccount = null;
    document.getElementById('top-admin-controls').style.display = 'none'; document.getElementById('user-widget').style.display = 'none'; 
    window.navigateTo('screen-login');
    document.body.classList.remove('light-theme'); state.isLightTheme = false; document.getElementById('btn-theme').innerText = '🌙';
    document.documentElement.style.setProperty('--theme-bg-color', '#1c1d22'); document.documentElement.style.setProperty('--theme-primary', '#d4af37');
}

window.openUserProfile = function() {
    if(!currentUserAccount) return;
    if (!db.users[currentUserAccount]) db.users[currentUserAccount] = { password: '云端验证', nickname: '', avatar: '', favorites: [] };
    const userData = db.users[currentUserAccount];
    const imgEl = document.getElementById('profile-avatar-img'); const svgEl = document.getElementById('profile-svg-placeholder');
    if(userData && userData.avatar) { imgEl.src = userData.avatar; imgEl.style.display = 'block'; svgEl.style.display = 'none'; } 
    else { imgEl.style.display = 'none'; svgEl.style.display = 'block'; }
    document.getElementById('profile-nickname-input').value = userData.nickname || '';
    const recoveryWrap = document.getElementById('admin-recovery-btn-wrap');
    if (state.isAdmin) recoveryWrap.style.display = 'block'; else recoveryWrap.style.display = 'none';
    window.showModal('user-profile-modal');
}

window.handleProfileAvatar = function(inputEl) {
    if(inputEl.files.length > 0) {
        compressImageFile(inputEl.files[0], (base64) => {
            const imgEl = document.getElementById('profile-avatar-img'); imgEl.src = base64; imgEl.style.display = 'block'; document.getElementById('profile-svg-placeholder').style.display = 'none';
        });
    }
}

window.saveUserProfile = async function() {
    if(!currentUserAccount) return;
    const nick = document.getElementById('profile-nickname-input').value.trim(); const imgEl = document.getElementById('profile-avatar-img');
    for(let key in db.users) { if(key !== currentUserAccount && db.users[key].nickname && db.users[key].nickname === nick) { return alert('该昵称已被使用'); } }
    if (!db.users[currentUserAccount]) db.users[currentUserAccount] = { password: '云端验证', nickname: '', avatar: '', favorites: [] };
    db.users[currentUserAccount].nickname = nick;
    if(imgEl.style.display === 'block') db.users[currentUserAccount].avatar = imgEl.src;
    await window.saveDB(); updateUserWidgetIcon(); window.hideModal('user-profile-modal');
}

function updateUserWidgetIcon() {
    if(!currentUserAccount) return;
    if (!db.users[currentUserAccount]) db.users[currentUserAccount] = { password: '云端验证', nickname: '', avatar: '', favorites: [] };
    const userData = db.users[currentUserAccount]; const imgEl = document.getElementById('user-widget-avatar'); const svgEl = document.getElementById('user-widget-svg');
    if(userData && userData.avatar) { imgEl.src = userData.avatar; imgEl.style.display = 'block'; svgEl.style.display = 'none'; } 
    else { imgEl.style.display = 'none'; svgEl.style.display = 'block'; }
}

window.toggleEditMode = function() {
    state.isEditMode = !state.isEditMode;
    document.getElementById('btn-edit-toggle').innerText = state.isEditMode ? '关闭深度编辑' : '开启深度编辑';
    if(state.isEditMode) document.body.classList.add('edit-mode'); else document.body.classList.remove('edit-mode');
    if (document.getElementById('screen-stage').classList.contains('active')) initStageScreen(); else if (document.getElementById('screen-card-list').classList.contains('active')) renderCardList();
}

window.showModal = function(id) { document.getElementById(id).style.display = 'flex'; }
window.hideModal = function(id) { document.getElementById(id).style.display = 'none'; }
window.navigateTo = function(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId).classList.add('active'); document.getElementById(screenId).scrollTop = 0; }

function applyStageTheme(stageName) {
    if (!stageName || !db.stages[stageName]) return;
    const t = db.stages[stageName].themeParams; const currentParams = state.isLightTheme ? t.light : t.dark;
    document.documentElement.style.setProperty('--theme-bg-color', currentParams.bg);
    document.documentElement.style.setProperty('--theme-primary', currentParams.p);
    document.documentElement.style.setProperty('--theme-secondary', currentParams.s);
}

/* ================= 5. 主屏：3/4 精确排版 ================= */
function initStageScreen() {
    document.getElementById('top-admin-controls').style.display = state.isAdmin ? 'flex' : 'none';
    const currentParams = state.isLightTheme ? { bg: '#f8f6f0', p: '#d99a29', s: '#f4c453' } : { bg: '#1c1d22', p: '#d4af37', s: '#ebd373' };
    document.documentElement.style.setProperty('--theme-bg-color', currentParams.bg); document.documentElement.style.setProperty('--theme-primary', currentParams.p); document.documentElement.style.setProperty('--theme-secondary', currentParams.s);

    const container = document.getElementById('stage-buttons-container'); container.innerHTML = '';
    const rowTop = document.createElement('div'); rowTop.className = 'stage-row-top';
    const rowBottom = document.createElement('div'); rowBottom.className = 'stage-row-bottom';

    stagesList.forEach((sKey, index) => {
        const sData = db.stages[sKey]; const iconB64 = sData.icon; const displayName = sData.name || sKey; 
        const card = document.createElement('div'); card.className = 'stage-card'; card.onclick = (e) => { if(!state.isEditMode) window.selectStage(sKey); };
        const iconDiv = document.createElement('div'); iconDiv.className = 'stage-icon-dropzone';
        if (iconB64) { iconDiv.innerHTML = `<img src="${iconB64}">`; } else { iconDiv.innerHTML = `<span style="font-size: clamp(16px, 5vw, 26px); color:var(--theme-text); font-family:var(--font-title); opacity:0.9;">${displayName.charAt(0)}</span>`; }

        const titleInput = document.createElement('input'); titleInput.className = 'stage-card-title'; titleInput.value = displayName;
        if (state.isEditMode) {
            iconDiv.addEventListener('click', (e) => { e.stopPropagation(); const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = ev => {if(ev.target.files[0]) handleIconUpload(ev.target.files[0], sKey)}; input.click(); });
            titleInput.addEventListener('click', (e) => { e.stopPropagation(); }); titleInput.addEventListener('blur', (e) => { sData.name = e.target.value; window.saveDB(); });
        }
        card.appendChild(iconDiv); card.appendChild(titleInput); 
        if (index < 3) rowTop.appendChild(card); else rowBottom.appendChild(card);
    });
    container.appendChild(rowTop); container.appendChild(rowBottom); window.navigateTo('screen-stage');
}

function handleIconUpload(file, stageKey) { compressImageFile(file, async (base64Str) => { db.stages[stageKey].icon = base64Str; await window.saveDB(); initStageScreen(); }); }

/* ================= 6. 分类大选项与瀑布流卡片 ================= */
window.selectStage = function(sKey) {
    if(state.isEditMode) return;
    state.stage = sKey; applyStageTheme(sKey);
    document.getElementById('list-stage-title').innerText = `${db.stages[sKey].name}`;
    
    const cats = db.stages[sKey].categories || [];
    if(cats.length > 0) state.activeCategoryId = cats[0].id; else state.activeCategoryId = '';
    renderCardList(); window.navigateTo('screen-card-list');
}

function renderCardList() {
    const cats = db.stages[state.stage].categories || [];
    const tabContainer = document.getElementById('cat-tabs-container'); tabContainer.innerHTML = '';
    
    if (cats.length > 1 || state.isEditMode) {
        cats.forEach(cat => {
            const tab = document.createElement('div'); tab.className = `cat-tab ${cat.id === state.activeCategoryId ? 'active' : ''}`;
            tab.innerText = cat.name; tab.onclick = () => { state.activeCategoryId = cat.id; renderCardList(); };
            tabContainer.appendChild(tab);
        });
    }

    const container = document.getElementById('card-list-container'); container.innerHTML = '';
    const activeCards = db.stages[state.stage].cards.filter(c => c.categoryId === state.activeCategoryId);
    const modules = ['脑', '心', '手']; let hasRenderedAny = false;

    modules.forEach(modType => {
        const modCards = activeCards.filter(c => c.type === modType);
        if(modCards.length > 0 || state.isEditMode) {
            hasRenderedAny = true;
            const section = document.createElement('div'); section.className = 'module-section';
            section.innerHTML = `<div class="module-title">${modType}之连结</div>`;
            const grid = document.createElement('div'); grid.className = 'content-grid';
            
            modCards.forEach((card) => {
                const cardDiv = document.createElement('div'); cardDiv.className = 'data-card';
                cardDiv.innerHTML = `<h3 class="card-inner-title">${card.title}</h3><span class="card-tag">${modType}板块</span>`;
                
                if (state.isEditMode) {
                    const globalIndex = db.stages[state.stage].cards.findIndex(c => c.id === card.id);
                    const actDiv = document.createElement('div'); actDiv.className = 'card-edit-badge';
                    actDiv.innerHTML = `<div class="action-icon" onclick="event.stopPropagation(); window.openEditModal(${globalIndex})">✎</div><div class="action-icon del" onclick="event.stopPropagation(); window.deleteCard(${globalIndex})">✖</div>`;
                    cardDiv.appendChild(actDiv);
                }
                cardDiv.onclick = () => { if(!state.isEditMode) window.startCardFlow(card); };
                grid.appendChild(cardDiv);
            });
            if(modCards.length === 0 && state.isEditMode) grid.innerHTML = `<p style="opacity:0.4; font-size:0.85rem; text-align:center; width:100%; grid-column: 1 / -1; padding: 20px;">该板块暂无卡片</p>`;
            section.appendChild(grid); container.appendChild(section);
        }
    });
    if(!hasRenderedAny) container.innerHTML = '<p style="opacity:0.5; margin-top:30px; text-align:center;">当前分类暂无内容</p>';
}

window.manageCategories = async function() {
    const listDiv = document.getElementById('cat-list-edit'); listDiv.innerHTML = '';
    const cats = db.stages[state.stage].categories || [];
    cats.forEach((cat, idx) => {
        const div = document.createElement('div'); div.style.display = 'flex'; div.style.gap = '10px'; div.style.alignItems = 'center';
        div.innerHTML = `<input type="text" style="margin:0; flex:1;" id="cat_input_${idx}" value="${cat.name}"><button class="btn-glass" style="width:45px; height:45px; margin:0; color:#ef4444; padding:0; border-radius:12px;" onclick="window.removeCat(${idx})">✖</button>`;
        listDiv.appendChild(div);
    }); window.showModal('cat-modal');
}
window.addNewCategory = function() { if(!db.stages[state.stage].categories) db.stages[state.stage].categories = []; db.stages[state.stage].categories.push({ id: 'cat_' + Date.now(), name: '新建大选项' }); window.manageCategories(); }
window.removeCat = async function(idx) {
    const catId = db.stages[state.stage].categories[idx].id; const linkedCards = db.stages[state.stage].cards.filter(c => c.categoryId === catId);
    if(linkedCards.length > 0 && !confirm(`该分类下有 ${linkedCards.length} 张卡片，确定删除吗？`)) return;
    db.stages[state.stage].categories.splice(idx, 1); window.manageCategories();
}
window.saveCategories = async function() {
    const cats = db.stages[state.stage].categories || [];
    cats.forEach((cat, idx) => { const input = document.getElementById(`cat_input_${idx}`); if(input) cat.name = input.value; });
    await window.saveDB(); window.hideModal('cat-modal'); 
    if(!cats.find(c => c.id === state.activeCategoryId) && cats.length > 0) state.activeCategoryId = cats[0].id; renderCardList();
}

window.editPrepText = async function() { const t = prompt("预备提醒文本：", db.stages[state.stage].prepText); if (t !== null) { db.stages[state.stage].prepText = t; await window.saveDB(); } }
window.deleteCard = async function(index) { if(confirm('确认删除？')) { db.stages[state.stage].cards.splice(index, 1); await window.saveDB(); renderCardList(); } }

window.openEditModal = function(index) {
    const isNew = (index === null); document.getElementById('modal-title').innerText = isNew ? '新增卡片' : '编辑卡片';
    const catSelect = document.getElementById('edit-card-category'); catSelect.innerHTML = '';
    const cats = db.stages[state.stage].categories || []; cats.forEach(c => { catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`; });

    let c = isNew ? { id: 'c_'+Date.now(), categoryId: state.activeCategoryId, title:'', type:'心', steps:[{title:'', text:''},{title:'', text:''},{title:'', text:''}] } : db.stages[state.stage].cards[index];

    document.getElementById('edit-card-id').value = index === null ? 'new' : index;
    document.getElementById('edit-card-category').value = c.categoryId || (cats[0]?cats[0].id:'');
    document.getElementById('edit-card-type').value = c.type; document.getElementById('edit-card-title').value = c.title;
    for(let i=1; i<=3; i++) { document.getElementById(`edit-s${i}-title`).value = c.steps[i-1] ? c.steps[i-1].title : ''; document.getElementById(`edit-s${i}-text`).value = c.steps[i-1] ? c.steps[i-1].text : ''; }
    window.showModal('edit-modal');
}

window.saveCard = async function() {
    const idxStr = document.getElementById('edit-card-id').value;
    const c = { id: idxStr === 'new' ? 'c_' + Date.now() : db.stages[state.stage].cards[parseInt(idxStr)].id, categoryId: document.getElementById('edit-card-category').value, title: document.getElementById('edit-card-title').value || '未命名', type: document.getElementById('edit-card-type').value || '心', steps: [] };
    for(let i=1; i<=3; i++) c.steps.push({ title: document.getElementById(`edit-s${i}-title`).value, text: document.getElementById(`edit-s${i}-text`).value });
    if(idxStr === 'new') db.stages[state.stage].cards.push(c); else db.stages[state.stage].cards[parseInt(idxStr)] = c;
    await window.saveDB(); window.hideModal('edit-modal'); renderCardList();
}

/* ================= 7. R2 大文件并发上传队列与进度胶囊 ================= */
window.uploadQueue = [];
window.isUploading = false;

async function processUploadQueue() {
    if(window.isUploading || window.uploadQueue.length === 0) return;
    window.isUploading = true;
    
    const capsule = document.getElementById('upload-capsule');
    const capsuleText = document.getElementById('upload-capsule-text');
    const capsuleProgress = document.getElementById('upload-capsule-fill');
    capsule.classList.add('show');

    const totalTasks = window.uploadQueue.length;
    let completedTasks = 0;

    while(window.uploadQueue.length > 0) {
        const task = window.uploadQueue.shift(); 
        completedTasks++;
        
        try {
            const url = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/upload');
                xhr.upload.onprogress = (e) => {
                    if(e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        capsuleText.innerText = `正在上传 (${completedTasks}/${totalTasks}) ${Math.round(percent)}%`;
                        capsuleProgress.style.width = `${percent}%`;
                    }
                };
                xhr.onload = () => {
                    if(xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).url);
                    else reject(new Error('Upload failed'));
                };
                xhr.onerror = () => reject(new Error('Network error'));
                const formData = new FormData(); formData.append('file', task.file);
                xhr.send(formData);
            });
            
            if(!db.globalMusicConfig.library[task.catId]) db.globalMusicConfig.library[task.catId] = [];
            db.globalMusicConfig.library[task.catId].push({name: task.name, url: url});
            
        } catch(e) {
            window.showGlobalToast(`[${task.name}] 上传失败`, 'error');
        }
    }
    
    await window.saveDB();
    window.renderAdminMusicList();
    
    capsuleText.innerText = "全部上传完成";
    capsuleProgress.style.width = "100%";
    setTimeout(() => { capsule.classList.remove('show'); capsuleProgress.style.width = "0%"; }, 2000);
    window.isUploading = false;
}

/* ================= 8. 云端音乐分类库管理 (CRUD) ================= */
window.initAdminMusicCatSelect = function() {
    const catSel = document.getElementById('admin-music-cat'); catSel.innerHTML = '';
    const cats = db.globalMusicConfig.categories || [];
    cats.forEach(c => { catSel.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
}

window.manageMusicCategories = function() {
    const listDiv = document.getElementById('music-cat-list-edit'); listDiv.innerHTML = '';
    const cats = db.globalMusicConfig.categories || [];
    cats.forEach((cat, idx) => {
        const div = document.createElement('div'); div.style.display = 'flex'; div.style.gap = '10px'; div.style.alignItems = 'center';
        div.innerHTML = `<input type="text" style="margin:0; flex:1;" id="mcat_input_${idx}" value="${cat.name}"><button class="btn-glass" style="width:45px; height:45px; margin:0; color:#ef4444; padding:0; border-radius:12px;" onclick="window.removeMusicCategory(${idx})">✖</button>`;
        listDiv.appendChild(div);
    });
    window.showModal('music-cat-modal');
}

window.addMusicCategory = function() {
    if(!db.globalMusicConfig.categories) db.globalMusicConfig.categories = [];
    const newId = 'mcat_' + Date.now();
    db.globalMusicConfig.categories.push({ id: newId, name: '新建音乐类' });
    db.globalMusicConfig.library[newId] = [];
    window.manageMusicCategories();
}

window.removeMusicCategory = async function(idx) {
    const catId = db.globalMusicConfig.categories[idx].id;
    const linkedMusic = db.globalMusicConfig.library[catId] || [];
    if(linkedMusic.length > 0 && !confirm(`该分类下有 ${linkedMusic.length} 首音乐，确定删除分类并清空它们吗？`)) return;
    db.globalMusicConfig.categories.splice(idx, 1); delete db.globalMusicConfig.library[catId];
    window.manageMusicCategories();
}

window.saveMusicCategories = async function() {
    const cats = db.globalMusicConfig.categories || [];
    cats.forEach((cat, idx) => { const input = document.getElementById(`mcat_input_${idx}`); if(input) cat.name = input.value; });
    await window.saveDB(); window.hideModal('music-cat-modal'); window.initAdminMusicCatSelect();
}

window.manageMusicLibrary = function() { 
    window.initAdminMusicCatSelect(); document.getElementById('admin-music-search').value = '';
    window.resetMusicEdit(); window.renderAdminMusicList(); window.showModal('music-admin-modal'); window.bindAudioDragDrop(); 
}

window.filterAdminMusicList = function() { window.renderAdminMusicList(); }

window.renderAdminMusicList = function() {
    const catId = document.getElementById('admin-music-cat').value;
    const query = document.getElementById('admin-music-search').value.trim().toLowerCase();
    const listDiv = document.getElementById('admin-music-list'); listDiv.innerHTML = '';
    if(!catId) { listDiv.innerHTML = `<div style="padding:15px; opacity:0.5; text-align:center;">请先添加音乐分类</div>`; return; }

    const list = db.globalMusicConfig.library[catId] || [];
    let matchCount = 0;
    
    list.forEach((m, idx) => {
        if (query && !m.name.toLowerCase().includes(query)) return; 
        matchCount++;
        const div = document.createElement('div'); 
        div.style.display='flex'; div.style.background='var(--theme-glass-bg)'; div.style.padding='15px'; div.style.borderRadius='16px'; div.style.alignItems='center'; div.style.justifyContent='space-between'; div.style.border='1px solid var(--theme-glass-border)'; div.style.boxShadow='0 4px 10px rgba(0,0,0,0.1)';
        div.innerHTML = `
            <div style="display:flex; flex-direction:column; width:65%; overflow:hidden;">
                <span style="font-weight:bold; color:var(--theme-text); font-size:1.05rem; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</span>
                <span style="font-size:0.75rem; opacity:0.6; word-break:break-all; color:var(--theme-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.url}</span>
            </div>
            <div style="display:flex; gap:8px;">
                <div class="action-icon" style="background:#4f46e5;" onclick="window.editAdminMusic('${catId}', ${idx})">✎</div>
                <div class="action-icon del" onclick="window.deleteAdminMusic('${catId}', ${idx})">✖</div>
            </div>
        `; listDiv.appendChild(div);
    });
    if (matchCount === 0) { listDiv.innerHTML = `<div style="padding:15px; opacity:0.5; text-align:center;">暂无匹配曲目</div>`; }
}

let selectedAudioFiles = [];
window.bindAudioDragDrop = function() {
    const zone = document.getElementById('music-upload-zone'); const fileInput = document.getElementById('new-music-file'); const text = document.getElementById('music-upload-text');
    zone.onclick = () => fileInput.click();
    zone.ondragover = (e) => { e.preventDefault(); zone.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'; };
    zone.ondragleave = (e) => { e.preventDefault(); zone.style.backgroundColor = 'transparent'; };
    zone.ondrop = (e) => { e.preventDefault(); zone.style.backgroundColor = 'transparent'; if(e.dataTransfer.files.length>0) handleSelectedAudios(e.dataTransfer.files); };
    fileInput.onchange = (e) => { if(e.target.files.length>0) handleSelectedAudios(e.target.files); };
    
    function handleSelectedAudios(files) {
        selectedAudioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'));
        if(selectedAudioFiles.length === 0) return alert('请选择有效的音频文件');
        
        if (selectedAudioFiles.length === 1) {
            text.innerText = `已选择: ${selectedAudioFiles[0].name} (${(selectedAudioFiles[0].size/1024/1024).toFixed(2)}MB)`;
            const nameInput = document.getElementById('new-music-name');
            if(!nameInput.value) nameInput.value = selectedAudioFiles[0].name.replace(/\.[^/.]+$/, "");
        } else {
            text.innerText = `已选择 ${selectedAudioFiles.length} 个音频文件，将批量极速上传`;
            document.getElementById('new-music-name').value = "自动取名模式";
            document.getElementById('new-music-name').disabled = true; 
        }
    }
}

window.editAdminMusic = function(catId, idx) {
    const m = db.globalMusicConfig.library[catId][idx];
    document.getElementById('new-music-name').value = m.name; document.getElementById('new-music-url').value = m.url;
    document.getElementById('edit-music-idx').value = idx;
    document.getElementById('admin-music-action-title').innerText = "✎ 修改曲目";
    document.getElementById('btn-admin-music-save').innerText = "保 存 修 改";
    document.getElementById('btn-admin-music-cancel').style.display = "block";
    document.getElementById('music-upload-zone').style.display = "none";
}

window.resetMusicEdit = function() {
    document.getElementById('new-music-name').value = ''; document.getElementById('new-music-url').value = '';
    document.getElementById('edit-music-idx').value = ''; document.getElementById('new-music-name').disabled = false;
    document.getElementById('admin-music-action-title').innerText = "+ 新增曲目";
    document.getElementById('btn-admin-music-save').innerText = "添 加 到 库";
    document.getElementById('btn-admin-music-cancel').style.display = "none";
    document.getElementById('music-upload-zone').style.display = "block";
    selectedAudioFiles = []; document.getElementById('music-upload-text').innerText = '点击或拖拽音频文件 (支持多选直传)';
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
        if (editIdx !== '') db.globalMusicConfig.library[catId][parseInt(editIdx)] = { name, url };
        else db.globalMusicConfig.library[catId].push({name, url});
        await window.saveDB(); window.resetMusicEdit(); window.renderAdminMusicList();
        return;
    }

    if(selectedAudioFiles.length > 0) {
        selectedAudioFiles.forEach(file => {
            let taskName = name === "自动取名模式" || !name ? file.name.replace(/\.[^/.]+$/, "") : name;
            window.uploadQueue.push({ file: file, catId: catId, name: taskName });
        });
        window.resetMusicEdit();
        window.hideModal('music-admin-modal');
        processUploadQueue(); 
    } else {
        alert('请拖入音频或填写链接');
    }
}
window.deleteAdminMusic = async function(catId, idx) { if(confirm('确认删除此曲？')) { db.globalMusicConfig.library[catId].splice(idx, 1); await window.saveDB(); window.renderAdminMusicList(); } }


/* ================= 9. 用户云端收藏体系与高定黑胶播放器 ================= */
let musicState = { type: 'instrumental', playlist: [], currentIndex: 0, mode: 'sequence', tracksLimit: -1 }; 

window.handleAudioEnded = function() {
    if(musicState.playlist.length === 0) return;
    
    if (musicState.tracksLimit > 0) {
        musicState.tracksLimit--;
        const limitTextEl = document.getElementById('player-limit-text');
        if(limitTextEl) limitTextEl.innerText = `⏳ 定时关闭 (剩 ${musicState.tracksLimit} 首)`;
        if (musicState.tracksLimit === 0) {
            window.pauseTrack(); musicState.tracksLimit = -1;
            if(limitTextEl) limitTextEl.innerText = `⏳ 定时/定量`;
            return; 
        }
    }

    if(musicState.mode === 'single') { audioPlayer.currentTime = 0; audioPlayer.play(); }
    else if(musicState.mode === 'random') { musicState.currentIndex = Math.floor(Math.random() * musicState.playlist.length); window.playCurrentTrack(); }
    else { musicState.currentIndex = (musicState.currentIndex + 1) % musicState.playlist.length; window.playCurrentTrack(); }
}

window.openMusicTypeModal = function() {
    const container = document.getElementById('music-type-btn-container'); container.innerHTML = '';
    const cats = db.globalMusicConfig.categories || [];
    
    if(cats.length === 0) {
        container.innerHTML = '<p style="opacity:0.5; font-size:0.9rem;">暂无音律分类，请联系管理员添加。</p>';
    } else {
        cats.forEach((cat, index) => {
            const btn = document.createElement('button');
            if (index === 0) { btn.className = 'btn-glass btn-type-blue'; } 
            else { btn.className = 'btn-glass btn-type-dark'; }
            btn.style.margin = '0'; btn.style.width = '100%'; btn.style.padding = '1.2rem'; btn.style.fontSize = '1.15rem';
            btn.innerText = cat.name;
            btn.onclick = () => window.openVinylPlayer(cat.id);
            container.appendChild(btn);
        });
    }
    window.showModal('music-type-modal');
}

window.openVinylPlayer = function(catId) {
    window.hideModal('music-type-modal'); musicState.type = catId;
    
    if (catId === 'favorites') {
        if(!currentUserAccount || !db.users[currentUserAccount].favorites) { musicState.playlist = []; } 
        else { musicState.playlist = db.users[currentUserAccount].favorites; }
    } else {
        musicState.playlist = db.globalMusicConfig.library[catId] || [];
    }

    musicState.currentIndex = 0; musicState.mode = 'sequence'; musicState.tracksLimit = -1;
    
    document.getElementById('player-mode-text').innerText = '🔁 列表循环';
    document.getElementById('player-limit-text').innerText = '⏳ 定时/定量';
    document.getElementById('vinyl-search').value = ''; 
    
    window.renderVinylPlaylist(); window.showModal('vinyl-player-modal');
    if(musicState.playlist.length > 0) window.playCurrentTrack(); else window.pauseTrack();
}

window.filterVinylPlaylist = function() { window.renderVinylPlaylist(); }

window.renderVinylPlaylist = function() {
    const box = document.getElementById('playlist-ui'); box.innerHTML = '';
    if(musicState.playlist.length === 0) { box.innerHTML = '<p style="padding:15px; opacity:0.5; text-align:center;">这里空空如也...</p>'; return; }
    
    const query = document.getElementById('vinyl-search').value.toLowerCase().trim();
    
    musicState.playlist.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `netease-item ${idx === musicState.currentIndex ? 'active' : ''}`;
        item.id = `track-item-${idx}`; 
        
        if(query && !track.name.toLowerCase().includes(query)) { item.style.display = 'none'; }
        
        const numPad = (idx + 1).toString().padStart(2, '0');
        item.innerHTML = `
            <div class="netease-index">${numPad}</div>
            <div class="netease-info"><div class="netease-title">${track.name}</div></div>
            <div class="netease-action">▶</div>
        `;
        item.onclick = () => { musicState.currentIndex = idx; window.playCurrentTrack(); };
        box.appendChild(item);
    });
}

// 防抖处理收藏按钮避免频繁读写 R2
let favDebounce = null;
window.toggleFavorite = async function() {
    if(!currentUserAccount) return window.showGlobalToast('请先登录即可收藏', 'error');
    if(musicState.playlist.length === 0) return;
    
    if(favDebounce) clearTimeout(favDebounce);
    
    const track = musicState.playlist[musicState.currentIndex];
    if(!db.users[currentUserAccount].favorites) db.users[currentUserAccount].favorites = [];
    
    const favs = db.users[currentUserAccount].favorites;
    const index = favs.findIndex(f => f.url === track.url);
    
    if(index > -1) {
        favs.splice(index, 1);
        document.getElementById('btn-favorite').innerText = '🤍';
        window.showGlobalToast('已取消收藏', 'success');
    } else {
        favs.push({name: track.name, url: track.url});
        document.getElementById('btn-favorite').innerText = '❤️';
        window.showGlobalToast('已存入云端收藏', 'success');
    }
    
    favDebounce = setTimeout(async () => {
        await window.saveDB();
        if (musicState.type === 'favorites') {
            musicState.playlist = db.users[currentUserAccount].favorites;
            window.renderVinylPlaylist();
        }
    }, 1000);
}

window.playCurrentTrack = function() {
    if(musicState.playlist.length === 0) return;
    const track = musicState.playlist[musicState.currentIndex];
    document.getElementById('player-track-name').innerText = track.name;
    
    if (currentUserAccount && db.users[currentUserAccount].favorites) {
        const isFav = db.users[currentUserAccount].favorites.findIndex(f => f.url === track.url) > -1;
        document.getElementById('btn-favorite').innerText = isFav ? '❤️' : '🤍';
    } else { document.getElementById('btn-favorite').innerText = '🤍'; }

    if(audioPlayer.src !== track.url) audioPlayer.src = track.url;
    audioPlayer.volume = 1; audioPlayer.play().then(() => {
        document.getElementById('vinyl-disc-ui').classList.add('playing'); 
        document.getElementById('btn-play-pause').innerText = '⏸️';
    }).catch(e=>{});
    
    window.renderVinylPlaylist();
    const activeItem = document.getElementById(`track-item-${musicState.currentIndex}`);
    if(activeItem) { activeItem.scrollIntoView({ behavior: "smooth", block: "center" }); }
}

window.pauseTrack = function() { audioPlayer.pause(); document.getElementById('vinyl-disc-ui').classList.remove('playing'); document.getElementById('btn-play-pause').innerText = '▶️'; }
window.togglePlayPause = function() { if(audioPlayer.paused) window.playCurrentTrack(); else window.pauseTrack(); }
window.prevTrack = function() { if(musicState.playlist.length===0)return; musicState.currentIndex = (musicState.currentIndex - 1 + musicState.playlist.length) % musicState.playlist.length; window.playCurrentTrack(); }
window.nextTrack = function() { if(musicState.playlist.length===0)return; musicState.currentIndex = (musicState.currentIndex + 1) % musicState.playlist.length; window.playCurrentTrack(); }

window.changePlayMode = function() {
    const btn = document.getElementById('btn-play-mode'); const text = document.getElementById('player-mode-text');
    if(musicState.mode === 'sequence') { musicState.mode = 'random'; btn.innerText = '🔀'; text.innerText = '🔀 随机播放'; }
    else if(musicState.mode === 'random') { musicState.mode = 'single'; btn.innerText = '🔂'; text.innerText = '🔂 单曲循环'; }
    else { musicState.mode = 'sequence'; btn.innerText = '🔁'; text.innerText = '🔁 列表顺序播放'; }
}

window.setTrackLimit = function() {
    let val = prompt("请输入播放几首歌曲后自动暂停？\n(输入数字，留空或0表示无限播放)：", "");
    if (val === null) return; val = parseInt(val);
    const limitTextEl = document.getElementById('player-limit-text');
    if (isNaN(val) || val <= 0) { musicState.tracksLimit = -1; limitTextEl.innerText = "⏳ 定时/定量"; } 
    else { musicState.tracksLimit = val; limitTextEl.innerText = `⏳ 定时关闭 (剩 ${musicState.tracksLimit} 首)`; }
}

window.closeVinylPlayer = function() { window.hideModal('vinyl-player-modal'); }
window.showPlayerFromFloat = function() { if(state.isLoggedIn && !state.isEditMode && document.getElementById('vinyl-player-modal').style.display !== 'flex') window.showModal('vinyl-player-modal'); }


/* ================= 10. 用户卡片交互引擎 (无缝后台播放) ================= */
window.startCardFlow = function(card) {
    state.currentCard = card; document.getElementById('prep-text').innerText = db.stages[state.stage].prepText;
    const prepBtn = document.getElementById('btn-prep-confirm');
    if (state.stage === '单身期') { prepBtn.innerText = '我已准备好'; } else { prepBtn.innerText = '我们已预备好'; }
    window.navigateTo('screen-prep');
}

window.confirmPrepAndNavigate = function() {
    if (state.stage === '单身期') {
        const syncBox = document.getElementById('sync-animation-box'); syncBox.classList.remove('merged');
        const iconB64 = db.stages[state.stage].icon; const bgStyle = iconB64 ? `background-image: url(${iconB64});` : `background: var(--theme-primary);`;
        document.getElementById('sync-title').innerText = "抬头仰望";
        const catName = db.stages[state.stage].categories.find(c => c.id === state.activeCategoryId)?.name || '';
        let subText = "愿你在静谧中得着内心的力量与安宁。";
        if (catName.includes('不想') || catName.includes('单身')) subText = "在独处中享受生命的丰盈与自由，愿你拥有前行的勇气与光芒。";
        else if (catName.includes('想') || catName.includes('进入婚姻')) subText = "愿你在等待的时光里被温柔以待，美好的遇见正在路上。";
        document.getElementById('sync-subtitle').innerText = subText;
        document.getElementById('btn-sync-confirm').innerText = "抬 头 仰 望";
        document.getElementById('press-text-label').innerHTML = "内心宣告<br>(长按)";
        syncBox.innerHTML = `<div class="sync-half single-up" style="${bgStyle} background-size: cover; border-radius: 50%;"></div>`;
        window.navigateTo('screen-sync');
    } else {
        document.getElementById('sync-title').innerText = "双向奔赴"; document.getElementById('sync-subtitle').innerText = "确认手机贴合后，点击合并";
        document.getElementById('btn-sync-confirm').innerText = "确 认 合 并"; document.getElementById('press-text-label').innerHTML = "同心宣告<br>(长按)";
        window.navigateTo('screen-role');
    }
}

window.selectRole = function(role) {
    state.role = role; const syncBox = document.getElementById('sync-animation-box'); syncBox.classList.remove('merged');
    const iconB64 = db.stages[state.stage].icon; const bgStyle = iconB64 ? `background-image: url(${iconB64});` : `background: var(--theme-primary);`;
    if (role === 'boy') syncBox.innerHTML = `<div class="sync-half boy" style="${bgStyle} background-size: cover;"></div>`;
    else syncBox.innerHTML = `<div class="sync-half girl" style="${bgStyle} background-size: cover;"></div>`;
    window.navigateTo('screen-sync');
}

window.triggerSync = function() {
    document.getElementById('sync-animation-box').classList.add('merged'); state.currentStep = 0;
    setTimeout(() => { window.renderContentStep(); window.navigateTo('screen-content'); }, 1800);
}

window.renderContentStep = function() {
    const stepData = state.currentCard.steps[state.currentStep];
    document.getElementById('content-type-title').innerText = `【${state.currentCard.type}】的连结`;
    document.getElementById('step-title').innerText = stepData.title;
    document.getElementById('step-text').innerHTML = stepData.text.replace(/\n/g, '<br><br>');
    for(let i=1; i<=3; i++) { const dot = document.getElementById(`dot-${i}`); if (i - 1 === state.currentStep) dot.classList.add('active'); else dot.classList.remove('active'); }
    const nextBtn = document.getElementById('btn-next-step'); const longPressBtn = document.getElementById('btn-long-press');
    if (state.currentStep < 2) { nextBtn.style.display = 'flex'; longPressBtn.style.display = 'none'; } else { nextBtn.style.display = 'none'; longPressBtn.style.display = 'flex'; }
}

window.nextContentStep = function() {
    if (state.currentStep < 2) {
        state.currentStep++; const t = document.getElementById('step-title'); const p = document.getElementById('step-text');
        t.style.opacity = 0; p.style.opacity = 0;
        setTimeout(() => { window.renderContentStep(); t.style.transition = 'opacity 0.5s'; p.style.transition = 'opacity 0.5s'; t.style.opacity = 1; p.style.opacity = 1; }, 300);
    }
}

const pressFill = document.getElementById('press-fill');
let progress = 0; let pressFrame = null; let isPressing = false;

window.startPress = function(e) {
    if(e.type === 'touchstart') e.preventDefault(); if(isPressing) return;
    isPressing = true; progress = 0; cancelAnimationFrame(pressFrame);
    function up() { if(!isPressing) return; progress += (100/90); pressFill.style.height = `${Math.min(progress, 100)}%`; if (progress >= 100) { isPressing = false; completeAction(); } else pressFrame = requestAnimationFrame(up); }
    pressFrame = requestAnimationFrame(up);
}
window.endPress = function(e) { if(e.type === 'touchend') e.preventDefault(); isPressing = false; cancelAnimationFrame(pressFrame); if (progress < 100) { progress = 0; pressFill.style.height = `0%`; } }
function completeAction() { cancelAnimationFrame(pressFrame); window.navigateTo('screen-finish'); }

window.resetToStage = function() {
    pressFill.style.height = `0%`;
    state.currentCard = null; state.role = ''; state.currentStep = 0;
    initStageScreen();
}
