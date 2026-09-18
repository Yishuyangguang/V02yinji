/**
 * 恒久印记 - 卡片纯净排版引擎 (去除冗余副标题 + 沉浸式阅读动画)
 * 文件名: card-purifier.js
 * 说明: 通过在 index.html 底部引入此文件，即可完美抹除多余连结文本并增加动画。
 */
(function initPurifier() {
    // =====================================================================
    // 模块一：UI 视觉净化与沉浸式排版动画
    // =====================================================================
    if (!document.getElementById('purifier-style')) {
        const style = document.createElement('style');
        style.id = 'purifier-style';
        style.innerHTML = `
            /* 1. 彻底隐藏所有时期的【脑/心/手】的连结副标题 */
            #content-type-title {
                display: none !important;
            }

            /* 2. 为剩余的核心内容（认知、操练、宣告）增加沉浸式聚焦排版 */
            #step-title {
                font-size: 2.2rem !important; /* 放大核心标题，增强视觉焦点 */
                margin-bottom: 2.5rem !important;
                letter-spacing: 2px;
                opacity: 0;
                animation: fadeUpIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            
            #step-text {
                font-size: 1.25rem !important; /* 放大正文内容，阅读更舒适 */
                line-height: 2.4 !important;
                opacity: 0;
                /* 正文比标题延迟 0.15 秒出现，形成优美的视觉层次感 */
                animation: fadeUpIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s forwards; 
            }

            @keyframes fadeUpIn {
                0% { opacity: 0; transform: translateY(15px); }
                100% { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // =====================================================================
    // 模块二：智能探针轮询 (劫持渲染核心，彻底剥离冗余数据并注入动画)
    // =====================================================================
    function applyPurifier() {
        // 探测主程序的 renderContentStep 是否已经加载至内存，并且防止重复接管
        if (typeof window.renderContentStep === 'function' && !window.renderContentStep.isPurified) {
            
            const originalRenderContentStep = window.renderContentStep;
            
            window.renderContentStep = function() {
                // 1. 让原生程序先执行数据的填充工作
                if (typeof originalRenderContentStep === 'function') {
                    originalRenderContentStep.apply(this, arguments);
                }

                // 2. 物理清空副标题的内容（双重保险，防止被其他脚本意外捕获读取到）
                const typeTitle = document.getElementById('content-type-title');
                if (typeTitle) {
                    typeTitle.innerText = '';
                    typeTitle.innerHTML = '';
                }
                
                // 3. 重置 DOM 动画状态：让用户每次点击“进入下一步”时，都能重新看到绝美的上浮显影动画
                const stepTitle = document.getElementById('step-title');
                const stepText = document.getElementById('step-text');
                
                if (stepTitle) {
                    stepTitle.style.animation = 'none';
                    void stepTitle.offsetWidth; // 魔法代码：强行触发浏览器重绘(Reflow)，以重置动画
                    stepTitle.style.animation = '';
                }
                if (stepText) {
                    stepText.style.animation = 'none';
                    void stepText.offsetWidth; // 强行触发重绘
                    stepText.style.animation = '';
                }
            };
            
            // 打上已净化标签，防止死循环
            window.renderContentStep.isPurified = true;

            // 探针清零：如果用户已在阅读界面，强制重渲染激活最新纯净排版
            const screenContent = document.getElementById('screen-content');
            if (screenContent && screenContent.classList.contains('active')) {
                window.renderContentStep();
            }

            console.log("卡片纯净排版与沉浸式动画引擎 [已完美接管]");

        } else if (!window.renderContentStep || !window.renderContentStep.isPurified) {
            // 原系统还没就绪，微秒级潜伏轮询 (50ms)，绝不遗漏
            setTimeout(applyPurifier, 50);
        }
    }

    // 唤醒引擎
    applyPurifier();

})();
