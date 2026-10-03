/**
 * 恒久印记 - 终极安全防御盾 (Security Shield Engine)
 * 功能：反调试、防扒站、防抓取、禁用右键/复制/审查元素
 */
(function() {
    console.log("%c 🛡️ 恒久印记安全引擎已启动", "color:#d4af37; font-size: 14px; font-weight: bold;");

    // ==========================================
    // 🛡️ 防线 1：拦截所有开发者快捷键 (F12, 查看源码等)
    // ==========================================
    document.addEventListener('keydown', function(e) {
        // 拦截 F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault(); return false;
        }
        // 拦截 Ctrl+Shift+I / Cmd+Option+I (审查元素)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault(); return false;
        }
        // 拦截 Ctrl+Shift+J (控制台)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault(); return false;
        }
        // 拦截 Ctrl+U / Cmd+U (查看网页源代码)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault(); return false;
        }
        // 拦截 Ctrl+S / Cmd+S (保存网页到本地)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
            e.preventDefault(); return false;
        }
        // 拦截 Ctrl+P / Cmd+P (打印网页为PDF)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'P' || e.key === 'p')) {
            e.preventDefault(); return false;
        }
    });

    // ==========================================
    // 🛡️ 防线 2：智能禁用右键菜单与文本选择
    // ==========================================
    document.addEventListener('contextmenu', function(e) {
        // 允许在输入框内右键（比如需要粘贴卡密），其余区域全部封死右键
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    document.addEventListener('selectstart', function(e) {
        // 允许输入框内的文字被选中，其余页面文字禁止选中和高亮
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    document.addEventListener('copy', function(e) {
        // 防止别人通过快捷键复制你的页面文案
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // ==========================================
    // 🛡️ 防线 3：反调试黑洞陷阱 (无限 Debugger)
    // ==========================================
    // 如果攻击者强行通过菜单打开了开发者工具，这个函数会让他们陷入无限断点死循环，直接卡死控制台
    function blockDebugger() {
        setInterval(function() {
            (function() { return false; })['constructor']('debugger')['call']();
        }, 50);
    }
    try { blockDebugger(); } catch (err) {}

    // ==========================================
    // 🛡️ 防线 4：执行时间差探针 (终极反扒机制)
    // ==========================================
    // JS 正常的执行间隔是恒定的。如果间隔突然变长，说明浏览器被攻击者的调试器强行挂起了（Paused in debugger）
    let startProbe = Date.now();
    setInterval(() => {
        let endProbe = Date.now();
        if (endProbe - startProbe > 150) { // 延迟超过 150ms，必定是打开了开发者工具
            // 瞬间清空网页，让对方看到白板，什么代码都扒不到
            document.body.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#111; color:#ef4444; font-size:20px; font-weight:bold;">⚠️ 非法操作：时空印记防御矩阵已启动，访问被切断。</div>';
        }
        startProbe = Date.now();
    }, 50);

    // ==========================================
    // 🛡️ 防线 5：防本地运行 (防止源码被下载后在本地偷跑)
    // ==========================================
    if (window.location.protocol === 'file:') {
        alert("禁止在本地环境运行，请通过官方服务器访问！");
        document.body.innerHTML = '';
    }

})();
