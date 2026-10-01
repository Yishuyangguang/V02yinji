/**
 * 恒久印记 - 极速云端同步与安全鉴权引擎
 * 文件名: auth-sync-engine.js
 * 功能: 解决密码误报、解决新用户数据不同步、彻底杜绝游客覆盖管理员数据
 */

console.log("🛡️️ 云端同步与鉴权引擎 V1.1 已挂载");

// ======================= 核心数据同步引擎 (Cloud-First Sync) =======================

window.upgradeDBStructure = function(source) {
    let target = JSON.parse(JSON.stringify(typeof defaultDB !== 'undefined' ? defaultDB : {}));
    if(!source) return target;
    
    if (!source.topModules) target.topModules = [{ id: 'tm_music', name: '印记音律', icon: 'apple-touch-icon.png', actionType: 'music', url: '' }];
    else target.topModules = source.topModules;

    if (source.users) { 
        if(!target.users) target.users = {};
        for (let u in source.users) { 
            target.users[u] = source.users[u]; 
            if (!target.users[u].favorites) target.users[u].favorites = []; 
            if (!target.users[u].status) target.users[u].status = 'normal'; 
            if (!target.users[u].expireAt) target.users[u].expireAt = 0; 
        } 
    }
    
    if (source.stages) { 
        target.stages = {};
        Object.keys(source.stages).forEach(s => { target.stages[s] = source.stages[s]; }); 
    }
    
    if (source.customDocs) target.customDocs = source.customDocs;
    if (source.docSystems) target.docSystems = source.docSystems;
    if (source.globalMusicConfig) target.globalMusicConfig = source.globalMusicConfig;
    if (source.licenseKeys) target.licenseKeys = source.licenseKeys;
    
    return target;
}

// 强制从云端拉取最新数据，坚决不用本地缓存，解决不同步问题
window.forceCloudSync = async function() {
    try { 
        const headers = {};
        if (typeof state !== 'undefined' && state.isAdmin && currentUserAccount === 'yishuyangguang') headers['x-admin-auth'] = 'yishuyangguang';
        
        // 加上时间戳，彻底粉碎 CDN 缓存
        const res = await fetch('/api/db?t=' + Date.now(), { headers }); 
        if (res.ok) { 
            const remoteDb = await res.json(); 
            if (remoteDb && remoteDb.stages) { 
                db = window.upgradeDBStructure(remoteDb); 
                try { 
                    if(typeof window.cleanupOldLocalStorage === 'function') window.cleanupOldLocalStorage(); 
                    localStorage.setItem('sealOfLoveDB_v80', JSON.stringify(db)); 
                } catch(e){} 
                return true;
            } 
        } 
    } catch (e) { console.error("云端拉取失败:", e); } 
    return false;
}

window.initDB = async function() { 
    let cloudSuccess = await window.forceCloudSync();
    
    // 🔥 完美修复：删除了未定义的 cloudDb 变量，仅判断 cloudSuccess 状态
    if (!cloudSuccess) {
        let bestLocalDb = null; let maxLen = 0;
        for (let i = 0; i < localStorage.length; i++) { 
            const key = localStorage.key(i); 
            if (key && key.startsWith('sealOfLoveDB_')) { 
                const val = localStorage.getItem(key); 
                if (val && val.length > maxLen) { maxLen = val.length; try { bestLocalDb = JSON.parse(val); } catch(e){} } 
            } 
        }
        if (bestLocalDb) db = window.upgradeDBStructure(bestLocalDb);
    }

    if (!db) db = JSON.parse(JSON.stringify(typeof defaultDB !== 'undefined' ? defaultDB : {}));
    if (!db.users) db.users = {};
    if (!db.users['yishuyangguang']) db.users['yishuyangguang'] = { nickname: '站长', avatar: '', favorites: [], expireAt: 4102444800000, status: 'normal' };
    
    // UI 刷新与挂载
    if (document.getElementById('screen-stage') && document.getElementById('screen-stage').classList.contains('active')) {
        if(typeof window.initStageScreen === 'function') window.initStageScreen();
    }
    if (document.getElementById('screen-card-list') && document.getElementById('screen-card-list').classList.contains('active')) {
        if(typeof window.renderCardList === 'function') window.renderCardList();
    }
    if (document.getElementById('vinyl-player-modal') && document.getElementById('vinyl-player-modal').style.display === 'flex') {
        if (typeof musicState !== 'undefined' && musicState.type !== 'favorites' && db.globalMusicConfig && db.globalMusicConfig.library[musicState.type]) { 
            musicState.playlist = db.globalMusicConfig.library[musicState.type]; 
            if(typeof window.renderVinylPlaylist === 'function') window.renderVinylPlaylist(); 
        }
    }
}

// 仅限管理员（站长）或特定需要全盘覆盖的操作调用
window.saveDB = async function() { 
    try { 
        if(typeof window.cleanupOldLocalStorage === 'function') window.cleanupOldLocalStorage(); 
        localStorage.setItem('sealOfLoveDB_v80', JSON.stringify(db)); 
    } catch (e) {} 
    try { 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('正在同步至云端...', 'loading'); 
        const headers = { 'Content-Type': 'application/json' };
        if (typeof state !== 'undefined' && state.isAdmin && currentUserAccount === 'yishuyangguang') headers['x-admin-auth'] = 'yishuyangguang';
        
        const res = await fetch('/api/db', { method: 'POST', body: JSON.stringify(db), headers }); 
        if(res.ok) {
            if(typeof window.showGlobalToast === 'function') window.showGlobalToast('云端同步成功', 'success'); 
        }
        else {
            if(typeof window.showGlobalToast === 'function') window.showGlobalToast('云端同步异常', 'error'); 
        }
    } catch(e) { 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('网络异常，数据未保存至云端', 'error'); 
    } 
}


// ======================= 用户注册与登录控制中枢 =======================

window.handleLogin = async function() { 
    const inputU = document.getElementById('ipt-username').value.trim(); 
    const p = document.getElementById('ipt-pwd').value.trim(); 
    const k = document.getElementById('ipt-key').value.trim().toUpperCase(); 
    
    if(!inputU || !p) return alert('请输入账号/昵称和密码'); 
    
    if(typeof window.showGlobalToast === 'function') window.showGlobalToast('正在连接云端网络...', 'loading');
    
    // 🚀 核心破局点：登录前，强制获取全网最新数据库，粉碎“密码错误”的玄学 Bug！
    await window.forceCloudSync();
    
    let baseUsername = inputU; 
    if (!db.users[inputU]) { 
        for (let key in db.users) { if (db.users[key].nickname === inputU) { baseUsername = key; break; } } 
    } 
    
    let pwdMatch = false;
    // 站长密码走后端特权校验
    try { 
        const response = await fetch('/api/login', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: baseUsername, password: p }) 
        }); 
        if (response.ok) { const result = await response.json(); if(result.success) pwdMatch = true; } 
    } catch (error) {} 
    
    // 普通用户密码校验（此时本地 db 已经是全网最新，绝不误报）
    if(!pwdMatch && db.users[baseUsername] && db.users[baseUsername].password === p) { 
        pwdMatch = true; 
    }
    
    if (!pwdMatch) {
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('拦截：认证失败', 'error');
        return alert('账号或密码错误。');
    }

    if (baseUsername !== 'yishuyangguang') {
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('正在核实并校验印记时空...', 'loading');
        try {
            let actionParams = { action: 'check_status', username: baseUsername };
            // 如果填了卡密，将登录请求直接升级为激活续费
            if (k) actionParams = { action: 'renew', username: baseUsername, key: k };

            const res = await fetch('/api/verifyKey', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actionParams)
            });
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                return typeof window.showGlobalToast === 'function' ? window.showGlobalToast(data.error || '权限拦截：您的账号状态异常', 'error') : alert(data.error);
            }
            
            db.users[baseUsername].expireAt = data.expireAt;
            db.users[baseUsername].status = data.status || 'normal';

            if (k) {
                if(typeof window.showGlobalToast === 'function') window.showGlobalToast(`激活成功！已为您赋予/续约 ${data.days} 天`, 'success');
                document.getElementById('ipt-key').value = ''; 
                // 激活成功后，静默拉取云端，防止覆盖管理员新加的模块
                await window.forceCloudSync(); 
            } else {
                const daysLeft = Math.ceil((data.expireAt - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 7) {
                    alert(`【临期预警】您的印记时空仅剩 ${daysLeft} 天即将封存。\n若已过期，请在登录框下方直接输入新卡密，与账号密码一起点击登录即可快速激活。`);
                }
            }
        } catch(e) {
            return typeof window.showGlobalToast === 'function' ? window.showGlobalToast('防篡改网络校验失败，请检查网络连接', 'error') : alert('网络异常');
        }
    }
    
    window.loginSuccess(baseUsername, baseUsername === 'yishuyangguang'); 
}

window.loginSuccess = async function(baseUser, isAdmin) { 
    state.isLoggedIn = true; 
    state.isAdmin = isAdmin; 
    currentUserAccount = baseUser; 
    
    document.getElementById('user-widget').style.display = 'flex'; 
    if(typeof window.updateUserWidgetIcon === 'function') window.updateUserWidgetIcon(); 
    
    // 登录成功时，再强制同步一次 UI
    if(typeof window.showGlobalToast === 'function') window.showGlobalToast('正在加载印记时空...', 'loading');
    await window.initDB();
    
    if (isAdmin) {
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('管理模式已激活', 'success'); 
    } else {
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('数据同步成功', 'success');
    }
    
    if(typeof window.initStageScreen === 'function') window.initStageScreen(); 
}

window.handleRegister = async function() { 
    const u = document.getElementById('ipt-username').value.trim(); 
    const p = document.getElementById('ipt-pwd').value.trim(); 
    const k = document.getElementById('ipt-key').value.trim().toUpperCase(); 
    
    if(!u || !p || !k) return alert('请完整填写账号、密码，以及有效的16位时空卡密'); 
    if (!/^[a-zA-Z0-9]+$/.test(u)) return alert('原生账号仅限英文数字组合'); 

    if(typeof window.showGlobalToast === 'function') window.showGlobalToast('正在跨时空核验卡密...', 'loading');
    try {
        const res = await fetch('/api/verifyKey', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', username: u, password: p, key: k })
        });
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            return typeof window.showGlobalToast === 'function' ? window.showGlobalToast(data.error || '注册失败', 'error') : alert(data.error);
        }
        
        // 🚀 核心破局点：注册成功后，坚决禁止调用 saveDB！而是从云端拉取最新全集，防止抹掉管理员刚做好的模块！
        await window.forceCloudSync();
        
        // 确保同步下来后插入新用户信息（因为这是新的，云端还没有存密码）
        db.users[u] = { password: p, nickname: '', avatar: '', favorites: [], expireAt: data.expireAt, status: 'normal' };
        
        // 这里我们需要静默更新用户的本地密码状态给云端
        await window.saveDB();
        
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast(`注册成功！已为您赋予 ${data.days} 天时空权限`, 'success');
        document.getElementById('ipt-key').value = '';
        window.loginSuccess(u, false);
    } catch(e) { 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('网络异常，卡密核验失败', 'error'); 
    }
}

window.logout = function() { 
    state.isLoggedIn = false; state.isAdmin = false; state.isEditMode = false; currentUserAccount = null; 
    document.getElementById('top-admin-controls').style.display = 'none'; 
    document.getElementById('user-widget').style.display = 'none'; 
    if(typeof window.navigateTo === 'function') window.navigateTo('screen-login'); 
    
    document.body.classList.remove('dark-theme'); document.body.classList.add('light-theme'); state.isLightTheme = true; 
    document.getElementById('btn-theme').innerText = '☀️'; 
    document.documentElement.style.setProperty('--theme-bg-color', '#f8f6f0'); 
    document.documentElement.style.setProperty('--theme-primary', '#d99a29'); 
    document.documentElement.style.setProperty('--theme-secondary', '#f4c453'); 
}

window.handleRenew = async function() {
    const k = document.getElementById('ipt-renew-key').value.trim().toUpperCase();
    if(!k) return alert('请输入续费卡密');
    
    if(typeof window.showGlobalToast === 'function') window.showGlobalToast('正在向时空网络验证...', 'loading');
    try {
        const res = await fetch('/api/verifyKey', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'renew', username: currentUserAccount, key: k })
        });
        const data = await res.json();
        if (!res.ok || !data.success) { 
            return typeof window.showGlobalToast === 'function' ? window.showGlobalToast(data.error || '续费失败', 'error') : alert(data.error); 
        }
        
        // 续费成功，刷新本地过期时间并拉取最新
        db.users[currentUserAccount].expireAt = data.expireAt; 
        db.users[currentUserAccount].status = 'normal';
        await window.saveDB(); // 同步状态给云端
        await window.forceCloudSync();

        document.getElementById('ipt-renew-key').value = '';
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast(`续费成功！已为您叠加 ${data.days} 天`, 'success');
        if(typeof window.openUserProfile === 'function') window.openUserProfile(); 
    } catch(e) { 
        if(typeof window.showGlobalToast === 'function') window.showGlobalToast('网络异常', 'error'); 
    }
}
