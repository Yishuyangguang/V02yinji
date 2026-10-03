/**
 * 恒久印记 - 智能安全防御盾 V3.0 (Smart Shield)
 * 特性：站长免检通行、温和防御、不干扰主线程、杜绝误伤
 */
(function() {
    // 🚀 核心更新：站长免检通道（白名单机制）
    // 如果检测到当前是管理员登录状态，直接终止防御，放行所有操作！
    if (localStorage.getItem('isAdminAuth') === 'true') {
        console.log("%c 🛡️ 站长您好，防御矩阵已为您主动休眠，祝您畅快管理！", "color:#10b981; font-size: 14px; font-weight: bold;");
        return; // 直接退出函数，后面的防御代码对你完全无效！
    }

    console.log("%c 🛡️ 恒久印记安全引擎已启动", "color:#d4af37; font-size: 12px;");

    // ==========================================
    // 下方是针对普通用户的常规防御（不含任何自毁逻辑，只做物理拦截）
    // ==========================================

    // 1. 基础防护：拦截开发者快捷键 (F12, 审查元素, 保存, 打印)
    document.addEventListener('keydown', function(e) {
        const forbiddenKeys = ['F12', 'I', 'i', 'J', 'j', 'U', 'u', 'S', 's', 'P', 'p', 'C', 'c'];
        if (e.key === 'F12' || e.keyCode === 123) { 
            e.preventDefault(); return false; 
        }
        if ((e.ctrlKey || e.metaKey) && (e.shiftKey || forbiddenKeys.includes(e.key))) {
            // 放行输入框内的全选(Ctrl+A)或复制(Ctrl+C)
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault(); return false;
            }
        }
    });

    // 2. 行为限制：智能禁用右键菜单、复制、文本选择、拖拽
    const preventAction = (e) => {
        // 允许用户在输入框（如登录填密码、卡密）里右键粘贴或选中
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    };
    
    document.addEventListener('contextmenu', preventAction); // 禁右键
    document.addEventListener('selectstart', preventAction); // 禁选中
    document.addEventListener('copy', preventAction);        // 禁复制
    document.addEventListener('dragstart', preventAction);   // 禁拖拽图片
})();
